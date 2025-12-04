use std::sync::{Arc, Mutex};
use std::collections::HashSet;
use crate::config::{Config, Task};
use crate::process::ProcessManager;
use thiserror::Error;

#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum OrchestratorError {
    #[error("Process error: {0}")]
    ProcessError(#[from] crate::process::ProcessError),
    
    #[error("Task not found: {0}")]
    TaskNotFound(String),
    
    #[error("Group not found: {0}")]
    GroupNotFound(String),
    
    #[error("Circular dependency detected")]
    CircularDependency,
}

pub struct Orchestrator {
    pm: Arc<ProcessManager>,
    config: Arc<Mutex<Option<Config>>>,
}

impl Orchestrator {
    pub fn new(pm: Arc<ProcessManager>) -> Self {
        Self {
            pm,
            config: Arc::new(Mutex::new(None)),
        }
    }
    
    pub fn set_config(&self, config: Config) {
        let mut config_guard = self.config.lock().unwrap();
        *config_guard = Some(config);
    }
    
    pub fn start_all(&self, config: &Config) {
        // 保存配置
        self.set_config(config.clone());
        
        // 按依赖顺序启动所有任务
        for group in &config.groups {
            for task in &group.tasks {
                if task.auto_start {
                    let _ = self.start_task(&task.id);
                }
            }
        }
    }
    
    pub fn start_task(&self, task_id: &str) -> Result<(), OrchestratorError> {
        let config = self.config.lock().unwrap();
        let config = config.as_ref().ok_or(OrchestratorError::TaskNotFound(task_id.to_string()))?;
        
        // 查找任务
        let task = self.find_task(task_id, config)?;
        
        // 检查任务是否已经在运行
        if self.pm.is_running(task_id) {
            return Ok(());
        }
        
        // 启动依赖任务
        for dep_id in &task.dependencies {
            self.start_task(dep_id)?;
        }
        
        // 启动当前任务
        self.pm.start(
            task_id,
            &task.path,
            task.work_dir.as_deref(),
            task.args.as_ref(),
            task.env.as_ref()
        )?;
        
        Ok(())
    }
    
    pub fn stop_task(&self, task_id: &str) -> Result<(), OrchestratorError> {
        // 停止任务
        self.pm.stop(task_id)?;
        Ok(())
    }
    
    pub fn restart_task(&self, task_id: &str) -> Result<(), OrchestratorError> {
        let config = self.config.lock().unwrap();
        let config = config.as_ref().ok_or(OrchestratorError::TaskNotFound(task_id.to_string()))?;
        
        // 查找任务
        let task = self.find_task(task_id, config)?;
        
        // 重启任务
        self.pm.restart(
            task_id,
            &task.path,
            task.work_dir.as_deref(),
            task.args.as_ref(),
            task.env.as_ref()
        )?;
        
        Ok(())
    }
    
    pub fn start_group(&self, group_id: &str) -> Result<(), OrchestratorError> {
        let config = self.config.lock().unwrap();
        let config = config.as_ref().ok_or(OrchestratorError::GroupNotFound(group_id.to_string()))?;
        
        // 查找组
        let group = config.groups.iter()
            .find(|g| g.id == group_id)
            .ok_or(OrchestratorError::GroupNotFound(group_id.to_string()))?;
        
        // 启动组内所有任务
        for task in &group.tasks {
            self.start_task(&task.id)?;
        }
        
        Ok(())
    }
    
    pub fn stop_group(&self, group_id: &str) -> Result<(), OrchestratorError> {
        let config = self.config.lock().unwrap();
        let config = config.as_ref().ok_or(OrchestratorError::GroupNotFound(group_id.to_string()))?;
        
        // 查找组
        let group = config.groups.iter()
            .find(|g| g.id == group_id)
            .ok_or(OrchestratorError::GroupNotFound(group_id.to_string()))?;
        
        // 停止组内所有任务
        for task in &group.tasks {
            self.stop_task(&task.id)?;
        }
        
        Ok(())
    }
    
    fn find_task<'a>(&self, task_id: &str, config: &'a Config) -> Result<&'a Task, OrchestratorError> {
        for group in &config.groups {
            for task in &group.tasks {
                if task.id == task_id {
                    return Ok(task);
                }
            }
        }
        Err(OrchestratorError::TaskNotFound(task_id.to_string()))
    }
    
    // 检查依赖关系是否存在循环
    #[allow(dead_code)]
    fn check_dependencies(&self, config: &Config) -> Result<(), OrchestratorError> {
        let mut visited = HashSet::new();
        let mut recursion_stack = HashSet::new();
        
        // 获取所有任务ID
        let mut all_tasks = Vec::new();
        for group in &config.groups {
            for task in &group.tasks {
                all_tasks.push(task.id.clone());
            }
        }
        
        // 对每个任务进行深度优先搜索
        for task_id in all_tasks {
            if !visited.contains(&task_id) {
                if self.dfs(&task_id, config, &mut visited, &mut recursion_stack)? {
                    return Err(OrchestratorError::CircularDependency);
                }
            }
        }
        
        Ok(())
    }
    
    // 深度优先搜索，检查循环依赖
    #[allow(dead_code)]
    fn dfs(&self, task_id: &str, config: &Config, visited: &mut HashSet<String>, recursion_stack: &mut HashSet<String>) -> Result<bool, OrchestratorError> {
        visited.insert(task_id.to_string());
        recursion_stack.insert(task_id.to_string());
        
        // 获取任务
        let task = self.find_task(task_id, config)?;
        
        // 检查依赖
        for dep_id in &task.dependencies {
            if !visited.contains(dep_id) {
                if self.dfs(dep_id, config, visited, recursion_stack)? {
                    return Ok(true);
                }
            } else if recursion_stack.contains(dep_id) {
                return Ok(true);
            }
        }
        
        recursion_stack.remove(task_id);
        Ok(false)
    }
}