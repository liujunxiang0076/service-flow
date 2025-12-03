
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Activity, CheckCircle2, XCircle, Clock, Cpu, HardDrive, Network, Server } from "lucide-react"
import { mockGroups, mockServerHealth } from "@/lib/mock-data"
import { CreateHealthCheckDialog } from "@/components/create-health-check-dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HealthPage() {
  const allServices = mockGroups.flatMap((group) => group.services)

  const healthyCount = allServices.filter((s) => s.healthStatus === "healthy").length
  const unhealthyCount = allServices.filter((s) => s.healthStatus === "unhealthy").length
  const unconfiguredCount = allServices.filter((s) => s.healthStatus === "unconfigured").length

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}天 ${hours}小时 ${minutes}分钟`
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <PageHeader
            title="健康检查"
            description="监控服务健康状态和配置检查规则"
            actions={
              <CreateHealthCheckDialog
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    配置检查
                  </Button>
                }
              />
            }
          />

          <Tabs defaultValue="services" className="space-y-6">
            <TabsList>
              <TabsTrigger value="services">服务健康</TabsTrigger>
              <TabsTrigger value="server">服务器健康</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-6">
              {/* Health Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">健康服务</p>
                      <p className="mt-2 text-3xl font-bold text-success">{healthyCount}</p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-3">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <Progress value={(healthyCount / allServices.length) * 100} className="mt-4" />
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">异常服务</p>
                      <p className="mt-2 text-3xl font-bold text-destructive">{unhealthyCount}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/10 p-3">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                  <Progress value={(unhealthyCount / allServices.length) * 100} className="mt-4" />
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">未配置</p>
                      <p className="mt-2 text-3xl font-bold text-muted-foreground">{unconfiguredCount}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <Progress value={(unconfiguredCount / allServices.length) * 100} className="mt-4" />
                </Card>
              </div>

              {/* Service Health Status */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">服务健康状态</h2>

                {mockGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <div className="border-b border-border bg-card/50 p-4">
                      <h3 className="font-semibold text-foreground">{group.name}</h3>
                    </div>

                    <div className="divide-y divide-border">
                      {group.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Activity className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge
                                variant={
                                  service.healthStatus === "healthy"
                                    ? "default"
                                    : service.healthStatus === "unhealthy"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="mb-1"
                              >
                                {service.healthStatus === "healthy" && "健康"}
                                {service.healthStatus === "unhealthy" && "异常"}
                                {service.healthStatus === "unconfigured" && "未配置"}
                                {service.healthStatus === "checking" && "检查中"}
                              </Badge>
                              {service.healthStatus !== "unconfigured" && (
                                <p className="text-xs text-muted-foreground">最后检查: 2 分钟前</p>
                              )}
                            </div>

                            <Button variant="outline" size="sm">
                              配置
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="server" className="space-y-6">
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">服务器资源监控</h3>
                    <p className="text-sm text-muted-foreground">实时监控服务器关键硬件资源占用情况</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">运行时长</p>
                    <p className="text-lg font-semibold text-foreground">{formatUptime(mockServerHealth.uptime)}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* CPU Usage */}
                  <Card className="border-2 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Cpu className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CPU 使用率</p>
                          <p className="text-2xl font-bold text-foreground">{mockServerHealth.cpu.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={mockServerHealth.cpu} className="h-3" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {mockServerHealth.cpu < 60 ? "运行正常" : mockServerHealth.cpu < 80 ? "负载较高" : "负载过高"}
                    </p>
                  </Card>

                  {/* Memory Usage */}
                  <Card className="border-2 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-accent/10 p-2">
                          <Server className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">内存使用率</p>
                          <p className="text-2xl font-bold text-foreground">{mockServerHealth.memory.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={mockServerHealth.memory} className="h-3" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {mockServerHealth.memory < 70
                        ? "运行正常"
                        : mockServerHealth.memory < 85
                          ? "内存紧张"
                          : "内存不足"}
                    </p>
                  </Card>

                  {/* Disk Usage */}
                  <Card className="border-2 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-success/10 p-2">
                          <HardDrive className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">磁盘使用率</p>
                          <p className="text-2xl font-bold text-foreground">{mockServerHealth.disk.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={mockServerHealth.disk} className="h-3" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {mockServerHealth.disk < 75 ? "空间充足" : mockServerHealth.disk < 90 ? "空间紧张" : "空间不足"}
                    </p>
                  </Card>

                  {/* Network */}
                  <Card className="border-2 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-warning/10 p-2">
                          <Network className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">网络流量</p>
                          <p className="text-sm font-medium text-foreground">
                            ↓ {mockServerHealth.network.in.toFixed(1)} KB/s
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            ↑ {mockServerHealth.network.out.toFixed(1)} KB/s
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">实时网络流量监控</p>
                  </Card>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">系统信息</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">操作系统</p>
                    <p className="mt-1 font-medium text-foreground">Linux Ubuntu 22.04 LTS</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">内核版本</p>
                    <p className="mt-1 font-medium text-foreground">5.15.0-91-generic</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">处理器</p>
                    <p className="mt-1 font-medium text-foreground">Intel Xeon E5-2680 v4 (8 cores)</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">总内存</p>
                    <p className="mt-1 font-medium text-foreground">16 GB DDR4</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
