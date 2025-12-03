use tauri::{State, AppHandle, Emitter, Manager};
use std::sync::{Arc, Mutex};
use log::info;

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
        let config_manager = config::ConfigManager::new(config_path.to_str().unwrap()).unwrap();
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
        
        // 加载配置
        let config = self.config.lock().unwrap();
        let config = config.as_ref().unwrap();
        
        // 启动自动启动的任务
        if config.get().settings.auto_start {
            self.orchestrator.start_all(config.get());
        }
        
        // 启动健康检查
        for group in &config.get().groups {
            for task in &group.tasks {
                self.health_checker.start_checking(task);
            }
        }
        
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
    let mut config = app.config.lock().unwrap();
    if let Some(manager) = config.as_mut() {
        manager.set(cfg);
        manager.save().map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub fn start_task(app: State<App>, task_id: String) -> Result<(), String> {
    app.orchestrator.start_task(&task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stop_task(app: State<App>, task_id: String) -> Result<(), String> {
    app.orchestrator.stop_task(&task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_all(app: State<App>) {
    let config = app.config.lock().unwrap();
    if let Some(manager) = config.as_ref() {
        app.orchestrator.start_all(manager.get());
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
        for task in &group.tasks {
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
        for task in &group.tasks {
            app.orchestrator.stop_task(&task.id).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}