
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus, Search, RefreshCw, Play, Square, RotateCw, CheckSquare, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ServiceTable } from "@/components/service-table"
import { ServiceDialog } from "@/components/create-service-dialog"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useConfig } from "@/hooks/use-config"
import type { Service } from "@/types/service"

export default function ServicesPage() {
  const { config, loading, createService, updateService, deleteService } = useConfig()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [selectedApp, setSelectedApp] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const groups = config?.groups || []
  const applications = config?.applications || []
  const allServices = groups.flatMap((group) => group.services)

  const filteredServices = allServices.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGroup = selectedGroup === "all" || service.groupId === selectedGroup

    const matchesApp =
      selectedApp === "all" ||
      applications.find((app) => app.id === selectedApp && app.groupIds.includes(service.groupId))

    const matchesStatus = selectedStatus === "all" || service.status === selectedStatus

    return matchesSearch && matchesGroup && matchesApp && matchesStatus
  })

  const handleBatchStart = () => {
    if (selectedServices.length === 0) {
      toast.error("请先选择服务")
      return
    }
    setIsActionLoading(true)
    setTimeout(() => {
      toast.success(`已启动 ${selectedServices.length} 个服务`)
      setSelectedServices([])
      setIsActionLoading(false)
    }, 1000)
  }

  const handleBatchStop = () => {
    if (selectedServices.length === 0) {
      toast.error("请先选择服务")
      return
    }
    setIsActionLoading(true)
    setTimeout(() => {
      toast.success(`已停止 ${selectedServices.length} 个服务`)
      setSelectedServices([])
      setIsActionLoading(false)
    }, 1000)
  }

  const handleBatchRestart = () => {
    if (selectedServices.length === 0) {
      toast.error("请先选择服务")
      return
    }
    setIsActionLoading(true)
    setTimeout(() => {
      toast.success(`已重启 ${selectedServices.length} 个服务`)
      setSelectedServices([])
      setIsActionLoading(false)
    }, 1000)
  }

  const handleRefresh = () => {
    setIsActionLoading(true)
    setTimeout(() => {
      toast.success("服务列表已刷新")
      setIsActionLoading(false)
    }, 500)
  }

  const handleSelectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([])
    } else {
      setSelectedServices(filteredServices.map((s) => s.id))
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (confirm("确定要删除这个服务吗？此操作无法撤销。")) {
      await deleteService(serviceId)
    }
  }

  if (loading && !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <PageHeader
              title="服务管理"
              description="管理和监控所有服务"
              actions={
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isActionLoading}>
                        <RefreshCw className={`h-4 w-4 ${isActionLoading ? "animate-spin" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>刷新列表</TooltipContent>
                  </Tooltip>
                  <ServiceDialog
                    groups={groups}
                    onSubmit={createService}
                    trigger={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        新建服务
                      </Button>
                    }
                  />
                </div>
              }
            />

            {editingService && (
              <ServiceDialog
                groups={groups}
                mode="edit"
                initialData={editingService}
                open={!!editingService}
                onOpenChange={(open) => !open && setEditingService(null)}
                onSubmit={async (data) => {
                  await updateService(data)
                  setEditingService(null)
                }}
              />
            )}

            {selectedServices.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/50 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedServices.length} 个已选</Badge>
                  <span className="text-sm text-muted-foreground">批量操作：</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleBatchStart} disabled={isActionLoading}>
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        启动
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>批量启动选中的服务</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleBatchStop} disabled={isActionLoading}>
                        <Square className="mr-1.5 h-3.5 w-3.5" />
                        停止
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>批量停止选中的服务</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleBatchRestart} disabled={isActionLoading}>
                        <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                        重启
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>批量重启选中的服务</TooltipContent>
                  </Tooltip>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedServices([])}>
                    取消选择
                  </Button>
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-wrap gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleSelectAll}>
                    <CheckSquare
                      className={`h-4 w-4 ${selectedServices.length === filteredServices.length && filteredServices.length > 0 ? "text-primary" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {selectedServices.length === filteredServices.length ? "取消全选" : "全选"}
                </TooltipContent>
              </Tooltip>

              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索服务名称或描述..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="所属应用" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有应用</SelectItem>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分组</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="服务状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="stopped">已停止</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ServiceTable
              services={filteredServices}
              groups={groups}
              applications={applications}
              selectedServices={selectedServices}
              onSelectionChange={setSelectedServices}
              onEdit={(serviceId) => {
                const service = allServices.find(s => s.id === serviceId)
                if (service) setEditingService(service)
              }}
              onDelete={handleDelete}
            />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
