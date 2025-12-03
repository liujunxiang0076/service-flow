"use client"

import type { ServiceGroup } from "@/types/service"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, MoreVertical, ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ServiceGroupCardProps {
  group: ServiceGroup
  onStart?: (groupId: string) => void
  onStop?: (groupId: string) => void
  onEdit?: (groupId: string) => void
  onDelete?: (groupId: string) => void
}

export function ServiceGroupCard({ group, onStart, onStop, onEdit, onDelete }: ServiceGroupCardProps) {
  const [expanded, setExpanded] = useState(true)

  const runningCount = group.services.filter((s) => s.status === "running").length
  const totalCount = group.services.length
  const hasError = group.services.some((s) => s.status === "error")

  return (
    <Card className="overflow-hidden">
      {/* Group Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{expanded ? "收起" : "展开"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div>
              <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
              {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={hasError ? "destructive" : runningCount === totalCount ? "default" : "secondary"}>
              {runningCount}/{totalCount} 运行中
            </Badge>

            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => onStart?.(group.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>启动分组</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => onStop?.(group.id)}>
                      <Square className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>停止分组</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>更多操作</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(group.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑分组
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete?.(group.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除分组
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      {expanded && (
        <div className="divide-y divide-border">
          {group.services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    service.status === "running" && "bg-success animate-pulse",
                    service.status === "stopped" && "bg-muted-foreground",
                    service.status === "starting" && "bg-warning animate-pulse",
                    service.status === "stopping" && "bg-warning",
                    service.status === "error" && "bg-destructive",
                  )}
                />

                <div>
                  <p className="font-medium text-foreground">{service.name}</p>
                  {service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
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

                <Badge variant="secondary">
                  {service.status === "running" && "运行中"}
                  {service.status === "stopped" && "已停止"}
                  {service.status === "starting" && "启动中"}
                  {service.status === "stopping" && "停止中"}
                  {service.status === "error" && "错误"}
                </Badge>

                {service.pid && <span className="text-xs text-muted-foreground">PID: {service.pid}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
