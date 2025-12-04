import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import {
  Server,
  Activity,
  AlertCircle,
  Layers,
  RefreshCw,
  Play,
  Square,
  ChevronRight,
  Clock,
  TrendingUp,
  ShoppingCart,
  BarChart,
  Loader2,
} from "lucide-react"
import { mockGroups, mockApplications } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  BarChart,
  Layers,
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  // Calculate stats from mock data
  const totalServices = mockGroups.reduce((acc, group) => acc + group.services.length, 0)
  const runningServices = mockGroups.reduce(
    (acc, group) => acc + group.services.filter((s) => s.status === "running").length,
    0,
  )
  const stoppedServices = mockGroups.reduce(
    (acc, group) => acc + group.services.filter((s) => s.status === "stopped").length,
    0,
  )
  const errorServices = mockGroups.reduce(
    (acc, group) => acc + group.services.filter((s) => s.status === "error").length,
    0,
  )

  // Recent activities mock data
  const recentActivities = [
    { id: 1, action: "启动", service: "API Gateway", time: "2 分钟前", status: "success" },
    { id: 2, action: "重启", service: "Redis 缓存", time: "15 分钟前", status: "success" },
    { id: 3, action: "停止", service: "日志收集器", time: "1 小时前", status: "warning" },
    { id: 4, action: "错误", service: "数据库主节点", time: "2 小时前", status: "error" },
  ]

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <PageHeader
              title="服务管理仪表盘"
              description="实时监控和管理您的所有服务"
              actions={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>刷新数据</TooltipContent>
                </Tooltip>
              }
            />

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">应用数</p>
                    {isLoading ? (
                      <div className="mt-2 h-9 flex items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <p className="mt-2 text-3xl font-bold text-foreground">{mockApplications.length}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">管理 {mockGroups.length} 个服务分组</p>
              </Card>

              <Card className="p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总服务数</p>
                    {isLoading ? (
                      <div className="mt-2 h-9 flex items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <p className="mt-2 text-3xl font-bold text-foreground">{totalServices}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-accent/10 p-3">
                    <Server className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">跨 {mockGroups.length} 个分组</p>
              </Card>

              <Card className="p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">运行中</p>
                    {isLoading ? (
                      <div className="mt-2 h-9 flex items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <p className="mt-2 text-3xl font-bold text-success">{runningServices}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-success/10 p-3">
                    <Activity className="h-6 w-6 text-success" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">运行率</span>
                    <span className="font-medium">{((runningServices / totalServices) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(runningServices / totalServices) * 100} className="h-1.5" />
                </div>
              </Card>

              <Card className="p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">异常服务</p>
                    {isLoading ? (
                      <div className="mt-2 h-9 flex items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <p className="mt-2 text-3xl font-bold text-destructive">{errorServices}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-3">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                {errorServices > 0 && <p className="mt-4 text-xs text-destructive font-medium">需要立即关注</p>}
                {errorServices === 0 && <p className="mt-4 text-xs text-success">所有服务正常</p>}
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Applications Overview - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">应用概览</h2>
                  <Link to="/applications">
                    <Button variant="ghost" size="sm">
                      查看全部
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {mockApplications.map((app) => {
                  const Icon = iconMap[app.icon || "Layers"] || Layers
                  const appGroups = mockGroups.filter((g) => app.groupIds.includes(g.id))
                  const totalAppServices = appGroups.reduce((acc, g) => acc + g.services.length, 0)
                  const runningAppServices = appGroups.reduce(
                    (acc, g) => acc + g.services.filter((s) => s.status === "running").length,
                    0,
                  )

                  return (
                    <Card key={app.id} className="overflow-hidden transition-shadow hover:shadow-md">
                      <div className="border-b border-border bg-card/50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">{app.name}</h3>
                              <p className="text-sm text-muted-foreground">{app.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">服务状态</p>
                              <p className="text-lg font-semibold">
                                <span className="text-success">{runningAppServices}</span>
                                <span className="text-muted-foreground"> / {totalAppServices}</span>
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Play className="h-4 w-4 text-success" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>启动全部</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Square className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>停止全部</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="space-y-3">
                          {appGroups.map((group) => {
                            const groupRunning = group.services.filter((s) => s.status === "running").length
                            const groupTotal = group.services.length

                            return (
                              <div key={group.id} className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-foreground">{group.name}</h4>
                                    <p className="text-xs text-muted-foreground">{group.description}</p>
                                  </div>
                                  <Badge variant="secondary">
                                    {groupRunning}/{groupTotal} 运行中
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {group.services.map((service) => (
                                    <Badge
                                      key={service.id}
                                      variant={
                                        service.status === "running"
                                          ? "default"
                                          : service.status === "error"
                                            ? "destructive"
                                            : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      <span
                                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                                          service.status === "running"
                                            ? "bg-success"
                                            : service.status === "error"
                                              ? "bg-destructive"
                                              : "bg-muted-foreground"
                                        }`}
                                      />
                                      {service.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">最近活动</h2>
                  <Link to="/logs">
                    <Button variant="ghost" size="sm">
                      更多
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <Card className="p-4">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-full p-1.5 ${
                            activity.status === "success"
                              ? "bg-success/10"
                              : activity.status === "warning"
                                ? "bg-warning/10"
                                : "bg-destructive/10"
                          }`}
                        >
                          {activity.status === "success" && <TrendingUp className="h-3 w-3 text-success" />}
                          {activity.status === "warning" && <Clock className="h-3 w-3 text-warning" />}
                          {activity.status === "error" && <AlertCircle className="h-3 w-3 text-destructive" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{activity.action}</span>{" "}
                            <span className="text-muted-foreground">{activity.service}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="mb-4 font-medium text-foreground">快速统计</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">运行中服务</span>
                      <span className="text-sm font-medium text-success">{runningServices}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">已停止服务</span>
                      <span className="text-sm font-medium text-muted-foreground">{stoppedServices}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">异常服务</span>
                      <span className="text-sm font-medium text-destructive">{errorServices}</span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">健康度</span>
                        <span className="text-sm font-medium">
                          {((runningServices / totalServices) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={(runningServices / totalServices) * 100} className="mt-2 h-2" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="mb-3 font-medium text-foreground">快捷键</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">全局搜索</span>
                      <kbd className="rounded border bg-muted px-2 py-0.5 text-xs">⌘K</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">刷新页面</span>
                      <kbd className="rounded border bg-muted px-2 py-0.5 text-xs">⌘R</kbd>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
