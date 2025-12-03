"use client"

import type { ServiceGroup } from "@/types/service"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle, Edit2 } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AddDependencyDialog } from "@/components/add-dependency-dialog"
import { EditDependencyDialog } from "@/components/edit-dependency-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface DependencyManagerProps {
  groups: ServiceGroup[]
}

export function DependencyManager({ groups }: DependencyManagerProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [depToDelete, setDepToDelete] = useState<string>("")

  const currentGroup = groups.find((g) => g.id === selectedGroup)
  const availableGroups = groups.filter((g) => g.id !== selectedGroup)

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || groupId
  }

  const getGroupStatus = (group: ServiceGroup): "running" | "stopped" | "mixed" => {
    const runningCount = group.services.filter((s) => s.status === "running").length
    if (runningCount === 0) return "stopped"
    if (runningCount === group.services.length) return "running"
    return "mixed"
  }

  const handleAddDependency = (dependencyId: string) => {
    console.log("[v0] Adding dependency:", dependencyId, "to group:", selectedGroup)
  }

  const handleRemoveDependency = (dependencyId: string) => {
    console.log("[v0] Removing dependency:", dependencyId, "from group:", selectedGroup)
    setDeleteDialogOpen(false)
    setDepToDelete("")
  }

  const handleReorderDependencies = (fromIndex: number, toIndex: number) => {
    console.log("[v0] Reordering dependencies from", fromIndex, "to", toIndex)
  }

  const currentDependencies = currentGroup
    ? (currentGroup.dependencies.map((depId) => groups.find((g) => g.id === depId)).filter(Boolean) as ServiceGroup[])
    : []

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">服务分组依赖管理</h3>
        <p className="mb-6 text-sm text-muted-foreground">管理服务分组之间的依赖关系，确保分组按正确的顺序启动</p>

        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">选择服务分组</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="选择要管理的服务分组" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({group.services.length} 个服务)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {currentGroup && (
          <div className="space-y-4">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  当前依赖的分组 ({currentGroup.dependencies.length})
                </h4>
                <div className="flex gap-2">
                  <AddDependencyDialog
                    currentGroup={currentGroup}
                    availableGroups={availableGroups}
                    onAdd={handleAddDependency}
                  />
                  {currentGroup.dependencies.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            调整顺序
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>调整依赖分组的启动顺序</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {currentGroup.dependencies.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">该分组暂无依赖项</p>
                  <p className="mt-1 text-xs text-muted-foreground">点击"添加依赖"按钮添加依赖分组</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentGroup.dependencies.map((depId, index) => {
                    const depGroup = groups.find((g) => g.id === depId)
                    if (!depGroup) return null
                    const groupStatus = getGroupStatus(depGroup)
                    return (
                      <Card key={depId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <div>
                              <p className="font-medium text-foreground">{getGroupName(depId)}</p>
                              <p className="text-xs text-muted-foreground">
                                {depGroup?.description || "无描述"} • {depGroup.services.length} 个服务
                              </p>
                            </div>
                            <Badge
                              variant={
                                groupStatus === "running"
                                  ? "default"
                                  : groupStatus === "stopped"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="ml-2"
                            >
                              {groupStatus === "running"
                                ? "全部运行"
                                : groupStatus === "stopped"
                                  ? "全部停止"
                                  : "部分运行"}
                            </Badge>
                          </div>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setDepToDelete(depId)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>移除依赖分组</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {currentGroup.dependencies.some((depId) => {
              const depGroup = groups.find((g) => g.id === depId)
              return depGroup && getGroupStatus(depGroup) !== "running"
            }) && (
              <Card className="border-warning bg-warning/10 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <h5 className="font-medium text-warning">依赖分组未完全运行</h5>
                    <p className="text-sm text-warning/80">部分依赖分组的服务未在运行状态，启动此分组可能会失败</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="rounded-lg bg-muted/50 p-4">
              <h5 className="mb-2 text-sm font-medium text-foreground">启动顺序</h5>
              <ol className="space-y-1 text-sm text-muted-foreground">
                {currentGroup.dependencies.map((depId, index) => (
                  <li key={depId}>
                    {index + 1}. {getGroupName(depId)}
                  </li>
                ))}
                <li className="font-medium text-foreground">
                  {currentGroup.dependencies.length + 1}. {currentGroup.name}
                </li>
              </ol>
            </div>

            <Card className="p-4">
              <h5 className="mb-3 text-sm font-medium text-foreground">该分组包含的服务</h5>
              <div className="space-y-2">
                {currentGroup.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.description || "无描述"}</p>
                    </div>
                    <Badge variant={service.status === "running" ? "default" : "secondary"}>
                      {service.status === "running" ? "运行中" : "已停止"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">依赖统计</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">独立分组</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {groups.filter((g) => g.dependencies.length === 0).length}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">有依赖分组</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {groups.filter((g) => g.dependencies.length > 0).length}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">平均依赖数</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {groups.length > 0
                ? (groups.reduce((acc, g) => acc + g.dependencies.length, 0) / groups.length).toFixed(1)
                : "0"}
            </p>
          </div>
        </div>
      </Card>

      {currentGroup && (
        <EditDependencyDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          currentGroup={currentGroup}
          dependencies={currentDependencies}
          onReorder={handleReorderDependencies}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除依赖</AlertDialogTitle>
            <AlertDialogDescription>
              确定要从 {currentGroup?.name} 移除依赖分组 {getGroupName(depToDelete)} 吗？这可能会影响分组的启动顺序。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRemoveDependency(depToDelete)}>确认移除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
