
import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ShoppingCart, BarChart, MoreVertical, Play, Square, Layers } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ApplicationDialog } from "@/components/create-application-dialog"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConfig } from "@/hooks/use-config"
import { Loader2 } from "lucide-react"
import type { Application } from "@/types/service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  BarChart,
  Layers,
}

export default function ApplicationsPage() {
  const {
    config,
    loading,
    createApplication,
    updateApplication,
    deleteApplication,
    deleteApplicationWithDependencies,
  } = useConfig()
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [deletingApp, setDeletingApp] = useState<Application | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

  const applications = config?.applications || []
  const groups = config?.groups || []

  const selectedAppData = applications.find((app) => app.id === selectedApp)
  const selectedAppGroups = selectedAppData ? groups.filter((g) => selectedAppData.groupIds.includes(g.id)) : []

  const handleSafeDelete = async (app: Application) => {
    // 只有在没有关联分组和服务时，才允许直接删除应用
    const appGroups = config?.groups.filter((g) => app.groupIds.includes(g.id)) ?? []
    const hasGroups = appGroups.length > 0
    const hasServices = appGroups.some((g) => g.services.length > 0)

    if (hasServices || hasGroups) {
      toast.error("该应用下仍有关联的服务和分组，请先在服务管理和分组管理中删除相关内容，然后再删除应用。")
      return false
    }

    await deleteApplication(app.id)
    return true
  }

  const handleForceDelete = async (app: Application) => {
    await deleteApplicationWithDependencies(app.id)
  }

  if (loading && !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <PageHeader
            title="应用管理"
            description="管理包含多个服务分组的应用"
            actions={
              <ApplicationDialog
                groups={groups}
                onSubmit={createApplication}
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新建应用
                  </Button>
                }
              />
            }
          />

          {editingApp && (
            <ApplicationDialog
              groups={groups}
              mode="edit"
              initialData={editingApp}
              open={!!editingApp}
              onOpenChange={(open) => !open && setEditingApp(null)}
              onSubmit={async (data) => {
                await updateApplication(data)
                setEditingApp(null)
              }}
            />
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => {
              const Icon = app.icon ? iconMap[app.icon] : null
              const appGroups = groups.filter((g) => app.groupIds.includes(g.id))
              const totalServices = appGroups.reduce((acc, g) => acc + g.services.length, 0)
              const runningServices = appGroups.reduce(
                (acc, g) => acc + g.services.filter((s) => s.status === "running").length,
                0,
              )

              return (
                <Card key={app.id} className="flex flex-col">
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-3">
                          {Icon ? (
                            <Icon className="h-6 w-6 text-primary" />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                              {(app.name || "?").charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{app.name}</h3>
                          <p className="text-sm text-muted-foreground">{app.description}</p>
                        </div>
                      </div>

                      <TooltipProvider>
                        <DropdownMenu>
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
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingApp(app)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑应用
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeletingApp(app)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除应用
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipProvider>
                    </div>

                    <div className="mb-4 flex-1 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">服务分组</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => setSelectedApp(app.id)}
                        >
                          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                            {appGroups.length} 个
                          </Badge>
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">总服务数</span>
                        <span className="font-medium text-foreground">{totalServices}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">运行状态</span>
                        <span className="font-medium text-success">
                          {runningServices}/{totalServices}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 bg-transparent"
                              disabled={totalServices === 0}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              启动
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>启动所有服务</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 bg-transparent"
                              disabled={totalServices === 0}
                            >
                              <Square className="mr-2 h-4 w-4" />
                              停止
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>停止所有服务</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="border-t border-border bg-muted/50 px-6 py-3">
                    <p className="text-xs text-muted-foreground">更新于 {new Date(app.updatedAt).toLocaleDateString("zh-CN")}</p>
                  </div>
                </Card>
              )
            })}
          </div>

          {deletingApp && (
            <AlertDialog
              open={!!deletingApp}
              onOpenChange={(open) => {
                if (!open) {
                  setDeletingApp(null)
                  setDeleteConfirmName("")
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>删除应用</AlertDialogTitle>
                  <AlertDialogDescription>
                    你可以选择只删除应用本身（前提是没有关联的分组和服务），或者强制删除应用并连带其所有分组和服务配置。
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-2">
                  <div className="rounded-md border border-border p-3 space-y-2">
                    <p className="text-sm font-medium">安全删除</p>
                    <p className="text-xs text-muted-foreground">
                      仅当应用下<strong>没有任何分组和服务</strong>时，才允许直接删除。否则会给予提示。
                    </p>
                    <Button
                      variant="outline"
                      className="mt-1"
                      onClick={async () => {
                        const ok = await handleSafeDelete(deletingApp)
                        if (ok) {
                          setDeletingApp(null)
                          setDeleteConfirmName("")
                        }
                      }}
                    >
                      仅删除应用
                    </Button>
                  </div>

                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2">
                    <p className="text-sm font-medium text-destructive">强制删除（危险操作）</p>
                    <p className="text-xs text-muted-foreground">
                      将<strong>同时删除应用及其关联的所有分组和服务配置</strong>，此操作不可恢复。请在下方输入应用名称以确认：
                    </p>
                    <Input
                      placeholder={`请输入 “${deletingApp.name}” 以确认`}
                      value={deleteConfirmName}
                      onChange={(e) => setDeleteConfirmName(e.target.value)}
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteConfirmName !== deletingApp.name}
                    onClick={async () => {
                      await handleForceDelete(deletingApp)
                      setDeletingApp(null)
                      setDeleteConfirmName("")
                    }}
                  >
                    强制删除应用及相关配置
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{selectedAppData?.name} - 服务分组详情</DialogTitle>
                <DialogDescription>查看该应用包含的所有服务分组和服务</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedAppGroups.map((group) => (
                  <Card key={group.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{group.name}</h4>
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      </div>
                      <Badge variant="secondary">{group.services.length} 个服务</Badge>
                    </div>

                    <div className="space-y-2">
                      {group.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                service.status === "running"
                                  ? "bg-success"
                                  : service.status === "error"
                                    ? "bg-destructive"
                                    : "bg-muted-foreground"
                              }`}
                            />
                            <span className="text-sm font-medium">{service.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {service.status === "running"
                              ? "运行中"
                              : service.status === "stopped"
                                ? "已停止"
                                : service.status === "error"
                                  ? "错误"
                                  : service.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
