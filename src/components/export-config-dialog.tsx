"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportConfigDialog({ open, onOpenChange }: ExportConfigDialogProps) {
  const { toast } = useToast()
  const [exportOptions, setExportOptions] = useState({
    applications: true,
    groups: true,
    services: true,
    dependencies: true,
    healthChecks: true,
    settings: true,
  })

  const handleExport = () => {
    const config = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      ...exportOptions,
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `serviceflow-config-${new Date().getTime()}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "配置已导出",
      description: "配置文件已成功下载到本地",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导出配置</DialogTitle>
          <DialogDescription>选择要导出的配置项</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Object.entries(exportOptions).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, [key]: checked === true }))}
              />
              <Label htmlFor={key} className="cursor-pointer">
                {key === "applications" && "应用配置"}
                {key === "groups" && "分组配置"}
                {key === "services" && "服务配置"}
                {key === "dependencies" && "依赖关系"}
                {key === "healthChecks" && "健康检查"}
                {key === "settings" && "系统设置"}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
