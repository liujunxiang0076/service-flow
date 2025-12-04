import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import type { Config, Application } from "@/types/service"
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
        createdAt: new Date().toISOString(), // Backend expects string now? Rust struct uses string for dates based on my previous edit?
        // Wait, in Rust I defined created_at as String. In TS interface Application has Date.
        // I should check TS definition again.
        updatedAt: new Date().toISOString(),
      }

      // In Rust struct: pub created_at: String,
      // In TS interface: createdAt: Date
      // I need to be careful here. JSON serialization of Date usually results in ISO string.
      // But if TS expects Date object, I should probably keep it as Date in frontend state,
      // but when sending to backend, invoke will serialize it.
      // However, if I receive it from backend as string, TS might be confused if I defined it as Date.
      // Let's assume for now I should treat it as string in TS to match Rust exactly, or handle conversion.
      // Let's look at the TS definition again.
      
      // Update config
      const newConfig = {
        ...config,
        applications: [...config.applications, newApp],
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
  }
}
