export type ServiceStatus = "running" | "stopped" | "starting" | "stopping" | "error"
export type HealthStatus = "healthy" | "unhealthy" | "unconfigured" | "checking"
export type CheckType = "http" | "tcp" | "command"

export type ServiceType = "tomcat" | "redis" | "nginx" | "mysql" | "nodejs" | "batch" | "shell" | "python" | "custom"

export interface RetryConfig {
  enabled: boolean
  maxRetries: number // 最大重试次数
  retryDelay: number // 重试延迟（毫秒）
  backoffMultiplier?: number // 退避倍数（指数退避）
}

export interface TimeoutConfig {
  startTimeout: number // 启动超时（毫秒）
  stopTimeout: number // 停止超时（毫秒）
  healthCheckTimeout: number // 健康检查超时（毫秒）
}

export interface ServiceLogConfig {
  enabled: boolean
  path?: string // 日志文件路径
  level: "DEBUG" | "INFO" | "WARN" | "ERROR"
  maxSize?: number // 单个日志文件最大大小（MB）
  maxFiles?: number // 保留的日志文件数量
  rotation?: "daily" | "size" // 轮转策略
}

export interface ResourceLimits {
  maxMemory?: number // 最大内存（MB）
  maxCpu?: number // 最大 CPU 使用率（百分比）
  priority?: "low" | "normal" | "high" // 进程优先级
}

export interface ProcessConfig {
  killSignal?: "SIGTERM" | "SIGKILL" | "SIGINT"
  gracefulShutdownTimeout?: number // 优雅关闭超时（毫秒）
  restartOnCrash?: boolean // 崩溃时自动重启
  envFile?: string // 环境变量文件路径
}

export interface ServiceMetrics {
  cpuUsage?: number // CPU 使用率（百分比）
  memoryUsage?: number // 内存使用（MB）
  uptime?: number // 运行时长（秒）
  restartCount?: number // 重启次数
  lastExitCode?: number // 最后退出码
  lastExitSignal?: string // 最后退出信号
}

export interface HealthCheckConfig {
  enabled: boolean
  type: CheckType
  config: HttpCheckConfig | TcpCheckConfig | CommandCheckConfig
  interval: number
  timeout: number
  retries: number
  failureThreshold: number // 连续失败多少次标记为 unhealthy
  successThreshold: number // 连续成功多少次标记为 healthy
  startPeriod?: number // 启动后多久开始检查（给服务预热时间，毫秒）
}

export interface Service {
  id: string
  name: string
  description?: string
  type?: ServiceType
  groupId: string
  path: string
  args?: string[]
  workDir?: string
  env?: Record<string, string>
  status: ServiceStatus
  healthStatus: HealthStatus
  autoStart: boolean
  startupDelay: number
  pid?: number
  startedAt?: Date
  stoppedAt?: Date
  dependencies?: string[] // IDs of other services this service depends on
  
  // 新增配置
  retryConfig?: RetryConfig
  timeoutConfig?: TimeoutConfig
  logConfig?: ServiceLogConfig
  resourceLimits?: ResourceLimits
  processConfig?: ProcessConfig
  healthCheck?: HealthCheckConfig
  metrics?: ServiceMetrics
}

export interface ServiceGroup {
  id: string
  name: string
  description?: string
  applicationId?: string // Added applicationId to link group to an application
  startupDelay: number
  services: Service[]
  order: number
  dependencies: string[] // IDs of other service groups this group depends on
}

export interface HealthCheck {
  id: string
  serviceId: string
  type: CheckType
  config: HttpCheckConfig | TcpCheckConfig | CommandCheckConfig
  interval: number
  timeout: number
  lastCheck?: Date
  lastResult?: boolean
  lastError?: string
}

export interface HttpCheckConfig {
  url: string
  method?: string
  headers?: Record<string, string>
  expectedStatus?: number
}

export interface TcpCheckConfig {
  host: string
  port: number
}

export interface CommandCheckConfig {
  command: string
  args?: string[]
}

export interface Application {
  id: string
  name: string
  description?: string
  icon?: string
  groupIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ServerHealth {
  cpu: number // CPU usage percentage
  memory: number // Memory usage percentage
  disk: number // Disk usage percentage
  network: {
    in: number // Network in KB/s
    out: number // Network out KB/s
  }
  uptime: number // Server uptime in seconds
  lastUpdated: Date
  os: string
  kernel: string
  cpuModel: string
  totalMemory: string
}

export interface LogConfig {
  mode: "realtime" | "periodic" | "manual"
  interval?: number // in seconds, for periodic mode
  maxLines: number
  retention: number // in days
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "ALL"
}

export interface Settings {
  serverPort: number
  autoStart: boolean
  theme: string
}

export interface Config {
  settings: Settings
  groups: ServiceGroup[]
  applications: Application[]
}
