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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockGroups } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreateHealthCheckDialogProps {
  trigger?: React.ReactNode
  onSubmit?: (data: any) => void
}

export function CreateHealthCheckDialog({ trigger, onSubmit }: CreateHealthCheckDialogProps) {
  const [open, setOpen] = useState(false)
  const [checkType, setCheckType] = useState<"http" | "tcp" | "command">("http")
  const [formData, setFormData] = useState({
    serviceId: "",
    interval: 30,
    timeout: 5,
    httpUrl: "",
    httpMethod: "GET",
    httpStatus: 200,
    tcpHost: "localhost",
    tcpPort: 3000,
    command: "",
  })

  const allServices = mockGroups.flatMap((g) => g.services)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ ...formData, type: checkType })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>配置健康检查</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>配置健康检查</DialogTitle>
            <DialogDescription>为服务添加健康检查以监控其运行状态</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service">选择服务 *</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择要配置的服务" />
                </SelectTrigger>
                <SelectContent>
                  {allServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={checkType} onValueChange={(v) => setCheckType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="http">HTTP</TabsTrigger>
                <TabsTrigger value="tcp">TCP</TabsTrigger>
                <TabsTrigger value="command">命令</TabsTrigger>
              </TabsList>

              <TabsContent value="http" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    placeholder="http://localhost:3000/health"
                    value={formData.httpUrl}
                    onChange={(e) => setFormData({ ...formData, httpUrl: e.target.value })}
                    required={checkType === "http"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="method">HTTP 方法</Label>
                    <Select
                      value={formData.httpMethod}
                      onValueChange={(value) => setFormData({ ...formData, httpMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">期望状态码</Label>
                    <Input
                      id="status"
                      type="number"
                      value={formData.httpStatus}
                      onChange={(e) => setFormData({ ...formData, httpStatus: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tcp" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="host">主机 *</Label>
                    <Input
                      id="host"
                      placeholder="localhost"
                      value={formData.tcpHost}
                      onChange={(e) => setFormData({ ...formData, tcpHost: e.target.value })}
                      required={checkType === "tcp"}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="port">端口 *</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="3000"
                      value={formData.tcpPort}
                      onChange={(e) => setFormData({ ...formData, tcpPort: Number.parseInt(e.target.value) })}
                      required={checkType === "tcp"}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="command" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="command">检查命令 *</Label>
                  <Input
                    id="command"
                    placeholder="curl -f http://localhost:3000/health"
                    value={formData.command}
                    onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                    required={checkType === "command"}
                  />
                  <p className="text-xs text-muted-foreground">命令返回 0 表示健康，非 0 表示异常</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interval">检查间隔（秒）</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: Number.parseInt(e.target.value) })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeout">超时时间（秒）</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1"
                  value={formData.timeout}
                  onChange={(e) => setFormData({ ...formData, timeout: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">保存配置</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
