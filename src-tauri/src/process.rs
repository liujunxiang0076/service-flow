use std::process::{Command, Child, Stdio};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::thread;
use std::io::{BufRead, BufReader};
use thiserror::Error;
use sysinfo::{Pid, System, SystemExt};

#[derive(Error, Debug)]
pub enum ProcessError {
    #[error("Failed to start process: {0}")]
    StartError(String),
    
    #[error("Process not found")]
    NotFound,
    
    #[error("Failed to kill process: {0}")]
    KillError(String),
}

impl From<std::io::Error> for ProcessError {
    fn from(err: std::io::Error) -> Self {
        ProcessError::StartError(err.to_string())
    }
}

pub type LogCallback = Arc<dyn Fn(&str, &str) + Send + Sync + 'static>;

pub struct ProcessManager {
    processes: Arc<Mutex<HashMap<String, Child>>>,
    log_callback: LogCallback,
    #[allow(dead_code)]
    system: Arc<Mutex<System>>,
}

impl ProcessManager {
    pub fn new(log_callback: LogCallback) -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
            log_callback,
            system: Arc::new(Mutex::new(System::new_all())),
        }
    }
    
    pub fn start(&self, task_id: &str, path: &str, work_dir: Option<&str>, args: Option<&Vec<String>>, env: Option<&HashMap<String, String>>) -> Result<(), ProcessError> {
        let mut cmd = Command::new(path);
        
        // 设置工作目录
        if let Some(wd) = work_dir {
            cmd.current_dir(wd);
        }
        
        // 解析并添加参数
        if let Some(a) = args {
            cmd.args(a);
        }

        // 设置环境变量
        if let Some(e) = env {
            cmd.envs(e);
        }
        
        // 捕获标准输出和错误
        let child = cmd
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| ProcessError::StartError(e.to_string()))?;
        
        // 保存进程
        {
            let mut processes = self.processes.lock().unwrap();
            processes.insert(task_id.to_string(), child);
        }
        
        // 获取进程引用
        let mut processes = self.processes.lock().unwrap();
        let child = processes.get_mut(task_id).unwrap();
        
        // 处理标准输出
        let task_id_clone = task_id.to_string();
        let log_callback_clone = self.log_callback.clone();
        if let Some(stdout) = child.stdout.take() {
            thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        log_callback_clone(&task_id_clone, &line);
                    }
                }
            });
        }
        
        // 处理标准错误
        let task_id_clone = task_id.to_string();
        let log_callback_clone = self.log_callback.clone();
        if let Some(stderr) = child.stderr.take() {
            thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        log_callback_clone(&task_id_clone, &line);
                    }
                }
            });
        }
        
        Ok(())
    }
    
    pub fn stop(&self, task_id: &str) -> Result<(), ProcessError> {
        let mut processes = self.processes.lock().unwrap();
        
        if let Some(mut child) = processes.remove(task_id) {
            // 尝试优雅终止
            if let Err(e) = child.kill() {
                return Err(ProcessError::KillError(e.to_string()));
            }
            
            // 等待进程退出
            let _ = child.wait();
            
            Ok(())
        } else {
            Err(ProcessError::NotFound)
        }
    }
    
    pub fn is_running(&self, task_id: &str) -> bool {
        let mut processes = self.processes.lock().unwrap();
        
        if let Some(child) = processes.get_mut(task_id) {
            // 检查进程是否仍在运行
            match child.try_wait() {
                Ok(None) => true,  // 进程仍在运行
                Ok(Some(_)) => {
                    // 进程已退出，从映射中移除
                    processes.remove(task_id);
                    false
                }
                Err(_) => {
                    // 发生错误，假设进程已退出
                    processes.remove(task_id);
                    false
                }
            }
        } else {
            false
        }
    }
    
    pub fn get_pid(&self, task_id: &str) -> Option<u32> {
        let processes = self.processes.lock().unwrap();
        
        processes.get(task_id).map(|child| child.id())
    }
    
    pub fn restart(&self, task_id: &str, path: &str, work_dir: Option<&str>, args: Option<&Vec<String>>, env: Option<&HashMap<String, String>>) -> Result<(), ProcessError> {
        // 先停止进程
        if self.is_running(task_id) {
            self.stop(task_id)?;
        }
        
        // 再启动进程
        self.start(task_id, path, work_dir, args, env)
    }
    
    #[allow(dead_code)]
    pub fn get_all_running_tasks(&self) -> Vec<String> {
        let processes = self.processes.lock().unwrap();
        processes.keys().cloned().collect()
    }
    
    #[allow(dead_code)]
    pub fn get_process_info(&self, pid: u32) -> bool {
        let mut system = self.system.lock().unwrap();
        system.refresh_processes();
        
        // Check if process exists
        system.process(Pid::from(pid as usize)).is_some()
    }
}

impl Drop for ProcessManager {
    fn drop(&mut self) {
        // 停止所有进程
        let mut processes = self.processes.lock().unwrap();
        for (_, mut child) in processes.drain() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}