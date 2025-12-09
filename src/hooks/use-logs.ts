import { useState, useCallback } from 'react'
import { listen, UnlistenFn } from '@tauri-apps/api/event'

export interface LogEntry {
  time: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  service: string
  serviceId: string
  message: string
}

const MAX_LOGS = 1000 // 最大保存日志数量

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isListening, setIsListening] = useState(false)

  // 解析日志级别
  const parseLogLevel = (message: string): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' => {
    const upperMessage = message.toUpperCase()
    if (upperMessage.includes('ERROR') || upperMessage.includes('FAIL')) return 'ERROR'
    if (upperMessage.includes('WARN')) return 'WARN'
    if (upperMessage.includes('DEBUG')) return 'DEBUG'
    return 'INFO'
  }

  // 添加日志
  const addLog = useCallback((serviceId: string, serviceName: string, message: string) => {
    const newLog: LogEntry = {
      time: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      level: parseLogLevel(message),
      service: serviceName,
      serviceId,
      message: message.trim(),
    }

    setLogs((prevLogs) => {
      const newLogs = [...prevLogs, newLog]
      // 限制日志数量
      if (newLogs.length > MAX_LOGS) {
        return newLogs.slice(newLogs.length - MAX_LOGS)
      }
      return newLogs
    })
  }, [])

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // 导出日志
  const exportLogs = useCallback(() => {
    const logText = logs
      .map((log) => `${log.time} [${log.level}] [${log.service}] ${log.message}`)
      .join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `service-logs-${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [logs])

  // 启动日志监听
  const startListening = useCallback(async (serviceIds: string[], serviceNames: Map<string, string>) => {
    const unlisteners: UnlistenFn[] = []

    try {
      // 为每个服务监听日志事件
      for (const serviceId of serviceIds) {
        const unlisten = await listen<string>(`log:${serviceId}`, (event) => {
          const message = event.payload
          const serviceName = serviceNames.get(serviceId) || serviceId
          addLog(serviceId, serviceName, message)
        })
        unlisteners.push(unlisten)
      }
      
      setIsListening(true)
      return unlisteners
    } catch (error) {
      console.error('Failed to start log listening:', error)
      return []
    }
  }, [addLog])

  return {
    logs,
    isListening,
    addLog,
    clearLogs,
    exportLogs,
    startListening,
  }
}
