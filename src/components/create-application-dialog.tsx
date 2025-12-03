"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { mockGroups } from "@/lib/mock-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, BarChart, Layers, Zap, Database, Cloud, Upload } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface CreateApplicationDialogProps {
  trigger?: React.ReactNode
  onSubmit?: (data: { name: string; description: string; icon: string; groupIds: string[] }) => void
}

const iconOptions = [
  { value: "ShoppingCart", icon: ShoppingCart, label: "购物车" },
  { value: "BarChart", icon: BarChart, label: "图表" },
  { value: "Layers", icon: Layers, label: "层级" },
  { value: "Zap", icon: Zap, label: "闪电" },
  { value: "Database", icon: Database, label: "数据库" },
  { value: "Cloud", icon: Cloud, label: "云" },
]

export function CreateApplicationDialog({ trigger, onSubmit }: CreateApplicationDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Layers",
    groupIds: [] as string[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
    setOpen(false)
    setFormData({ name: "", description: "", icon: "Layers", groupIds: [] })
  }

  const toggleGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>创建应用</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>创建应用</DialogTitle>
            <DialogDescription>创建一个新的应用来管理多个服务分组</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="app-name">应用名称 *</Label>
              <Input
                id="app-name"
                placeholder="例如：电商平台"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="app-description">描述</Label>
              <Textarea
                id="app-description"
                placeholder="应用的描述信息"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>选择图标</Label>
              <RadioGroup value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <div className="grid grid-cols-3 gap-3">
                  {iconOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <div key={option.value}>
                        <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                        <Label
                          htmlFor={option.value}
                          className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Icon className="mb-2 h-6 w-6" />
                          <span className="text-xs">{option.label}</span>
                        </Label>
                      </div>
                    )
                  })}
                  <div>
                    <Label
                      htmlFor="upload-icon"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Upload className="mb-2 h-6 w-6" />
                      <span className="text-xs">上传图标</span>
                    </Label>
                    <input id="upload-icon" type="file" accept="image/*" className="hidden" />
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label>选择服务分组 *</Label>
              <ScrollArea className="h-[180px] rounded-md border border-border p-4">
                <div className="space-y-3">
                  {mockGroups.map((group) => (
                    <div key={group.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={formData.groupIds.includes(group.id)}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={`group-${group.id}`}
                          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {group.name}
                        </label>
                        {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                        <p className="text-xs text-muted-foreground">{group.services.length} 个服务</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">至少选择一个服务分组</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={formData.groupIds.length === 0 || !formData.name}>
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
