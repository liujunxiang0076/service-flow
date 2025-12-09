use std::sync::{Arc, Mutex};
use std::collections::{HashSet, HashMap};
use crate::config::{Config, Service, DependencyType, StartupStrategy};
use crate::process::ProcessManager;
use thiserror::Error;
use std::time::Duration;
use std::thread;

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
    
    #[error("Conflicting service: {0} conflicts with {1}")]
    ConflictingService(String, String),
}

#[derive(Clone)]
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
    
    pub fn start_all(&self, config: &Config) -> Result<(), OrchestratorError> {
        // 保存配置
        self.set_config(config.clone());
        
        // 检查循环依赖
        self.check_dependencies(config)?;
        
        // 按依赖顺序启动所有服务
        for group in &config.groups {
            let strategy = group.startup_strategy.as_ref().unwrap_or(&StartupStrategy::Sequential);
            
            match strategy {
                StartupStrategy::Sequential => {
                    // 顺序启动
                    for service in &group.services {
                        if service.auto_start {
                            self.start_task(&service.id)?;
                            // 等待启动延迟
                            if service.startup_delay > 0 {
                                thread::sleep(Duration::from_millis(service.startup_delay));
                            }
                        }
                    }
                }
                StartupStrategy::Parallel => {
                    // 并行启动（不等待）
                    for service in &group.services {
                        if service.auto_start {
                            let _ = self.start_task(&service.id);
                        }
                    }
                }
                StartupStrategy::Mixed => {
                    // 混合模式：根据依赖关系决定
                    self.start_group_mixed(&group.id)?;
                }
            }
            
            // 组级别的启动延迟
            if group.startup_delay > 0 {
                thread::sleep(Duration::from_millis(group.startup_delay));
            }
        }
        
        Ok(())
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
        
        // 处理依赖
        if let Some(dep_configs) = &task.dependency_configs {
            // 使用详细依赖配置
            for dep_config in dep_configs {
                match dep_config.r#type {
                    DependencyType::Required => {
                        // 必需依赖：必须启动成功
                        self.start_task(&dep_config.service_id)?;
                        
                        // 等待依赖服务启动
                        if let Some(timeout) = dep_config.timeout {
                            thread::sleep(Duration::from_millis(timeout));
                        }
                    }
                    DependencyType::Optional => {
                        // 可选依赖：尝试启动，失败不影响
                        let _ = self.start_task(&dep_config.service_id);
                    }
                    DependencyType::Conflict => {
                        // 冲突依赖：检查是否运行，如果运行则报错
                        if self.pm.is_running(&dep_config.service_id) {
                            return Err(OrchestratorError::ConflictingService(
                                task_id.to_string(),
                                dep_config.service_id.clone()
                            ));
                        }
                    }
                }
            }
        } else {
            // 使用简单依赖列表（向后兼容）
            for dep_id in &task.dependencies {
                self.start_task(dep_id)?;
            }
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
        
        // 启动组内所有服务
        for service in &group.services {
            self.start_task(&service.id)?;
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
        
        // 停止组内所有服务
        for service in &group.services {
            self.stop_task(&service.id)?;
        }
        
        Ok(())
    }
    
    fn find_task<'a>(&self, task_id: &str, config: &'a Config) -> Result<&'a Service, OrchestratorError> {
        for group in &config.groups {
            for service in &group.services {
                if service.id == task_id {
                    return Ok(service);
                }
            }
        }
        Err(OrchestratorError::TaskNotFound(task_id.to_string()))
    }
    
    // 混合模式启动组
    fn start_group_mixed(&self, group_id: &str) -> Result<(), OrchestratorError> {
        let config = self.config.lock().unwrap();
        let config = config.as_ref().ok_or(OrchestratorError::GroupNotFound(group_id.to_string()))?;
        
        let group = config.groups.iter()
            .find(|g| g.id == group_id)
            .ok_or(OrchestratorError::GroupNotFound(group_id.to_string()))?;
        
        // 构建依赖图
        let mut dep_graph: HashMap<String, Vec<String>> = HashMap::new();
        for service in &group.services {
            if !service.auto_start {
                continue;
            }
            
            let deps = if let Some(dep_configs) = &service.dependency_configs {
                dep_configs.iter()
                    .filter(|d| matches!(d.r#type, DependencyType::Required))
                    .map(|d| d.service_id.clone())
                    .collect()
            } else {
                service.dependencies.clone()
            };
            
            dep_graph.insert(service.id.clone(), deps);
        }
        
        // 拓扑排序启动
        let mut started = HashSet::new();
        let mut to_start: Vec<String> = group.services.iter()
            .filter(|s| s.auto_start)
            .map(|s| s.id.clone())
            .collect();
        
        while !to_start.is_empty() {
            let mut progress = false;
            let mut next_batch = Vec::new();
            
            for service_id in &to_start {
                let deps = dep_graph.get(service_id).cloned().unwrap_or_default();
                let all_deps_started = deps.iter().all(|d| started.contains(d));
                
                if all_deps_started {
                    self.start_task(service_id)?;
                    started.insert(service_id.clone());
                    progress = true;
                } else {
                    next_batch.push(service_id.clone());
                }
            }
            
            if !progress && !next_batch.is_empty() {
                return Err(OrchestratorError::CircularDependency);
            }
            
            to_start = next_batch;
        }
        
        Ok(())
    }
    
    // 检查依赖关系是否存在循环
    fn check_dependencies(&self, config: &Config) -> Result<(), OrchestratorError> {
        let mut visited = HashSet::new();
        let mut recursion_stack = HashSet::new();
        
        // 获取所有服务ID
        let mut all_tasks = Vec::new();
        for group in &config.groups {
            for service in &group.services {
                all_tasks.push(service.id.clone());
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