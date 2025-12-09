use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::time::Duration;
use tokio::time::sleep;
use tokio::spawn;
use reqwest::blocking::Client;
use std::net::TcpStream;
use crate::config::{Task, HealthCheckUnion, HealthCheck};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CheckResult {
    pub task_id: String,
    pub status: bool,
    pub message: String,
}

pub type HealthCheckCallback = Arc<dyn Fn(CheckResult) + Send + Sync + 'static>;

#[derive(Clone)]
pub struct HealthChecker {
    checks: Arc<Mutex<HashMap<String, tokio::task::JoinHandle<()>>>>,
    callback: HealthCheckCallback,
    http_client: Client,
}

impl HealthChecker {
    pub fn new(callback: HealthCheckCallback) -> Self {
        Self {
            checks: Arc::new(Mutex::new(HashMap::new())),
            callback,
            http_client: Client::new(),
        }
    }
    
    pub fn start_checking(&self, task: &Task) {
        // 从 HealthCheckUnion 中提取旧格式的 HealthCheck
        let health_check = match &task.health_check {
            Some(HealthCheckUnion::Old(hc)) => Some(hc.clone()),
            Some(HealthCheckUnion::New(_)) => {
                // 新格式暂不支持，跳过
                log::warn!("New health check format not yet supported for task: {}", task.id);
                None
            }
            None => None,
        };
        
        if let Some(health_check) = health_check {
            let task_id = task.id.clone();
            let callback = self.callback.clone();
            let http_client = self.http_client.clone();
            let task_id_for_handle = task.id.clone();
            
            // 启动健康检查任务
            let handle = spawn(async move {
                loop {
                    let result = Self::check(&health_check, &http_client);
                    let check_result = CheckResult {
                        task_id: task_id.clone(),
                        status: result.0,
                        message: result.1,
                    };
                    
                    // 调用回调
                    callback(check_result);
                    
                    // 等待指定的时间间隔
                    sleep(Duration::from_secs(health_check.interval)).await;
                }
            });
            
            // 保存任务句柄
            let mut checks = self.checks.lock().unwrap();
            checks.insert(task_id_for_handle, handle);
        }
    }
    
    pub fn stop_checking(&self, task_id: &str) {
        let mut checks = self.checks.lock().unwrap();
        if let Some(handle) = checks.remove(task_id) {
            handle.abort();
        }
    }
    
    pub fn restart_checking(&self, task: &Task) {
        self.stop_checking(&task.id);
        self.start_checking(task);
    }
    
    fn check(health_check: &HealthCheck, http_client: &Client) -> (bool, String) {
        match health_check.r#type.as_str() {
            "tcp" => Self::check_tcp(health_check),
            "http" => Self::check_http(health_check, http_client),
            _ => (false, format!("Unknown health check type: {}", health_check.r#type)),
        }
    }
    
    fn check_tcp(health_check: &HealthCheck) -> (bool, String) {
        let host = health_check.host.as_ref().map(|s| s.as_str()).unwrap_or("localhost");
        let port = health_check.port.unwrap_or(0);
        
        if port == 0 {
            return (false, "TCP port not specified".to_string());
        }
        
        match TcpStream::connect(format!("{}:{}", host, port)) {
            Ok(_) => (true, "TCP connection successful".to_string()),
            Err(e) => (false, format!("TCP connection failed: {}", e)),
        }
    }
    
    fn check_http(health_check: &HealthCheck, http_client: &Client) -> (bool, String) {
        let url = match &health_check.url {
            Some(url) => url,
            None => return (false, "HTTP URL not specified".to_string()),
        };
        
        let timeout = Duration::from_secs(health_check.timeout);
        
        match http_client.get(url).timeout(timeout).send() {
            Ok(response) => {
                if response.status().is_success() {
                    (true, format!("HTTP check successful: {}", response.status()))
                } else {
                    (false, format!("HTTP check failed: {}", response.status()))
                }
            }
            Err(e) => (false, format!("HTTP request failed: {}", e)),
        }
    }
}

impl Drop for HealthChecker {
    fn drop(&mut self) {
        // 停止所有健康检查任务
        let checks = self.checks.lock().unwrap();
        for handle in checks.values() {
            handle.abort();
        }
    }
}