"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ServiceGroup } from "@/types/service"
import { ArrowUp, ArrowDown } from "lucide-react"

interface EditDependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentGroup: ServiceGroup
  dependencies: ServiceGroup[]
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function EditDependencyDialog({
  open,
  onOpenChange,
  currentGroup,
  dependencies,
  onReorder,
}: EditDependencyDialogProps) {
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onReorder(index, index - 1)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < dependencies.length - 1) {
      onReorder(index, index + 1)
    }
  }

  const getGroupStatus = (group: ServiceGroup): "running" | "stopped" | "mixed" => {
    const runningCount = group.services.filter((s) => s.status === "running").length
    if (runningCount === 0) return "stopped"
    if (runningCount === group.services.length) return "running"
    return "mixed"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑依赖顺序</DialogTitle>
          <DialogDescription>
            调整 {currentGroup.name} 的依赖启动顺序，分组将按照从上到下的顺序依次启动
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {dependencies.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">该分组暂无依赖项</p>
            </div>
          ) : (
            dependencies.map((dep, index) => {
              const groupStatus = getGroupStatus(dep)
              return (
                <Card key={dep.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>上移</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleMoveDown(index)}
                                disabled={index === dependencies.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>下移</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium text-foreground">{dep.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dep.description || "无描述"} • {dep.services.length} 个服务
                        </p>
                      </div>
                      <Badge
                        variant={
                          groupStatus === "running" ? "default" : groupStatus === "stopped" ? "secondary" : "outline"
                        }
                        className="ml-2"
                      >
                        {groupStatus === "running" ? "全部运行" : groupStatus === "stopped" ? "全部停止" : "部分运行"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
