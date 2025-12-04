import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import type { Config, Application, ServiceGroup } from "@/types/service"
import { toast } from "@/hooks/use-toast"

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getConfig()
      if (data) {
        setConfig(data)
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
        await api.saveConfig(newConfig)
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

      const groupId = serviceData.groupId
      const newService = {
        ...serviceData,
        id: `service-${Date.now()}`,
        status: "stopped",
        healthStatus: "unconfigured",
      }

      const newGroups = config.groups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            services: [...group.services, newService],
          }
        }
        return group
      })

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
    createGroup,
    updateGroup,
    deleteGroup,
    createService,
    updateService,
    deleteService,
  }
}
