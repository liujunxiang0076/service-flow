"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Plus } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ServiceGroup } from "@/types/service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddDependencyDialogProps {
  currentGroup: ServiceGroup
  availableGroups: ServiceGroup[]
  onAdd: (dependencyId: string) => void
}

export function AddDependencyDialog({ currentGroup, availableGroups, onAdd }: AddDependencyDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDep, setSelectedDep] = useState<string>("")

  const selectableGroups = availableGroups.filter(
    (g) => g.id !== currentGroup.id && !currentGroup.dependencies.includes(g.id),
  )

  const wouldCreateCircular = (depId: string): boolean => {
    const depGroup = availableGroups.find((g) => g.id === depId)
    if (!depGroup) return false

    // Check if the dependency already depends on current group (direct circular)
    if (depGroup.dependencies.includes(currentGroup.id)) return true

    // Check for indirect circular dependencies
    const checkCircular = (groupId: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(groupId)) return true
      visited.add(groupId)

      const group = availableGroups.find((g) => g.id === groupId)
      if (!group) return false

      for (const depId of group.dependencies) {
        if (depId === currentGroup.id) return true
        if (checkCircular(depId, visited)) return true
      }

      return false
    }

    return checkCircular(depId)
  }

  const getGroupStatus = (group: ServiceGroup): "running" | "stopped" | "mixed" => {
    const runningCount = group.services.filter((s) => s.status === "running").length
    if (runningCount === 0) return "stopped"
    if (runningCount === group.services.length) return "running"
    return "mixed"
  }

  const handleAdd = () => {
    if (selectedDep && !wouldCreateCircular(selectedDep)) {
      onAdd(selectedDep)
      setOpen(false)
      setSelectedDep("")
    }
  }

  const selectedGroup = availableGroups.find((g) => g.id === selectedDep)
  const hasCircularWarning = selectedDep !== "" && wouldCreateCircular(selectedDep)
  const selectedGroupStatus = selectedGroup ? getGroupStatus(selectedGroup) : "stopped"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                添加依赖
              </Button>
            </TooltipTrigger>
            <TooltipContent>为此分组添加新的依赖分组</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>添加依赖分组</DialogTitle>
          <DialogDescription>为 {currentGroup.name} 添加依赖的服务分组，该分组将在依赖项启动后再启动</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group">选择依赖分组</Label>
            <Select value={selectedDep} onValueChange={setSelectedDep}>
              <SelectTrigger id="group">
                <SelectValue placeholder="选择要添加的依赖分组" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {selectableGroups.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">没有可添加的分组</div>
                  ) : (
                    selectableGroups.map((group) => {
                      const groupStatus = getGroupStatus(group)
                      return (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {group.name} ({group.services.length} 个服务)
                            </span>
                            <Badge
                              variant={
                                groupStatus === "running"
                                  ? "default"
                                  : groupStatus === "stopped"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {groupStatus === "running"
                                ? "全部运行"
                                : groupStatus === "stopped"
                                  ? "全部停止"
                                  : "部分运行"}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {hasCircularWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                添加此依赖会导致循环依赖！{selectedGroup?.name} 已经直接或间接依赖于 {currentGroup.name}
              </AlertDescription>
            </Alert>
          )}

          {selectedGroup && !hasCircularWarning && (
            <Card className="p-4">
              <h4 className="mb-3 text-sm font-semibold">分组详情</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">分组名称:</span>
                  <span className="font-medium">{selectedGroup.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">服务数量:</span>
                  <span className="font-medium">{selectedGroup.services.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">运行状态:</span>
                  <Badge
                    variant={
                      selectedGroupStatus === "running"
                        ? "default"
                        : selectedGroupStatus === "stopped"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedGroupStatus === "running"
                      ? "全部运行"
                      : selectedGroupStatus === "stopped"
                        ? "全部停止"
                        : "部分运行"}
                  </Badge>
                </div>
                {selectedGroup.description && (
                  <div className="pt-2">
                    <span className="text-muted-foreground">描述:</span>
                    <p className="mt-1 text-xs">{selectedGroup.description}</p>
                  </div>
                )}
                <div className="pt-2">
                  <span className="text-muted-foreground">包含的服务:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedGroup.services.map((service) => (
                      <Badge key={service.id} variant="outline" className="text-xs">
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedGroup.dependencies.length > 0 && (
                  <div className="pt-2">
                    <span className="text-muted-foreground">该分组的依赖项:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedGroup.dependencies.map((depId) => {
                        const dep = availableGroups.find((g) => g.id === depId)
                        return (
                          <Badge key={depId} variant="outline" className="text-xs">
                            {dep?.name || depId}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleAdd} disabled={selectedDep === "" || hasCircularWarning}>
            添加依赖
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
