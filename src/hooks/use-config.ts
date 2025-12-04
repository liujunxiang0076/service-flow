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

      const newGroup: ServiceGroup = {
        ...groupData,
        id: `group-${Date.now()}`,
        services: [],
        order: config.groups.length + 1,
        dependencies: [],
      }

      const newConfig = {
        ...config,
        groups: [...config.groups, newGroup],
      }

      return await saveConfig(newConfig as unknown as Config)
    },
    [config, saveConfig],
  )

  const updateGroup = useCallback(
    async (group: ServiceGroup) => {
      if (!config) return false

      const newGroups = config.groups.map((g) => (g.id === group.id ? group : g))

      const newConfig = {
        ...config,
        groups: newGroups,
      }

      return await saveConfig(newConfig as unknown as Config)
    },
    [config, saveConfig],
  )

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!config) return false

      const newGroups = config.groups.filter((g) => g.id !== groupId)

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
  }
}
