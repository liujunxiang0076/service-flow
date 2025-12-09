import { invoke } from "@tauri-apps/api/core"
import type { Config, ServerHealth } from "@/types/service"
import { mockGroups, mockApplications, mockServerHealth } from "@/lib/mock-data"

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export const api = {
  // Config
  getConfig: async () => {
    if (!isTauri()) {
      console.warn("Not running in Tauri environment, returning mock config")
      return {
        settings: { serverPort: 8899, autoStart: false },
        groups: mockGroups,
        applications: mockApplications
      } as Config
    }
    return invoke<Config>("get_config")
  },
  saveConfig: async (config: Config) => {
    if (!isTauri()) {
      console.warn("Not running in Tauri environment, mock save config")
      return
    }
    return invoke<void>("save_config", { cfg: config })
  },

  // Task Management
  startTask: async (taskId: string) => {
    if (!isTauri()) return
    return invoke<void>("start_task", { taskId })
  },
  stopTask: async (taskId: string) => {
    if (!isTauri()) return
    return invoke<void>("stop_task", { taskId })
  },
  restartTask: async (taskId: string) => {
    if (!isTauri()) return
    return invoke<void>("restart_task", { taskId })
  },
  startAll: async () => {
    if (!isTauri()) return
    return invoke<void>("start_all")
  },
  stopAllTasks: async () => {
    if (!isTauri()) return
    return invoke<void>("stop_all_tasks")
  },
  startGroup: async (groupId: string) => {
    if (!isTauri()) return
    return invoke<void>("start_group", { groupId })
  },
  stopGroup: async (groupId: string) => {
    if (!isTauri()) return
    return invoke<void>("stop_group", { groupId })
  },

  // Status & Info
  isTaskRunning: async (taskId: string) => {
    if (!isTauri()) return false
    return invoke<boolean>("is_task_running", { taskId })
  },
  getTaskPid: async (taskId: string) => {
    if (!isTauri()) return 0
    return invoke<number>("get_task_pid", { taskId })
  },
  getTaskPort: async (pid: number) => {
    if (!isTauri()) return null
    return invoke<number | null>("get_pid_port", { pid })
  },
  
  // Health Check
  getHealthCheckResult: async (taskId: string) => {
    if (!isTauri()) return null
    return invoke<any>("get_health_check_result", { taskId })
  },
  restartHealthCheck: async (taskId: string) => {
    if (!isTauri()) return
    return invoke<void>("restart_health_check", { taskId })
  },

  // Server Health
  getServerHealth: async () => {
    if (!isTauri()) {
      // 在非 Tauri 环境下使用 mock 数据方便开发调试
      return mockServerHealth as ServerHealth
    }
    return invoke<ServerHealth>("get_server_health")
  },

  // Process Stats
  getProcessStats: async (taskId: string) => {
    if (!isTauri()) return null
    return invoke<any>("get_process_stats", { taskId })
  },
}
