export type ServiceStatus = "running" | "stopped" | "starting" | "stopping" | "error"
export type HealthStatus = "healthy" | "unhealthy" | "unconfigured" | "checking"
export type CheckType = "http" | "tcp" | "command"

export type ServiceType = "tomcat" | "redis" | "nginx" | "mysql" | "nodejs" | "batch" | "shell" | "custom"

export interface Service {
  id: string
  name: string
  description?: string
  type?: ServiceType // Added service type
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
