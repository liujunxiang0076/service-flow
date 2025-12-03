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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockApplications } from "@/lib/mock-data"

interface CreateGroupDialogProps {
  trigger?: React.ReactNode
  onSubmit?: (data: {
    name: string
    description: string
    applicationId?: string
    startupDelay: number
  }) => void
}

export function CreateGroupDialog({ trigger, onSubmit }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    applicationId: "",
    startupDelay: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({
      ...formData,
      applicationId: formData.applicationId || undefined,
    })
    setOpen(false)
    setFormData({ name: "", description: "", applicationId: "", startupDelay: 0 })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>创建分组</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>创建服务分组</DialogTitle>
            <DialogDescription>创建一个新的服务分组来组织和管理相关服务</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">分组名称 *</Label>
              <Input
                id="name"
                placeholder="例如：开发环境"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="分组的描述信息"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="application">所属应用</Label>
              <Select
                value={formData.applicationId}
                onValueChange={(value) => setFormData({ ...formData, applicationId: value })}
              >
                <SelectTrigger id="application">
                  <SelectValue placeholder="选择应用（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不属于任何应用</SelectItem>
                  {mockApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">选择此分组所属的应用，方便统一管理</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="delay">启动延迟（毫秒）</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                placeholder="0"
                value={formData.startupDelay}
                onChange={(e) => setFormData({ ...formData, startupDelay: Number.parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">分组启动时的延迟时间，用于避免资源竞争</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">创建</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
