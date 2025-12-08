import type { Config, Service, ServiceGroup, DependencyConfig } from "@/types/service"

export interface ValidationError {
  field: string
  message: string
  severity: "error" | "warning"
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * 配置验证器
 */
export class ConfigValidator {
  /**
   * 验证完整配置
   */
  static validateConfig(config: Config): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 验证服务组
    for (const group of config.groups) {
      const groupResult = this.validateServiceGroup(group, config)
      errors.push(...groupResult.errors)
      warnings.push(...groupResult.warnings)
    }

    // 验证应用
    for (const app of config.applications) {
      // 检查应用引用的组是否存在
      for (const groupId of app.groupIds) {
        if (!config.groups.find(g => g.id === groupId)) {
          errors.push({
            field: `applications.${app.id}.groupIds`,
            message: `Referenced group "${groupId}" does not exist`,
            severity: "error",
          })
        }
      }
    }

    // 检查循环依赖
    const circularDeps = this.detectCircularDependencies(config)
    if (circularDeps.length > 0) {
      errors.push({
        field: "dependencies",
        message: `Circular dependencies detected: ${circularDeps.join(" -> ")}`,
        severity: "error",
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * 验证服务组
   */
  static validateServiceGroup(group: ServiceGroup, config: Config): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 验证组 ID
    if (!group.id || group.id.trim() === "") {
      errors.push({
        field: `groups.${group.id}.id`,
        message: "Group ID cannot be empty",
        severity: "error",
      })
    }

    // 验证组名称
    if (!group.name || group.name.trim() === "") {
      errors.push({
        field: `groups.${group.id}.name`,
        message: "Group name cannot be empty",
        severity: "error",
      })
    }

    // 验证服务
    for (const service of group.services) {
      const serviceResult = this.validateService(service, group, config)
      errors.push(...serviceResult.errors)
      warnings.push(...serviceResult.warnings)
    }

    // 验证组依赖
    for (const depId of group.dependencies) {
      if (!config.groups.find(g => g.id === depId)) {
        errors.push({
          field: `groups.${group.id}.dependencies`,
          message: `Referenced group "${depId}" does not exist`,
          severity: "error",
        })
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * 验证服务
   */
  static validateService(service: Service, _group: ServiceGroup, config: Config): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 验证服务 ID
    if (!service.id || service.id.trim() === "") {
      errors.push({
        field: `services.${service.id}.id`,
        message: "Service ID cannot be empty",
        severity: "error",
      })
    }

    // 验证服务名称
    if (!service.name || service.name.trim() === "") {
      errors.push({
        field: `services.${service.id}.name`,
        message: "Service name cannot be empty",
        severity: "error",
      })
    }

    // 验证路径
    if (!service.path || service.path.trim() === "") {
      errors.push({
        field: `services.${service.id}.path`,
        message: "Service path cannot be empty",
        severity: "error",
      })
    }

    // 验证启动延迟
    if (service.startupDelay < 0) {
      errors.push({
        field: `services.${service.id}.startupDelay`,
        message: "Startup delay cannot be negative",
        severity: "error",
      })
    }

    // 验证重试配置
    if (service.retryConfig) {
      if (service.retryConfig.maxRetries < 0) {
        errors.push({
          field: `services.${service.id}.retryConfig.maxRetries`,
          message: "Max retries cannot be negative",
          severity: "error",
        })
      }
      if (service.retryConfig.retryDelay < 0) {
        errors.push({
          field: `services.${service.id}.retryConfig.retryDelay`,
          message: "Retry delay cannot be negative",
          severity: "error",
        })
      }
    }

    // 验证超时配置
    if (service.timeoutConfig) {
      if (service.timeoutConfig.startTimeout <= 0) {
        errors.push({
          field: `services.${service.id}.timeoutConfig.startTimeout`,
          message: "Start timeout must be positive",
          severity: "error",
        })
      }
      if (service.timeoutConfig.stopTimeout <= 0) {
        errors.push({
          field: `services.${service.id}.timeoutConfig.stopTimeout`,
          message: "Stop timeout must be positive",
          severity: "error",
        })
      }
    }

    // 验证资源限制
    if (service.resourceLimits) {
      if (service.resourceLimits.maxMemory && service.resourceLimits.maxMemory <= 0) {
        errors.push({
          field: `services.${service.id}.resourceLimits.maxMemory`,
          message: "Max memory must be positive",
          severity: "error",
        })
      }
      if (service.resourceLimits.maxCpu && (service.resourceLimits.maxCpu <= 0 || service.resourceLimits.maxCpu > 100)) {
        errors.push({
          field: `services.${service.id}.resourceLimits.maxCpu`,
          message: "Max CPU must be between 0 and 100",
          severity: "error",
        })
      }
    }

    // 验证依赖
    if (service.dependencies) {
      for (const depId of service.dependencies) {
        const depExists = config.groups.some(g => 
          g.services.some(s => s.id === depId)
        )
        if (!depExists) {
          errors.push({
            field: `services.${service.id}.dependencies`,
            message: `Referenced service "${depId}" does not exist`,
            severity: "error",
          })
        }
      }
    }

    // 验证详细依赖配置
    if (service.dependencyConfigs) {
      for (const depConfig of service.dependencyConfigs) {
        const depResult = this.validateDependencyConfig(depConfig, service, config)
        errors.push(...depResult.errors)
        warnings.push(...depResult.warnings)
      }
    }

    // 警告：没有配置健康检查
    if (!service.healthCheck && service.autoStart) {
      warnings.push({
        field: `services.${service.id}.healthCheck`,
        message: "No health check configured for auto-start service",
        severity: "warning",
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * 验证依赖配置
   */
  static validateDependencyConfig(
    depConfig: DependencyConfig,
    service: Service,
    config: Config
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 检查依赖服务是否存在
    const depExists = config.groups.some(g => 
      g.services.some(s => s.id === depConfig.serviceId)
    )
    if (!depExists) {
      errors.push({
        field: `services.${service.id}.dependencyConfigs`,
        message: `Referenced service "${depConfig.serviceId}" does not exist`,
        severity: "error",
      })
    }

    // 检查超时配置
    if (depConfig.timeout && depConfig.timeout < 0) {
      errors.push({
        field: `services.${service.id}.dependencyConfigs.timeout`,
        message: "Dependency timeout cannot be negative",
        severity: "error",
      })
    }

    // 警告：冲突依赖可能导致服务无法启动
    if (depConfig.type === "conflict") {
      warnings.push({
        field: `services.${service.id}.dependencyConfigs`,
        message: `Conflict dependency with "${depConfig.serviceId}" may prevent service from starting`,
        severity: "warning",
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * 检测循环依赖
   */
  static detectCircularDependencies(config: Config): string[] {
    const allServices: Service[] = []
    config.groups.forEach(g => allServices.push(...g.services))

    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    const dfs = (serviceId: string): string[] | null => {
      if (recursionStack.has(serviceId)) {
        // 找到循环
        const cycleStart = path.indexOf(serviceId)
        return path.slice(cycleStart).concat(serviceId)
      }

      if (visited.has(serviceId)) {
        return null
      }

      visited.add(serviceId)
      recursionStack.add(serviceId)
      path.push(serviceId)

      const service = allServices.find(s => s.id === serviceId)
      if (service) {
        const deps = service.dependencyConfigs
          ? service.dependencyConfigs
              .filter(d => d.type === "required")
              .map(d => d.serviceId)
          : service.dependencies || []

        for (const depId of deps) {
          const cycle = dfs(depId)
          if (cycle) {
            return cycle
          }
        }
      }

      path.pop()
      recursionStack.delete(serviceId)

      return null
    }

    for (const service of allServices) {
      if (!visited.has(service.id)) {
        const cycle = dfs(service.id)
        if (cycle) {
          return cycle
        }
      }
    }

    return []
  }

  /**
   * 快速验证（仅检查关键错误）
   */
  static quickValidate(config: Config): boolean {
    // 检查基本结构
    if (!config.groups || !Array.isArray(config.groups)) {
      return false
    }

    // 检查每个服务的必需字段
    for (const group of config.groups) {
      if (!group.id || !group.services) {
        return false
      }

      for (const service of group.services) {
        if (!service.id || !service.name || !service.path) {
          return false
        }
      }
    }

    // 检查循环依赖
    const circularDeps = this.detectCircularDependencies(config)
    if (circularDeps.length > 0) {
      return false
    }

    return true
  }
}
