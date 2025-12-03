#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use log::LevelFilter;
use simple_logger::SimpleLogger;

mod app;
mod config;
mod database;
mod healthcheck;
mod orchestrator;
mod process;
mod web;

fn main() {
    // 初始化日志
    SimpleLogger::new()
        .with_level(LevelFilter::Info)
        .init()
        .unwrap();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            app::get_config,
            app::save_config,
            app::start_task,
            app::stop_task,
            app::start_all,
            app::is_task_running,
            app::get_health_check_result,
            app::get_task_pid,
            app::restart_task,
            app::start_group,
            app::stop_group,
            app::restart_health_check,
            app::stop_all_tasks
        ])
        .setup(|app| {
            // 初始化应用
            let app_instance = app::App::new(app.handle().clone());
            app_instance.startup();
            
            // 将应用实例存储到管理器中
            app.manage(app_instance);
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}