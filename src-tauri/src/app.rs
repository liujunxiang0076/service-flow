use tauri::{State, AppHandle, Emitter, Manager};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use log::info;
use chrono::Utc;
use serde::Serialize;
use sysinfo::{System, SystemExt, CpuExt, DiskExt, NetworksExt, NetworkExt};
use lazy_static::lazy_static;

use crate::config::{self, Config};
use crate::database;
use crate::healthcheck::{self, HealthChecker, CheckResult};
use crate::orchestrator::Orchestrator;
use crate::process::ProcessManager;
use crate::web::WebServer;

pub struct App {
    app_handle: AppHandle,
    config: Arc<Mutex<Option<config::ConfigManager>>>,
    process_manager: Arc<ProcessManager>,
    orchestrator: Arc<Orchestrator>,
    health_checker: Arc<HealthChecker>,
    web_server: Arc<WebServer>,
}

#[derive(Serialize)]
pub struct NetworkUsage {
    #[serde(rename = "in")]
    pub in_kb_s: f64,
    pub out: f64,
}

#[derive(Serialize)]
pub struct ServerHealthResponse {
    pub cpu: f64,
    pub memory: f64,
    pub disk: f64,
    pub network: NetworkUsage,
    pub uptime: u64,
    #[serde(rename = "lastUpdated")]
    pub last_updated: String,
    #[serde(rename = "os")]
    pub os_name: String,
    #[serde(rename = "kernel")]
    pub kernel_version: String,
    #[serde(rename = "cpuModel")]
    pub cpu_model: String,
    #[serde(rename = "totalMemory")]
    pub total_memory_human: String,
}

struct PrevNetworkSample {
    in_bytes: u64,
    out_bytes: u64,
    timestamp: Instant,
}

lazy_static! {
    static ref PREV_NETWORK: Mutex<Option<PrevNetworkSample>> = Mutex::new(None);
}

impl App {
    pub fn new(app_handle: AppHandle) -> Self {
        // 创建日志回调
        let app_handle_log = app_handle.clone();
        let log_callback = Arc::new(move |task_id: &str, log: &str| {
            // 发送日志事件到前端
            let _ = app_handle_log.emit(&format!("log:{}", task_id), log);
        });
        
        // 创建健康检查回调
        let app_handle_health = app_handle.clone();
        let health_check_callback = Arc::new(move |result: CheckResult| {
            // 发送健康检查结果到前端
            let _ = app_handle_health.emit(&format!("healthcheck:{}", result.task_id), &result);
        });
        
        // 初始化各个模块
        let process_manager = Arc::new(ProcessManager::new(log_callback));
        let orchestrator = Arc::new(Orchestrator::new(process_manager.clone()));
        let health_checker = Arc::new(HealthChecker::new(health_check_callback));
        let web_server = Arc::new(WebServer::new(8899));
        
        Self {
            app_handle,
            config: Arc::new(Mutex::new(None)),
            process_manager,
            orchestrator,
            health_checker,
            web_server,
        }
    }
    
    pub fn startup(&self) {
        info!("ServiceFlow starting up...");
        
        // 获取应用数据目录
        let app_data_dir = self.app_handle.path().app_data_dir()
            .expect("Failed to get app data directory");
        
        // 确保目录存在
        if !app_data_dir.exists() {
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");
        }
        
        // 初始化配置
        let config_path = app_data_dir.join("config.json");
        log::info!("Loading config from: {}", config_path.display());
        let config_manager = config::ConfigManager::new(config_path.to_str().unwrap())
            .map_err(|e| {
                log::error!("Failed to load config from {}: {}", config_path.display(), e);
                e
            })
            .unwrap();
        *self.config.lock().unwrap() = Some(config_manager);
        
        // 初始化数据库
        let db_path = app_data_dir.join("service-flow.db");
        let db_path_str = db_path.to_str().unwrap().to_string();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = database::init(&db_path_str).await {
                log::error!("Failed to initialize database: {}", e);
            } else {
                log::info!("Database initialized successfully at: {}", db_path_str);
            }
        });
        
        // 启动Web服务器
        let web_server = self.web_server.clone();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = web_server.run().await {
                log::error!("Failed to start web server: {}", e);
            }
        });
        
        // 注意：健康检查和自动启动已禁用，避免启动时阻塞
        // 用户可以在界面加载后手动启动服务
        
        info!("ServiceFlow started successfully");
    }
}

// 暴露给前端的方法

#[tauri::command]
pub fn get_config(app: State<App>) -> Option<Config> {
    let config = app.config.lock().unwrap();
    config.as_ref().map(|manager| manager.get().clone())
}

#[tauri::command]
pub fn save_config(app: State<App>, cfg: Config) -> Result<(), String> {
    log::info!("Received config to save. Groups: {}, Applications: {}", cfg.groups.len(), cfg.applications.len());
    let mut config = app.config.lock().unwrap();
    if let Some(manager) = config.as_mut() {
        manager.set(cfg);
        manager.save().map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub fn get_server_health() -> Result<ServerHealthResponse, String> {
    let mut system = System::new_all();
    system.refresh_all();

    // CPU usage percentage
    let cpu = system.global_cpu_info().cpu_usage() as f64;

    // Memory usage percentage
    let total_memory = system.total_memory() as f64;
    let used_memory = system.used_memory() as f64;
    let memory = if total_memory > 0.0 {
        (used_memory / total_memory) * 100.0
    } else {
        0.0
    };

    // Disk usage percentage (use first disk as representative)
    let mut disk_percent = 0.0;
    if let Some(disk) = system.disks().first() {
        let total_space = disk.total_space() as f64;
        let available_space = disk.available_space() as f64;
        if total_space > 0.0 {
            let used_space = total_space - available_space;
            disk_percent = (used_space / total_space) * 100.0;
        }
    }

    // Uptime in seconds
    let uptime = system.uptime();

    // Network throughput: compute based on delta of cumulative bytes
    let networks = system.networks();
    let mut total_in = 0u64;
    let mut total_out = 0u64;
    for (_name, data) in networks.iter() {
        total_in += data.received();
        total_out += data.transmitted();
    }

    let now = Instant::now();
    let mut prev = PREV_NETWORK.lock().map_err(|e| e.to_string())?;
    let (in_kb_s, out_kb_s) = if let Some(prev_sample) = &*prev {
        let elapsed = now.duration_since(prev_sample.timestamp).as_secs_f64();
        if elapsed > 0.0 {
            let in_delta = total_in.saturating_sub(prev_sample.in_bytes) as f64;
            let out_delta = total_out.saturating_sub(prev_sample.out_bytes) as f64;
            ((in_delta / 1024.0) / elapsed, (out_delta / 1024.0) / elapsed)
        } else {
            (0.0, 0.0)
        }
    } else {
        (0.0, 0.0)
    };

    *prev = Some(PrevNetworkSample {
        in_bytes: total_in,
        out_bytes: total_out,
        timestamp: now,
    });

    let network = NetworkUsage {
        in_kb_s,
        out: out_kb_s,
    };

    // System info
    let os_name = system
        .name()
        .unwrap_or_else(|| "Unknown OS".to_string());
    let kernel_version = system
        .kernel_version()
        .unwrap_or_else(|| "Unknown".to_string());
    let cpu_model = system
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());
    // sysinfo 的 total_memory 在不同平台单位略有差异，这里按 MB 处理，只除以 1024 得到 GB
    let total_mem_gb = (total_memory / 1024.0).max(0.0);
    let total_memory_human = format!("{:.0} GB", total_mem_gb.round());

    let last_updated = Utc::now().to_rfc3339();

    Ok(ServerHealthResponse {
        cpu,
        memory,
        disk: disk_percent,
        network,
        uptime,
        last_updated,
        os_name,
        kernel_version,
        cpu_model,
        total_memory_human,
    })
}

#[tauri::command]
pub fn start_task(app: State<App>, task_id: String) -> Result<(), String> {
    // 重新加载配置以确保使用最新的服务列表
    let config = app.config.lock().unwrap();
    if let Some(manager) = config.as_ref() {
        app.orchestrator.set_config(manager.get().clone());
    }
    drop(config);
    
    app.orchestrator.start_task(&task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stop_task(app: State<App>, task_id: String) -> Result<(), String> {
    // 重新加载配置以确保使用最新的服务列表
    let config = app.config.lock().unwrap();
    if let Some(manager) = config.as_ref() {
        app.orchestrator.set_config(manager.get().clone());
    }
    drop(config);
    
    app.orchestrator.stop_task(&task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_all(app: State<App>) {
    let config = app.config.lock().unwrap();
    if let Some(manager) = config.as_ref() {
        if let Err(e) = app.orchestrator.start_all(manager.get()) {
            log::error!("Failed to start all tasks: {}", e);
        }
    }
}

#[tauri::command]
pub fn is_task_running(app: State<App>, task_id: String) -> bool {
    app.process_manager.is_running(&task_id)
}

#[tauri::command]
pub fn get_health_check_result(_app: State<App>, _task_id: String) -> Option<healthcheck::CheckResult> {
    // 目前返回None，需要实现获取健康检查结果的逻辑
    None
}

#[tauri::command]
pub fn get_task_pid(app: State<App>, task_id: String) -> u32 {
    app.process_manager.get_pid(&task_id).unwrap_or(0)
}

#[tauri::command]
pub fn restart_task(app: State<App>, task_id: String) -> Result<(), String> {
    // 重新加载配置以确保使用最新的服务列表
    let config = app.config.lock().unwrap();
    if let Some(manager) = config.as_ref() {
        app.orchestrator.set_config(manager.get().clone());
    }
    drop(config);
    
    app.orchestrator.restart_task(&task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_group(app: State<App>, group_id: String) -> Result<(), String> {
    app.orchestrator.start_group(&group_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stop_group(app: State<App>, group_id: String) -> Result<(), String> {
    app.orchestrator.stop_group(&group_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restart_health_check(app: State<App>, task_id: String) -> Result<(), String> {
    let config = app.config.lock().unwrap();
    let config = config.as_ref().ok_or("Config not loaded".to_string())?;
    
    // 查找任务
    for group in &config.get().groups {
        for task in &group.services {
            if task.id == task_id {
                app.health_checker.restart_checking(task);
                return Ok(());
            }
        }
    }
    
    Err("Task not found".to_string())
}

#[tauri::command]
pub fn stop_all_tasks(app: State<App>) -> Result<(), String> {
    let config = app.config.lock().unwrap();
    let config = config.as_ref().ok_or("Config not loaded".to_string())?;
    
    // 停止所有任务
    for group in &config.get().groups {
        for task in &group.services {
            app.orchestrator.stop_task(&task.id).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub fn get_pid_port(pid: u32) -> Result<Option<u16>, String> {
    use std::process::Command;
    
    // Windows implementation using netstat
    #[cfg(target_os = "windows")]
    {
        // 1. 获取 netstat 输出（一次获取，多次查询）
        let output = Command::new("netstat")
            .args(&["-ano"])
            .output()
            .map_err(|e| e.to_string())?;
            
        let netstat_str = String::from_utf8_lossy(&output.stdout);
        
        // 定义内部闭包：查找指定 PID 的端口
        let find_port_for_pid = |target_pid: u32| -> Option<u16> {
            for line in netstat_str.lines() {
                // 确保包含 LISTENING 和 TCP
                if !line.contains("LISTENING") || !line.contains("TCP") {
                    continue;
                }
                
                // 分割并检查最后一个字段是否精确匹配 PID
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() < 5 {
                    continue;
                }
                
                // PID 通常在最后
                if let Ok(line_pid) = parts[parts.len() - 1].parse::<u32>() {
                    if line_pid == target_pid {
                        // 提取端口：本地地址通常是第二个字段 (parts[1])
                        let local_address = parts[1]; // 0.0.0.0:80
                        if let Some(colon_idx) = local_address.rfind(':') {
                            if let Ok(port) = local_address[colon_idx + 1..].parse::<u16>() {
                                return Some(port);
                            }
                        }
                    }
                }
            }
            None
        };

        // 2. 尝试查找主进程的端口
        if let Some(port) = find_port_for_pid(pid) {
            return Ok(Some(port));
        }

        // 3. 如果主进程没找到，尝试查找子进程（例如 Nginx Worker）
        // 使用 wmic 查找子进程: wmic process where (ParentProcessId=PID) get ProcessId
        let wmic_output = Command::new("wmic")
            .args(&["process", "where", &format!("ParentProcessId={}", pid), "get", "ProcessId"])
            .output();
            
        if let Ok(output) = wmic_output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            // wmic 输出包含表头，我们需要跳过非数字行
            for line in output_str.lines() {
                if let Ok(child_pid) = line.trim().parse::<u32>() {
                    // 找到子进程，检查端口
                    if let Some(port) = find_port_for_pid(child_pid) {
                        return Ok(Some(port));
                    }
                }
            }
        }
    }
    
    Ok(None)
}