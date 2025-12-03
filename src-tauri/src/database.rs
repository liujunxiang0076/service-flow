use sqlx::SqlitePool;
use thiserror::Error;
use std::sync::Arc;

#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum DatabaseError {
    #[error("Database connection error: {0}")]
    ConnectionError(#[from] sqlx::Error),
    
    #[error("Database initialization error: {0}")]
    InitializationError(String),
}

pub struct DatabaseManager {
    pool: Arc<SqlitePool>,
}

impl DatabaseManager {
    pub async fn new(db_path: &str) -> Result<Self, DatabaseError> {
        // 将 Windows 路径的反斜杠转换为正斜杠
        let normalized_path = db_path.replace('\\', "/");
        // 添加 mode=rwc 参数：read + write + create
        let connection_string = format!("sqlite:{}?mode=rwc", normalized_path);
        
        log::info!("Connecting to database: {}", connection_string);
        let pool = SqlitePool::connect(&connection_string)
            .await?;
        
        Ok(Self {
            pool: Arc::new(pool),
        })
    }
    
    pub async fn init(&self) -> Result<(), DatabaseError> {
        // 创建日志表
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                log TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        "#)
        .execute(&*self.pool)
        .await?;
        
        // 创建健康检查结果表
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS health_checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                status INTEGER NOT NULL,
                message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        "#)
        .execute(&*self.pool)
        .await?;
        
        Ok(())
    }
    
    #[allow(dead_code)]
    pub async fn add_log(&self, task_id: &str, log: &str) -> Result<(), DatabaseError> {
        sqlx::query(r#"
            INSERT INTO logs (task_id, log)
            VALUES (?, ?)
        "#)
        .bind(task_id)
        .bind(log)
        .execute(&*self.pool)
        .await?;
        
        Ok(())
    }
    
    #[allow(dead_code)]
    pub async fn add_health_check(&self, task_id: &str, status: bool, message: Option<&str>) -> Result<(), DatabaseError> {
        sqlx::query(r#"
            INSERT INTO health_checks (task_id, status, message)
            VALUES (?, ?, ?)
        "#)
        .bind(task_id)
        .bind(status as i32)
        .bind(message)
        .execute(&*self.pool)
        .await?;
        
        Ok(())
    }
    
    #[allow(dead_code)]
    pub async fn get_logs(&self, task_id: &str, limit: i32) -> Result<Vec<String>, DatabaseError> {
        let logs = sqlx::query_as::<_, (String,)>(r#"
            SELECT log FROM logs
            WHERE task_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        "#)
        .bind(task_id)
        .bind(limit)
        .fetch_all(&*self.pool)
        .await?;
        
        Ok(logs.into_iter().map(|(log,)| log).collect())
    }
    
    #[allow(dead_code)]
    pub async fn get_latest_health_check(&self, task_id: &str) -> Result<Option<(bool, String)>, DatabaseError> {
        let result = sqlx::query_as::<_, (i32, Option<String>)>(r#"
            SELECT status, message FROM health_checks
            WHERE task_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
        "#)
        .bind(task_id)
        .fetch_optional(&*self.pool)
        .await?;
        
        match result {
            Some((status, message)) => Ok(Some((status != 0, message.unwrap_or_default()))),
            None => Ok(None),
        }
    }
}

// 全局数据库实例
lazy_static::lazy_static! {
    pub static ref DATABASE_MANAGER: std::sync::Mutex<Option<Arc<DatabaseManager>>> = std::sync::Mutex::new(None);
}

pub async fn init(db_path: &str) -> Result<(), DatabaseError> {
    let db_manager = DatabaseManager::new(db_path).await?;
    db_manager.init().await?;
    *DATABASE_MANAGER.lock().unwrap() = Some(Arc::new(db_manager));
    Ok(())
}

#[allow(dead_code)]
pub fn get_db() -> Option<Arc<DatabaseManager>> {
    DATABASE_MANAGER.lock().unwrap().clone()
}