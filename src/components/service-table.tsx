"use client"

import { useState, useEffect } from "react"
import type { Service, ServiceGroup, Application } from "@/types/service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Square, RotateCw, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface ServiceTableProps {
  services: Service[]
  groups: ServiceGroup[]
  applications?: Application[]
  selectedServices?: string[]
  onSelectionChange?: (selected: string[]) => void
  onStart?: (serviceId: string) => void
  onStop?: (serviceId: string) => void
  onRestart?: (serviceId: string) => void
  onEdit?: (serviceId: string) => void
  onDelete?: (serviceId: string) => void
}

export function ServiceTable({
  services,
  groups,
  applications = [],
  selectedServices = [],
  onSelectionChange,
  onStart,
  onStop,
  onRestart,
  onEdit,
  onDelete,
}: ServiceTableProps) {
  // 强制重新渲染以更新相对时间
  const [, setTick] = useState(0)

  useEffect(() => {
    // 每分钟更新一次时间显示
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || "未知分组"
  }

  const getApplicationName = (groupId: string) => {
    if (!applications || applications.length === 0) return "-"
    const app = applications.find((app) => app.groupIds?.includes(groupId))
    return app?.name || "-"
  }

  const formatStartTime = (startedAt: Date | undefined): string => {
    if (!startedAt) return '-'
    
    const now = new Date()
    const start = new Date(startedAt)
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    // 1. 当天内的时间显示规则
    const isToday = now.getFullYear() === start.getFullYear() &&
                    now.getMonth() === start.getMonth() &&
                    now.getDate() === start.getDate()

    if (isToday) {
      if (diffMins < 1) return "刚刚"
      if (diffMins < 2) return "一分钟前"
      if (diffMins <= 30) return `${diffMins}分钟前`
      if (diffMins <= 60) return "半小时前"
      
      if (diffHours >= 1 && diffHours < 12) return "一小时前" 
      
      if (diffHours < 12) {
         const hour = start.getHours()
         const minute = start.getMinutes().toString().padStart(2, '0')
         const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`
         
         if (hour >= 0 && hour < 6) return `凌晨${timeStr}`
         if (hour >= 6 && hour < 12) return `上午${timeStr}`
         if (hour >= 12 && hour < 13) return `中午${timeStr}`
         if (hour >= 13 && hour < 18) return `下午${timeStr}`
         if (hour >= 18 && hour < 24) return `晚上${timeStr}`
      }
    }

    // 2. 跨日但在同一周内
    const oneDay = 24 * 60 * 60 * 1000
    const diffDays = Math.floor(diffMs / oneDay)
    const isSameYear = now.getFullYear() === start.getFullYear()
    
    if (diffDays === 1 || (diffDays === 0 && !isToday)) { 
       const hour = start.getHours().toString().padStart(2, '0')
       const minute = start.getMinutes().toString().padStart(2, '0')
       return `昨天${hour}:${minute}`
    }

    // 3. 跨周但在本年度内 (及其他本年度内的时间)
    if (isSameYear) {
      const month = (start.getMonth() + 1).toString().padStart(2, '0')
      const day = start.getDate().toString().padStart(2, '0')
      const hour = start.getHours().toString().padStart(2, '0')
      const minute = start.getMinutes().toString().padStart(2, '0')
      return `${month}-${day} ${hour}:${minute}`
    }

    // 4. 跨年
    const year = start.getFullYear().toString().slice(-2)
    const month = (start.getMonth() + 1).toString().padStart(2, '0')
    const day = start.getDate().toString().padStart(2, '0')
    const hour = start.getHours().toString().padStart(2, '0')
    const minute = start.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  const getServicePort = (service: Service): string | null => {
    if (!service.healthCheck) {
      console.log(`[getServicePort] ${service.id}: no healthCheck`)
      return null
    }

    const healthCheck = service.healthCheck as any
    console.log(`[getServicePort] ${service.id}:`, healthCheck)
    
    // 旧格式：直接有 port 或 url 字段
    if (healthCheck.port) {
      console.log(`[getServicePort] ${service.id} found port:`, healthCheck.port)
      return healthCheck.port.toString()
    }
    
    if (healthCheck.url) {
      try {
        const url = new URL(healthCheck.url)
        if (url.port) {
          console.log(`[getServicePort] ${service.id} extracted port from URL:`, url.port)
          return url.port
        }
        // 默认端口
        if (url.protocol === 'http:') return '80'
        if (url.protocol === 'https:') return '443'
      } catch (e) {
        console.error(`[getServicePort] ${service.id} URL parse error:`, e)
      }
    }
    
    // 新格式：从 config 对象获取
    if (healthCheck.config) {
      const config = healthCheck.config
      if (config.port) {
        console.log(`[getServicePort] ${service.id} found port in config:`, config.port)
        return config.port.toString()
      }
      if (config.url) {
        try {
          const url = new URL(config.url)
          if (url.port) return url.port
          if (url.protocol === 'http:') return '80'
          if (url.protocol === 'https:') return '443'
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    console.log(`[getServicePort] ${service.id}: no port found`)
    return null
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(services.map((s) => s.id))
    } else {
      onSelectionChange?.([])
    }
  }

  const handleSelectService = (serviceId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedServices, serviceId])
    } else {
      onSelectionChange?.(selectedServices.filter((id) => id !== serviceId))
    }
  }

  const handleStart = (serviceId: string, serviceName: string) => {
    toast.success(`正在启动 ${serviceName}...`)
    onStart?.(serviceId)
  }

  const handleStop = (serviceId: string, serviceName: string) => {
    toast.success(`正在停止 ${serviceName}...`)
    onStop?.(serviceId)
  }

  const handleRestart = (serviceId: string, serviceName: string) => {
    toast.success(`正在重启 ${serviceName}...`)
    onRestart?.(serviceId)
  }

  const isAllSelected = services.length > 0 && selectedServices.length === services.length
  const isIndeterminate = selectedServices.length > 0 && selectedServices.length < services.length

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="全选"
                  className={isIndeterminate ? "opacity-50" : ""}
                />
              </TableHead>
            )}
            <TableHead>状态</TableHead>
            <TableHead>服务名称</TableHead>
            <TableHead>所属应用</TableHead>
            <TableHead>分组</TableHead>
            <TableHead>健康状态</TableHead>
            <TableHead>端口</TableHead>
            <TableHead>PID</TableHead>
            <TableHead>最新启动时间</TableHead>
            <TableHead>依赖</TableHead>
            <TableHead className="text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 11 : 10} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p>暂无服务</p>
                  <p className="text-sm">点击"新建服务"按钮创建第一个服务</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            services.map((service) => (
              <TableRow key={service.id} className={cn(selectedServices.includes(service.id) && "bg-primary/5")}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => handleSelectService(service.id, !!checked)}
                      aria-label={`选择 ${service.name}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        service.status === "running" && "bg-success animate-pulse",
                        service.status === "stopped" && "bg-muted-foreground",
                        service.status === "starting" && "bg-warning animate-pulse",
                        service.status === "stopping" && "bg-warning",
                        service.status === "error" && "bg-destructive",
                      )}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {service.status === "running" && "运行中"}
                      {service.status === "stopped" && "已停止"}
                      {service.status === "starting" && "启动中"}
                      {service.status === "stopping" && "停止中"}
                      {service.status === "error" && "错误"}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{service.name}</p>
                    {service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{getApplicationName(service.groupId)}</Badge>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{getGroupName(service.groupId)}</Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      service.healthStatus === "healthy" && "border-success text-success",
                      service.healthStatus === "unhealthy" && "border-destructive text-destructive",
                      service.healthStatus === "unconfigured" && "border-muted-foreground text-muted-foreground",
                    )}
                  >
                    {service.healthStatus === "healthy" && "健康"}
                    {service.healthStatus === "unhealthy" && "异常"}
                    {service.healthStatus === "unconfigured" && "未配置"}
                    {service.healthStatus === "checking" && "检查中"}
                  </Badge>
                </TableCell>

                <TableCell>
                  {(() => {
                    const port = getServicePort(service)
                    return port ? (
                      <span className="font-mono text-sm">{port}</span>
                    ) : (
                      <span className="text-muted-foreground" title={JSON.stringify(service.healthCheck)}>-</span>
                    )
                  })()}
                </TableCell>

                <TableCell>
                  {service.pid ? (
                    <span className="font-mono text-sm">{service.pid}</span>
                  ) : (
                    <span className="text-muted-foreground" title={`PID: ${service.pid}`}>-</span>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm" title={service.startedAt ? service.startedAt.toString() : 'No startedAt'}>
                    {formatStartTime(service.startedAt)}
                  </span>
                </TableCell>

                <TableCell>
                  {service.dependencies && service.dependencies.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {service.dependencies.length} 个依赖
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">无</span>
                  )}
                </TableCell>

                <TableCell>
                  <TooltipProvider>
                    <div className="flex justify-center gap-1">
                      {service.status === "stopped" || service.status === "error" ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleStart(service.id, service.name)}
                              className="hover:bg-green-50 hover:text-green-600"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>启动服务</TooltipContent>
                        </Tooltip>
                      ) : service.status === "running" ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleRestart(service.id, service.name)}
                                className="hover:bg-blue-50 hover:text-blue-600"
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>重启服务</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleStop(service.id, service.name)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>停止服务</TooltipContent>
                          </Tooltip>
                        </>
                      ) : null}

                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>更多操作</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit?.(service.id)}>编辑服务</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete?.(service.id)} className="text-destructive">
                            删除服务
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
