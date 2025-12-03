"use client"

import type React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Code, FileCode } from "lucide-react"

interface ServiceTemplate {
  id: string
  name: string
  description: string
  type: string
  icon: React.ComponentType<{ className?: string }>
  config: {
    command: string
    args: string[]
    workingDir: string
    env?: Record<string, string>
  }
}

const templates: ServiceTemplate[] = [
  {
    id: "tomcat",
    name: "Tomcat 服务器",
    description: "Apache Tomcat Web 应用服务器",
    type: "tomcat",
    icon: Server,
    config: {
      command: "C:/apache-tomcat/bin/catalina.bat",
      args: ["run"],
      workingDir: "C:/apache-tomcat",
      env: { JAVA_HOME: "C:/Program Files/Java/jdk" },
    },
  },
  {
    id: "redis",
    name: "Redis 数据库",
    description: "Redis 内存数据库服务",
    type: "redis",
    icon: Database,
    config: {
      command: "C:/Redis/redis-server.exe",
      args: ["redis.conf"],
      workingDir: "C:/Redis",
    },
  },
  {
    id: "nginx",
    name: "Nginx 服务器",
    description: "Nginx Web 服务器和反向代理",
    type: "nginx",
    icon: Server,
    config: {
      command: "C:/nginx/nginx.exe",
      args: ["-c", "conf/nginx.conf"],
      workingDir: "C:/nginx",
    },
  },
  {
    id: "mysql",
    name: "MySQL 数据库",
    description: "MySQL 关系型数据库服务",
    type: "mysql",
    icon: Database,
    config: {
      command: "C:/Program Files/MySQL/bin/mysqld.exe",
      args: ["--defaults-file=my.ini"],
      workingDir: "C:/Program Files/MySQL",
    },
  },
  {
    id: "nodejs",
    name: "Node.js 应用",
    description: "Node.js 服务器应用",
    type: "nodejs",
    icon: Code,
    config: {
      command: "node",
      args: ["server.js"],
      workingDir: "C:/app",
    },
  },
  {
    id: "batch",
    name: "批处理脚本",
    description: "Windows 批处理文件",
    type: "batch",
    icon: FileCode,
    config: {
      command: "cmd.exe",
      args: ["/c", "start.bat"],
      workingDir: "C:/scripts",
    },
  },
]

interface ServiceTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: ServiceTemplate) => void
}

export function ServiceTemplatesDialog({ open, onOpenChange, onSelectTemplate }: ServiceTemplatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>选择服务模板</DialogTitle>
          <DialogDescription>使用预设模板快速创建常见服务</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <Card
                key={template.id}
                className="cursor-pointer p-4 transition-colors hover:bg-accent"
                onClick={() => {
                  onSelectTemplate(template)
                  onOpenChange(false)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {template.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
