"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, BarChart, Layers, Zap, Database, Cloud, Upload } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ServiceGroup, Application } from "@/types/service"
import { cn } from "@/lib/utils"

interface ApplicationDialogProps {
  trigger?: React.ReactNode
  onSubmit?: (data: any) => void
  groups: ServiceGroup[]
  mode?: "create" | "edit"
  initialData?: Application
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const iconOptions = [
  { value: "ShoppingCart", icon: ShoppingCart, label: "购物车" },
  { value: "BarChart", icon: BarChart, label: "图表" },
  { value: "Layers", icon: Layers, label: "层级" },
  { value: "Zap", icon: Zap, label: "闪电" },
  { value: "Database", icon: Database, label: "数据库" },
  { value: "Cloud", icon: Cloud, label: "云" },
]

export function ApplicationDialog({ 
  trigger, 
  onSubmit, 
  groups, 
  mode = "create", 
  initialData,
  open: controlledOpen,
  onOpenChange: setControlledOpen 
}: ApplicationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    groupIds: [] as string[],
  })

  useEffect(() => {
    if (open && initialData && mode === "edit") {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        icon: initialData.icon || "",
        groupIds: initialData.groupIds || [],
      })
    } else if (open && mode === "create") {
      setFormData({ name: "", description: "", icon: "", groupIds: [] })
    }
  }, [open, initialData, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(mode === "edit" ? { ...initialData, ...formData } : formData)
    setOpen(false)
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
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "创建应用" : "编辑应用"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "创建一个新的应用来管理多个服务分组" : "修改应用信息及关联的服务分组"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="app-name">应用名称 *</Label>
              <Input
                id="app-name"
                placeholder="例如：电商平台"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoComplete="off"
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
                autoComplete="off"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>图标</Label>
              <RadioGroup 
                value={formData.icon} 
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
                className="flex flex-wrap gap-2"
              >
                {iconOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = formData.icon === option.value
                  return (
                    <div key={option.value}>
                      <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                      <Label
                        htmlFor={option.value}
                        className={cn(
                          "flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-input bg-transparent transition-all hover:bg-accent hover:text-accent-foreground",
                          isSelected && "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        )}
                        title={option.label}
                      >
                        <Icon className="h-5 w-5" />
                      </Label>
                    </div>
                  )
                })}
                <div>
                  <Label
                    htmlFor="upload-icon"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-dashed border-input bg-transparent transition-all hover:bg-accent hover:text-accent-foreground"
                    title="上传图标"
                  >
                    <Upload className="h-4 w-4" />
                  </Label>
                  <input id="upload-icon" type="file" accept="image/*" className="hidden" />
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label>选择服务分组 (可选)</Label>
              <ScrollArea className="h-[150px] rounded-md border border-border p-3">
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={formData.groupIds.includes(group.id)}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <div className="grid gap-1 leading-none">
                        <label
                          htmlFor={`group-${group.id}`}
                          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {group.name}
                        </label>
                        {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!formData.name}>
              {mode === "create" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
