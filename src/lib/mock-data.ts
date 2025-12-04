import type { ServiceGroup, Application, ServerHealth, LogConfig } from "@/types/service"

export const mockGroups: ServiceGroup[] = [
  {
    id: "group-1",
    name: "开发环境",
    description: "本地开发所需的所有服务",
    applicationId: "app-1", // Added applicationId
    startupDelay: 0,
    order: 1,
    dependencies: [],
    services: [
      {
        id: "service-1",
        name: "Redis",
        description: "缓存服务",
        groupId: "group-1",
        path: "/usr/local/bin/redis-server",
        args: ["--port", "6379"],
        status: "running",
        healthStatus: "healthy",
        autoStart: true,
        startupDelay: 0,
        pid: 1234,
        startedAt: new Date(Date.now() - 3600000),
      },
      {
        id: "service-2",
        name: "MySQL",
        description: "关系型数据库",
        groupId: "group-1",
        path: "/usr/local/bin/mysqld",
        status: "running",
        healthStatus: "healthy",
        dependencies: ["service-1"],
        autoStart: true,
        startupDelay: 2000,
        pid: 1235,
        startedAt: new Date(Date.now() - 3500000),
      },
      {
        id: "service-3",
        name: "后端 API",
        description: "Node.js 后端服务",
        groupId: "group-1",
        path: "/usr/local/bin/node",
        args: ["server.js"],
        status: "running",
        healthStatus: "healthy",
        dependencies: ["service-1", "service-2"],
        autoStart: true,
        startupDelay: 3000,
        pid: 1236,
        startedAt: new Date(Date.now() - 3400000),
      },
    ],
  },
  {
    id: "group-2",
    name: "前端服务",
    description: "前端开发服务器",
    applicationId: "app-1", // Added applicationId
    startupDelay: 5000,
    order: 2,
    dependencies: ["group-1"],
    services: [
      {
        id: "service-4",
        name: "前端开发服务器",
        description: "Vite 开发服务器",
        groupId: "group-2",
        path: "/usr/local/bin/npm",
        args: ["run", "dev"],
        status: "stopped",
        healthStatus: "unconfigured",
        dependencies: ["service-3"],
        autoStart: false,
        startupDelay: 0,
      },
    ],
  },
  {
    id: "group-3",
    name: "监控服务",
    description: "系统监控和日志收集",
    applicationId: "app-2", // Added applicationId
    startupDelay: 0,
    order: 3,
    dependencies: [],
    services: [
      {
        id: "service-5",
        name: "Prometheus",
        description: "监控数据收集",
        groupId: "group-3",
        path: "/usr/local/bin/prometheus",
        status: "error",
        healthStatus: "unhealthy",
        autoStart: true,
        startupDelay: 0,
      },
      {
        id: "service-6",
        name: "Grafana",
        description: "数据可视化",
        groupId: "group-3",
        path: "/usr/local/bin/grafana-server",
        status: "stopped",
        healthStatus: "unconfigured",
        dependencies: ["service-5"],
        autoStart: false,
        startupDelay: 2000,
      },
    ],
  },
]

export const mockApplications: Application[] = [
  {
    id: "app-1",
    name: "电商平台",
    description: "完整的电商系统，包含开发环境和前端服务",
    icon: "ShoppingCart",
    groupIds: ["group-1", "group-2"],
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "app-2",
    name: "监控系统",
    description: "系统监控和可视化平台",
    icon: "BarChart",
    groupIds: ["group-3"],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

export const mockServerHealth: ServerHealth = {
  cpu: 45.3,
  memory: 68.7,
  disk: 52.1,
  network: {
    in: 1234.5,
    out: 567.8,
  },
  uptime: 345600, // 4 days
  lastUpdated: new Date(),
  os: "Linux Ubuntu 22.04 LTS",
  kernel: "5.15.0-91-generic",
  cpuModel: "Intel Xeon E5-2680 v4 (8 cores)",
  totalMemory: "16 GB DDR4",
}

export const defaultLogConfig: LogConfig = {
  mode: "realtime",
  maxLines: 1000,
  retention: 7,
  level: "ALL",
}
