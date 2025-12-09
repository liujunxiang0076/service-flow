import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import type { Config, Application, ServiceGroup } from "@/types/service"
import { toast } from "@/hooks/use-toast"

// Simple in-memory cache so all useConfig callers share the same config
// during the SPA lifetime (until full page reload). This prevents data
// like newly created services/groups from disappearing when navigating
// between pages.
let cachedConfig: Config | null = null

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(cachedConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async (forceRefresh = false) => {
    // If we already have a cached config and not forcing refresh, reuse it to keep state
    // consistent across pages without hitting the API again.
    if (cachedConfig && !forceRefresh) {
      setConfig(cachedConfig)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await api.getConfig()
      if (data) {
        // Enrich services with missing fields (groupId, status, healthStatus)
        // and check actual running status from backend
        const enrichedGroups = await Promise.all(
          data.groups.map(async (group) => ({
            ...group,
            services: await Promise.all(
              group.services.map(async (service) => {
                // Check if service is actually running
                const isRunning = await api.isTaskRunning(service.id)
                
                // Get PID if running
                let pid: number | undefined
                if (isRunning) {
                  pid = await api.getTaskPid(service.id)
                  console.log(`[fetchConfig] Service ${service.id}: isRunning=${isRunning}, pid=${pid}`)
                  
                  // 如果有 PID，尝试获取端口
                  if (pid) {
                    const port = await api.getTaskPort(pid)
                    if (port) {
                      console.log(`[fetchConfig] Service ${service.id}: found port ${port} via netstat`)
                      // 动态更新 healthCheck 中的端口，以便 UI 显示
                      if (!service.healthCheck) {
                        service.healthCheck = { 
                          type: 'tcp', 
                          port: port, 
                          host: 'localhost',
                          interval: 10,
                          timeout: 5
                        } as any
                      } else {
                        // 兼容不同格式，并确保必需字段存在
                        const hc = service.healthCheck as any
                        
                        // 补全缺失的必需字段
                        if (hc.interval === undefined) hc.interval = 10
                        if (hc.timeout === undefined) hc.timeout = 5
                        if (hc.type === undefined) hc.type = 'tcp'
                        if (hc.host === undefined) hc.host = 'localhost'

                        if (hc.config) {
                          hc.config.port = port
                        } else {
                          hc.port = port
                        }
                      }
                    }
                  }
                }
                
                // Determine start time
                let startedAt: Date | undefined = undefined
                if (service.startedAt) {
                  // 从后端获取的配置中保留启动时间（可能是字符串）
                  startedAt = new Date(service.startedAt)
                }
                
                // 如果正在运行且没有记录时间（这种情况很少见，除非是手动在外部启动的）
                // 我们就不处理了，或者可以设为当前时间？暂且保留原样
                
                console.log(`[fetchConfig] Service ${service.id}: healthCheck=`, service.healthCheck)
                
                return {
                  ...service,
                  groupId: group.id, // Add groupId to each service
                  status: (isRunning ? 'running' : 'stopped') as 'running' | 'stopped', // Get actual status
                  healthStatus: service.healthStatus || 'unconfigured', // Default health status
                  // Fix: 只有在运行状态下才显示 PID，避免显示上次残留的 PID
                  pid: isRunning ? (pid || service.pid) : undefined,
                  startedAt, // Add start time
                }
              })
            ),
          }))
        )
        
        const enrichedData = {
          ...data,
          groups: enrichedGroups,
        }
        cachedConfig = enrichedData
        setConfig(enrichedData)
      }
    } catch (err) {
      console.error("Failed to fetch config:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch config")
      toast({
        title: "获取配置失败",
        description: "无法加载应用配置，请检查后端服务是否运行正常。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const saveConfig = useCallback(
    async (newConfig: Config) => {
      try {
        console.log("Saving config to backend:", JSON.stringify(newConfig, null, 2))
        await api.saveConfig(newConfig)
        cachedConfig = newConfig
        setConfig(newConfig)
        toast({
          title: "配置已保存",
          description: "应用配置更新成功。",
        })
        return true
      } catch (err) {
        console.error("Failed to save config:", err)
        toast({
          title: "保存配置失败",
          description: "无法保存应用配置，请重试。",
          variant: "destructive",
        })
        return false
      }
    },
    [],
  )

  const createApplication = useCallback(
    async (appData: Omit<Application, "id" | "createdAt" | "updatedAt">) => {
      if (!config) return false

      const newApp: Application = {
        ...appData,
        id: `app-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      const newConfig = {
        ...config,
        applications: [...config.applications, newApp],
      }

      return await saveConfig(newConfig as unknown as Config) 
    },
    [config, saveConfig],
  )

  const updateApplication = useCallback(
    async (app: Application) => {
      if (!config) return false

      const updatedApp = {
        ...app,
        updatedAt: new Date().toISOString(),
      }

      const newApplications = config.applications.map((a) => 
        a.id === app.id ? updatedApp : a
      )

      const newConfig = {
        ...config,
        applications: newApplications,
      }

      return await saveConfig(newConfig as unknown as Config)
    },
    [config, saveConfig],
  )

  const deleteApplication = useCallback(
    async (appId: string) => {
      if (!config) return false

      const newApplications = config.applications.filter((a) => a.id !== appId)

      const newConfig = {
        ...config,
        applications: newApplications,
      }

      return await saveConfig(newConfig as unknown as Config)
    },
    [config, saveConfig],
  )

  const deleteApplicationWithDependencies = useCallback(
    async (appId: string) => {
      if (!config) return false

      const appToDelete = config.applications.find((a) => a.id === appId)
      if (!appToDelete) return false

      const appGroupIds = appToDelete.groupIds ?? []

      const remainingApplications = config.applications.filter((a) => a.id !== appId)
      const remainingGroups = config.groups.filter((g) => !appGroupIds.includes(g.id))

      const newConfig: Config = {
        ...config,
        applications: remainingApplications,
        groups: remainingGroups,
      }

      return await saveConfig(newConfig)
    },
    [config, saveConfig],
  )

  const createGroup = useCallback(
    async (groupData: Omit<ServiceGroup, "id" | "services" | "order" | "dependencies">) => {
      if (!config) return false

      const existingGroups = config.groups ?? []
      const existingApplications = config.applications ?? []

      const newGroup: ServiceGroup = {
        ...groupData,
        id: `group-${Date.now()}`,
        services: [],
        order: existingGroups.length + 1,
        dependencies: [],
      }

      const updatedApplications = newGroup.applicationId
        ? existingApplications.map((app) =>
            app.id === newGroup.applicationId
              ? {
                  ...app,
                  groupIds: app.groupIds?.includes(newGroup.id)
                    ? app.groupIds
                    : [...(app.groupIds ?? []), newGroup.id],
                  updatedAt: new Date().toISOString(),
                }
              : app,
          )
        : existingApplications

      const newConfig: Config = {
        ...config,
        groups: [...existingGroups, newGroup],
        applications: updatedApplications,
      }

      return await saveConfig(newConfig)
    },
    [config, saveConfig],
  )

  const updateGroup = useCallback(
    async (group: ServiceGroup) => {
      if (!config) return false

      const existingGroups = config.groups ?? []
      const existingApplications = config.applications ?? []

      const previousGroup = existingGroups.find((g) => g.id === group.id)
      if (!previousGroup) return false

      const newGroups = existingGroups.map((g) => (g.id === group.id ? group : g))

      const updatedApplications = existingApplications.map((app) => {
        const groupIds = app.groupIds ?? []
        let nextGroupIds = groupIds

        const belongedBefore = previousGroup.applicationId && app.id === previousGroup.applicationId
        const belongsNow = group.applicationId && app.id === group.applicationId

        if (belongedBefore && !belongsNow) {
          nextGroupIds = groupIds.filter((id) => id !== group.id)
        }

        if (belongsNow) {
          nextGroupIds = groupIds.includes(group.id) ? groupIds : [...groupIds, group.id]
        }

        const changed = nextGroupIds !== groupIds

        return changed
          ? {
              ...app,
              groupIds: nextGroupIds,
              updatedAt: new Date().toISOString(),
            }
          : app
      })

      const newConfig: Config = {
        ...config,
        groups: newGroups,
        applications: updatedApplications,
      }

      return await saveConfig(newConfig)
    },
    [config, saveConfig],
  )

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!config) return false

      const existingGroups = config.groups ?? []
      const existingApplications = config.applications ?? []

      const newGroups = existingGroups.filter((g) => g.id !== groupId)
      const updatedApplications = existingApplications.map((app) => {
        const groupIds = app.groupIds ?? []
        if (!groupIds.includes(groupId)) {
          return app
        }

        return {
          ...app,
          groupIds: groupIds.filter((id) => id !== groupId),
          updatedAt: new Date().toISOString(),
        }
      })

      const newConfig: Config = {
        ...config,
        groups: newGroups,
        applications: updatedApplications,
      }

      return await saveConfig(newConfig)
    },
    [config, saveConfig],
  )

  const createService = useCallback(
    async (serviceData: any) => {
      if (!config) return false

      const groupId = serviceData.groupId || "default-group"
      const newService = {
        ...serviceData,
        id: `service-${Date.now()}`,
        groupId: groupId, // 确保服务有 groupId
        status: "stopped",
        healthStatus: "unconfigured",
      }

      let newGroups = [...config.groups]
      const groupExists = newGroups.some(g => g.id === groupId)

      if (groupExists) {
        newGroups = newGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              services: [...group.services, newService],
            }
          }
          return group
        })
      } else {
        // 如果分组不存在，创建一个新分组
        newGroups.push({
          id: groupId,
          name: groupId === "default-group" ? "默认分组" : "新分组",
          startupDelay: 0,
          services: [newService],
          dependencies: [],
          applicationId: undefined,
          order: newGroups.length
        })
      }

      const newConfig = {
        ...config,
        groups: newGroups,
      }

      return await saveConfig(newConfig as unknown as Config)
    },
    [config, saveConfig],
  )

  const updateService = useCallback(
    async (serviceData: any) => {
      if (!config) return false

      const groupId = serviceData.groupId
      // Find old group to check if group changed
      const oldGroup = config.groups.find(g => g.services.some(s => s.id === serviceData.id))
      
      let newGroups = [...config.groups]

      if (oldGroup && oldGroup.id !== groupId) {
        // Service moved to another group
        // 1. Remove from old group
        newGroups = newGroups.map(g => {
          if (g.id === oldGroup.id) {
            return { ...g, services: g.services.filter(s => s.id !== serviceData.id) }
          }
          return g
        })
        // 2. Add to new group
        newGroups = newGroups.map(g => {
          if (g.id === groupId) {
            return { ...g, services: [...g.services, serviceData] }
          }
          return g
        })
      } else {
        // Service stays in same group, just update
        newGroups = newGroups.map(g => {
          if (g.id === groupId) {
            return {
              ...g,
              services: g.services.map(s => s.id === serviceData.id ? serviceData : s)
            }
          }
          return g
        })
      }

      const newConfig = {
        ...config,
        groups: newGroups,
      }

      return await saveConfig(newConfig as unknown as Config)
    },
    [config, saveConfig],
  )

  const deleteService = useCallback(
    async (serviceId: string) => {
      if (!config) return false

      const newGroups = config.groups.map(group => ({
        ...group,
        services: group.services.filter(s => s.id !== serviceId)
      }))

      const newConfig = {
        ...config,
        groups: newGroups,
      }

      return await saveConfig(newConfig as unknown as Config)
    },
    [config, saveConfig],
  )

  const startService = useCallback(
    async (serviceId: string) => {
      try {
        // 记录启动时间
        const startTime = new Date()
        
        await api.startTask(serviceId)
        toast({
          title: "服务启动中",
          description: "正在启动服务...",
        })
        
        // Wait a bit for the service to start, then check status
        // 增加延迟时间，给服务更多启动时间
        setTimeout(async () => {
          const isRunning = await api.isTaskRunning(serviceId)
          
          if (isRunning) {
            // 更新配置，设置启动时间
            if (config) {
              const updatedConfig = {
                ...config,
                groups: config.groups.map(group => ({
                  ...group,
                  services: group.services.map(service => 
                    service.id === serviceId 
                      ? { ...service, startedAt: startTime }
                      : service
                  )
                }))
              }
              setConfig(updatedConfig)
              cachedConfig = updatedConfig
              
              // 保存到后端
              await api.saveConfig(updatedConfig)
            }
            
            toast({
              title: "服务已启动",
              description: "服务启动成功",
            })
          } else {
            toast({
              title: "服务启动失败",
              description: "服务未能成功启动，请查看日志",
              variant: "destructive",
            })
          }
          
          await fetchConfig(true)
        }, 1500)
        
        return true
      } catch (err) {
        console.error("Failed to start service:", err)
        toast({
          title: "启动服务失败",
          description: err instanceof Error ? err.message : "无法启动服务，请重试。",
          variant: "destructive",
        })
        return false
      }
    },
    [fetchConfig, config],
  )

  const stopService = useCallback(
    async (serviceId: string) => {
      try {
        await api.stopTask(serviceId)
        toast({
          title: "服务停止中",
          description: "正在停止服务...",
        })
        
        // Wait a bit for the service to stop, then check status
        setTimeout(async () => {
          const isRunning = await api.isTaskRunning(serviceId)
          
          if (!isRunning) {
            // 更新配置，清除启动时间和 PID
            if (config) {
              const updatedConfig = {
                ...config,
                groups: config.groups.map(group => ({
                  ...group,
                  services: group.services.map(service => 
                    service.id === serviceId 
                      ? { ...service, startedAt: undefined, pid: undefined }
                      : service
                  )
                }))
              }
              setConfig(updatedConfig)
              cachedConfig = updatedConfig
              
              // 保存到后端
              await api.saveConfig(updatedConfig)
            }
            
            toast({
              title: "服务已停止",
              description: "服务停止成功",
            })
          } else {
            toast({
              title: "服务停止失败",
              description: "服务未能成功停止，请重试",
              variant: "destructive",
            })
          }
          
          await fetchConfig(true)
        }, 1000)
        
        return true
      } catch (err) {
        console.error("Failed to stop service:", err)
        toast({
          title: "停止服务失败",
          description: err instanceof Error ? err.message : "无法停止服务，请重试。",
          variant: "destructive",
        })
        return false
      }
    },
    [fetchConfig, config],
  )

  const restartService = useCallback(
    async (serviceId: string) => {
      try {
        await api.restartTask(serviceId)
        toast({
          title: "服务重启中",
          description: "正在重启服务...",
        })
        
        // Wait a bit for the service to restart, then check status
        setTimeout(async () => {
          await fetchConfig(true)
          const isRunning = await api.isTaskRunning(serviceId)
          if (isRunning) {
            toast({
              title: "服务已重启",
              description: "服务重启成功",
            })
          } else {
            toast({
              title: "服务重启失败",
              description: "服务未能成功重启，请查看日志",
              variant: "destructive",
            })
          }
        }, 2000)
        
        return true
      } catch (err) {
        console.error("Failed to restart service:", err)
        toast({
          title: "重启服务失败",
          description: err instanceof Error ? err.message : "无法重启服务，请重试。",
          variant: "destructive",
        })
        return false
      }
    },
    [fetchConfig],
  )

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    error,
    refreshConfig: fetchConfig,
    saveConfig,
    createApplication,
    updateApplication,
    deleteApplication,
    deleteApplicationWithDependencies,
    createGroup,
    updateGroup,
    deleteGroup,
    createService,
    updateService,
    deleteService,
    startService,
    stopService,
    restartService,
  }
}
