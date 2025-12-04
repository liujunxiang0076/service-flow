import { invoke } from "@tauri-apps/api/core"
import type { Config } from "@/types/service"

export const api = {
  // Config
  getConfig: () => invoke<Config>("get_config"),
  saveConfig: (config: Config) => invoke<void>("save_config", { cfg: config }),

  // Task Management
  startTask: (taskId: string) => invoke<void>("start_task", { taskId }),
  stopTask: (taskId: string) => invoke<void>("stop_task", { taskId }),
  restartTask: (taskId: string) => invoke<void>("restart_task", { taskId }),
  startAll: () => invoke<void>("start_all"),
  stopAllTasks: () => invoke<void>("stop_all_tasks"),
  startGroup: (groupId: string) => invoke<void>("start_group", { groupId }),
  stopGroup: (groupId: string) => invoke<void>("stop_group", { groupId }),

  // Status & Info
  isTaskRunning: (taskId: string) => invoke<boolean>("is_task_running", { taskId }),
  getTaskPid: (taskId: string) => invoke<number>("get_task_pid", { taskId }),
  
  // Health Check
  getHealthCheckResult: (taskId: string) => invoke<any>("get_health_check_result", { taskId }),
  restartHealthCheck: (taskId: string) => invoke<void>("restart_health_check", { taskId }),
}
