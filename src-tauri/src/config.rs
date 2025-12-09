use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Failed to parse config file: {0}")]
    ParseError(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetryConfig {
    pub enabled: bool,
    pub max_retries: u32,
    pub retry_delay: u64,
    pub backoff_multiplier: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeoutConfig {
    pub start_timeout: u64,
    pub stop_timeout: u64,
    pub health_check_timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceLogConfig {
    pub enabled: bool,
    pub path: Option<String>,
    pub level: String,
    pub max_size: Option<u32>,
    pub max_files: Option<u32>,
    pub rotation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceLimits {
    pub max_memory: Option<u32>,
    pub max_cpu: Option<u32>,
    pub priority: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessConfig {
    pub kill_signal: Option<String>,
    pub graceful_shutdown_timeout: Option<u64>,
    pub restart_on_crash: Option<bool>,
    pub env_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceMetrics {
    pub cpu_usage: Option<f32>,
    pub memory_usage: Option<u64>,
    pub uptime: Option<u64>,
    pub restart_count: Option<u32>,
    pub last_exit_code: Option<i32>,
    pub last_exit_signal: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckConfig {
    pub enabled: bool,
    pub r#type: String,
    pub config: serde_json::Value,
    pub interval: u64,
    pub timeout: u64,
    pub retries: u32,
    pub failure_threshold: u32,
    pub success_threshold: u32,
    pub start_period: Option<u64>,
}

// 依赖类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DependencyType {
    Required,  // 必需依赖
    Optional,  // 可选依赖
    Conflict,  // 冲突依赖
}

// 启动策略
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StartupStrategy {
    Sequential, // 顺序启动
    Parallel,   // 并行启动
    Mixed,      // 混合模式
}

// 依赖配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DependencyConfig {
    pub service_id: String,
    pub r#type: DependencyType,
    pub timeout: Option<u64>,
    pub health_check_required: Option<bool>,
}

// 保留旧的 HealthCheck 结构体以兼容旧配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheck {
    pub r#type: String,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub url: Option<String>,
    pub interval: u64,
    pub timeout: u64,
}

// 统一的健康检查配置，支持新旧两种格式
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum HealthCheckUnion {
    New(HealthCheckConfig),
    Old(HealthCheck),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Service {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub r#type: Option<String>,
    #[serde(default)]
    pub group_id: String,
    pub path: String,
    pub work_dir: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
    pub auto_start: bool,
    #[serde(default)]
    pub startup_delay: u64,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub dependency_configs: Option<Vec<DependencyConfig>>,
    
    // 新增配置字段
    #[serde(default)]
    pub retry_config: Option<RetryConfig>,
    #[serde(default)]
    pub timeout_config: Option<TimeoutConfig>,
    #[serde(default)]
    pub log_config: Option<ServiceLogConfig>,
    #[serde(default)]
    pub resource_limits: Option<ResourceLimits>,
    #[serde(default)]
    pub process_config: Option<ProcessConfig>,
    #[serde(default)]
    pub health_check: Option<HealthCheckUnion>,
    #[serde(default)]
    pub metrics: Option<ServiceMetrics>,
    
    // 运行时信息
    #[serde(default)]
    pub pid: Option<u32>,
    #[serde(default)]
    pub started_at: Option<String>,
    #[serde(default)]
    pub exit_code: Option<i32>,
    #[serde(default)]
    pub exit_signal: Option<String>,
    #[serde(default)]
    pub crash_count: Option<u32>,
    #[serde(default)]
    pub last_crash_time: Option<String>,
}

// 保留旧的 Task 结构体作为别名，用于向后兼容
pub type Task = Service;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceGroup {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(alias = "delay")]
    pub startup_delay: u64,
    #[serde(default)]
    pub application_id: Option<String>,
    #[serde(alias = "tasks")]  // 兼容旧的 tasks 字段
    pub services: Vec<Service>,
    #[serde(default)]
    pub order: i32,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub startup_strategy: Option<StartupStrategy>,
}

// 保留旧的 Group 结构体作为别名，用于向后兼容
#[allow(dead_code)]
pub type Group = ServiceGroup;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Application {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub group_ids: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub server_port: u16,
    pub auto_start: bool,
    #[serde(default = "default_theme")]
    pub theme: String,
}

fn default_theme() -> String {
    "system".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub settings: Settings,
    pub groups: Vec<ServiceGroup>,
    #[serde(default)]
    pub applications: Vec<Application>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            settings: Settings {
                server_port: 8899,
                auto_start: false,
                theme: "system".to_string(),
            },
            groups: Vec::new(),
            applications: Vec::new(),
        }
    }
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            max_retries: 3,
            retry_delay: 1000,
            backoff_multiplier: Some(2.0),
        }
    }
}

impl Default for TimeoutConfig {
    fn default() -> Self {
        Self {
            start_timeout: 30000,
            stop_timeout: 10000,
            health_check_timeout: 5000,
        }
    }
}

pub struct ConfigManager {
    config: Config,
    path: String,
}

impl ConfigManager {
    pub fn new(path: &str) -> Result<Self, ConfigError> {
        let config = Self::load(path)?;
        Ok(Self {
            config,
            path: path.to_string(),
        })
    }
    
    pub fn load(path: &str) -> Result<Config, ConfigError> {
        if !Path::new(path).exists() {
            // 如果配置文件不存在，返回空的默认配置
            // 用户需要自己创建服务和配置
            log::info!("Config file not found at {}, using empty default configuration", path);
            return Ok(Config::default());
        }
        
        let content = fs::read_to_string(path)?;
        let config: Config = serde_json::from_str(&content)?;
        Ok(config)
    }
    
    pub fn save(&self) -> Result<(), ConfigError> {
        // 确保目标目录存在
        if let Some(parent) = Path::new(&self.path).parent() {
            fs::create_dir_all(parent)?;
        }
        
        let content = serde_json::to_string_pretty(&self.config)?;
        fs::write(&self.path, content)?;
        log::info!("Config saved successfully to: {}", self.path);
        Ok(())
    }
    
    pub fn get(&self) -> &Config {
        &self.config
    }
    
    #[allow(dead_code)]
    pub fn get_mut(&mut self) -> &mut Config {
        &mut self.config
    }
    
    pub fn set(&mut self, config: Config) {
        self.config = config;
    }
}

// 全局配置实例
lazy_static::lazy_static! {
    pub static ref CONFIG_MANAGER: std::sync::Mutex<Option<ConfigManager>> = std::sync::Mutex::new(None);
}

#[allow(dead_code)]
pub fn init(path: &str) -> Result<(), ConfigError> {
    let config_manager = ConfigManager::new(path)?;
    *CONFIG_MANAGER.lock().unwrap() = Some(config_manager);
    Ok(())
}

#[allow(dead_code)]
pub fn get_config() -> Option<Config> {
    CONFIG_MANAGER.lock().unwrap().as_ref().map(|manager| manager.get().clone())
}

#[allow(dead_code)]
pub fn save_config() -> Result<(), ConfigError> {
    if let Some(manager) = CONFIG_MANAGER.lock().unwrap().as_mut() {
        manager.save()
    } else {
        Ok(())
    }
}

#[allow(dead_code)]
pub fn update_config(config: Config) -> Result<(), ConfigError> {
    if let Some(manager) = CONFIG_MANAGER.lock().unwrap().as_mut() {
        manager.set(config);
        manager.save()
    } else {
        Ok(())
    }
}