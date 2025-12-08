import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { ServiceStatus, ServiceMetrics } from "@/types/service"

interface UseServiceStatusOptions {
  serviceId: string
  enabled?: boolean
  pollInterval?: number // 轮询间隔（毫秒），默认 5000
}

export function useServiceStatus({
  serviceId,
  enabled = true,
  pollInterval = 5000,
}: UseServiceStatusOptions) {
  const [status, setStatus] = useState<ServiceStatus>("stopped")
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const fetchStatus = async () => {
      try {
        setError(null)
        
        // 获取运行状态
        const running = await api.isTaskRunning(serviceId)
        setStatus(running ? "running" : "stopped")

        // 如果正在运行，获取详细指标
        if (running) {
          const pid = await api.getTaskPid(serviceId)
          const stats = await api.getProcessStats(serviceId)
          
          if (stats) {
            setMetrics({
              cpuUsage: stats.cpu_percent,
              memoryUsage: stats.memory_bytes / (1024 * 1024), // 转换为 MB
              uptime: stats.uptime,
              restartCount: 0, // TODO: 从后端获取
            })
          } else if (pid) {
            setMetrics({
              cpuUsage: 0,
              memoryUsage: 0,
              uptime: 0,
              restartCount: 0,
            })
          }
        } else {
          setMetrics(null)
        }
      } catch (err) {
        console.error(`Failed to fetch status for service ${serviceId}:`, err)
        setError(err instanceof Error ? err.message : "Failed to fetch status")
      } finally {
        setLoading(false)
      }
    }

    // 初始获取
    fetchStatus()

    // 定期轮询
    const interval = setInterval(fetchStatus, pollInterval)

    return () => clearInterval(interval)
  }, [serviceId, enabled, pollInterval])

  return {
    status,
    metrics,
    loading,
    error,
  }
}

// 批量获取多个服务的状态
export function useBatchServiceStatus(serviceIds: string[], pollInterval = 5000) {
  const [statusMap, setStatusMap] = useState<Record<string, ServiceStatus>>({})
  const [metricsMap, setMetricsMap] = useState<Record<string, ServiceMetrics>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllStatus = async () => {
      try {
        const newStatusMap: Record<string, ServiceStatus> = {}
        const newMetricsMap: Record<string, ServiceMetrics> = {}

        await Promise.all(
          serviceIds.map(async (serviceId) => {
            const running = await api.isTaskRunning(serviceId)
            newStatusMap[serviceId] = running ? "running" : "stopped"

            if (running) {
              const stats = await api.getProcessStats(serviceId)
              if (stats) {
                newMetricsMap[serviceId] = {
                  cpuUsage: stats.cpu_percent,
                  memoryUsage: stats.memory_bytes / (1024 * 1024),
                  uptime: stats.uptime,
                  restartCount: 0,
                }
              }
            }
          })
        )

        setStatusMap(newStatusMap)
        setMetricsMap(newMetricsMap)
      } catch (err) {
        console.error("Failed to fetch batch status:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllStatus()
    const interval = setInterval(fetchAllStatus, pollInterval)

    return () => clearInterval(interval)
  }, [serviceIds.join(","), pollInterval])

  return {
    statusMap,
    metricsMap,
    loading,
  }
}
