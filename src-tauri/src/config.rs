use serde::{Deserialize, Serialize};
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
pub struct HealthCheck {
    pub r#type: String,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub url: Option<String>,
    pub interval: u64,
    pub timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub path: String,
    pub work_dir: String,
    pub args: String,
    pub auto_start: bool,
    pub dependencies: Vec<String>,
    pub health_check: Option<HealthCheck>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub id: String,
    pub name: String,
    pub delay: u64,
    #[serde(default)]
    pub application_id: Option<String>,
    #[serde(rename = "services")]
    pub tasks: Vec<Task>,
}

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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub settings: Settings,
    pub groups: Vec<Group>,
    #[serde(default)]
    pub applications: Vec<Application>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            settings: Settings {
                server_port: 8899,
                auto_start: false,
            },
            groups: Vec::new(),
            applications: Vec::new(),
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
            // 如果配置文件不存在，返回默认配置
            return Ok(Config::default());
        }
        
        let content = fs::read_to_string(path)?;
        let config: Config = serde_json::from_str(&content)?;
        Ok(config)
    }
    
    pub fn save(&self) -> Result<(), ConfigError> {
        let content = serde_json::to_string_pretty(&self.config)?;
        fs::write(&self.path, content)?;
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