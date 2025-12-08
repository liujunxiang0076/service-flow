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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, FileCode, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ServiceType, ServiceGroup, Service } from "@/types/service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ServiceDialogProps {
  trigger?: React.ReactNode
  onSubmit?: (data: any) => void
  groups: ServiceGroup[]
  mode?: "create" | "edit"
  initialData?: Service
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const serviceTemplates: Record<
  ServiceType,
  {
    name: string
    description: string
    defaultPath: string
    defaultArgs: string
    defaultWorkDir: string
    defaultPort?: number
    icon: string
  }
> = {
  tomcat: {
    name: "Tomcat 服务器",
    description: "Apache Tomcat Web 应用服务器",
    defaultPath: "C:\\Program Files\\Apache Software Foundation\\Tomcat\\bin\\catalina.bat",
    defaultArgs: "run",
    defaultWorkDir: "C:\\Program Files\\Apache Software Foundation\\Tomcat",
    defaultPort: 8080,
    icon: "🌐",
  },
  redis: {
    name: "Redis",
    description: "Redis 内存数据库",
    defaultPath: "C:\\Program Files\\Redis\\redis-server.exe",
    defaultArgs: "redis.conf",
    defaultWorkDir: "C:\\Program Files\\Redis",
    defaultPort: 6379,
    icon: "💾",
  },
  nginx: {
    name: "Nginx",
    description: "Nginx Web 服务器",
    defaultPath: "C:\\nginx\\nginx.exe",
    defaultArgs: "-c conf/nginx.conf",
    defaultWorkDir: "C:\\nginx",
    defaultPort: 80,
    icon: "⚡",
  },
  mysql: {
    name: "MySQL",
    description: "MySQL 数据库服务",
    defaultPath: "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe",
    defaultArgs: '--defaults-file="my.ini"',
    defaultWorkDir: "C:\\ProgramData\\MySQL\\MySQL Server 8.0",
    defaultPort: 3306,
    icon: "🗄️",
  },
  nodejs: {
    name: "Node.js 应用",
    description: "Node.js 应用程序",
    defaultPath: "C:\\Program Files\\nodejs\\node.exe",
    defaultArgs: "app.js",
    defaultWorkDir: "",
    icon: "🟢",
  },
  batch: {
    name: "批处理脚本",
    description: "Windows 批处理文件 (.bat)",
    defaultPath: "",
    defaultArgs: "",
    defaultWorkDir: "",
    icon: "📝",
  },
  shell: {
    name: "Shell 脚本",
    description: "Linux/Unix Shell 脚本 (.sh)",
    defaultPath: "/bin/bash",
    defaultArgs: "",
    defaultWorkDir: "",
    icon: "🐚",
  },
  python: {
    name: "Python 应用",
    description: "Python 应用程序",
    defaultPath: "python",
    defaultArgs: "app.py",
    defaultWorkDir: "",
    icon: "🐍",
  },
  custom: {
    name: "自定义服务",
    description: "自定义可执行程序",
    defaultPath: "",
    defaultArgs: "",
    defaultWorkDir: "",
    icon: "⚙️",
  },
}

export function ServiceDialog({ 
  trigger, 
  onSubmit, 
  groups, 
  mode = "create",
  initialData,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: ServiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [serviceType, setServiceType] = useState<ServiceType>("custom")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupId: "",
    path: "",
    args: "",
    workDir: "",
    autoStart: false,
    startupDelay: 0,
    port: "",
  })

  useEffect(() => {
    if (open && initialData && mode === "edit") {
      setServiceType(initialData.type || "custom")
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        groupId: initialData.groupId,
        path: initialData.path,
        args: initialData.args?.join(" ") || "",
        workDir: initialData.workDir || "",
        autoStart: initialData.autoStart,
        startupDelay: initialData.startupDelay,
        port: "", // Need to extract port from args or config if possible
      })
    } else if (open && mode === "create") {
      setServiceType("custom")
      setFormData({
        name: "",
        description: "",
        groupId: groups.length > 0 ? groups[0].id : "",
        path: "",
        args: "",
        workDir: "",
        autoStart: false,
        startupDelay: 0,
        port: "",
      })
    }
  }, [open, initialData, mode, groups])

  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type)
    const template = serviceTemplates[type]
    setFormData({
      ...formData,
      name: formData.name || template.name,
      description: formData.description || template.description,
      path: template.defaultPath,
      args: template.defaultArgs,
      workDir: template.defaultWorkDir,
      port: template.defaultPort?.toString() || "",
    })
  }

  const handleSelectFile = async () => {
    const tauri = typeof window !== "undefined" ? (window as any).__TAURI__ : undefined

    if (tauri?.dialog?.open) {
      const selected = await tauri.dialog.open({
        title: "选择可执行文件",
        multiple: false,
      })
      if (typeof selected === "string") {
        setFormData({ ...formData, path: selected })
      }
    } else {
      const input = document.createElement("input")
      input.type = "file"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          // 浏览器环境无法获取绝对路径，只显示文件名
          setFormData({ ...formData, path: file.name })
        }
      }
      input.click()
    }
  }

  const handleSelectFolder = async () => {
    const tauri = typeof window !== "undefined" ? (window as any).__TAURI__ : undefined

    if (tauri?.dialog?.open) {
      const selected = await tauri.dialog.open({
        title: "选择工作目录",
        directory: true,
        multiple: false,
      })
      if (typeof selected === "string") {
        setFormData({ ...formData, workDir: selected })
      }
    } else {
      const input = document.createElement("input")
      input.type = "file"
      input.setAttribute("webkitdirectory", "")
      input.setAttribute("directory", "")
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files && files.length > 0) {
          const path = files[0].webkitRelativePath.split("/")[0]
          setFormData({ ...formData, workDir: path })
        }
      }
      input.click()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 解析参数：支持空格、换行分隔，并处理引号
    const parseArgs = (argsStr: string): string[] => {
      if (!argsStr.trim()) return []
      
      // 先按换行分割，再按空格分割
      const lines = argsStr.split(/\r?\n/).filter(line => line.trim())
      const args: string[] = []
      
      for (const line of lines) {
        // 使用正则表达式处理引号
        const matches = line.match(/(?:[^\s"]+|"[^"]*")+/g) || []
        args.push(...matches.map(arg => arg.replace(/^"|"$/g, '')))
      }
      
      return args
    }
    
    const submitData = {
      ...formData,
      type: serviceType,
      args: parseArgs(formData.args),
    }
    onSubmit?.(mode === "edit" ? { ...initialData, ...submitData } : submitData)
    setOpen(false)
  }

  const currentTemplate = serviceTemplates[serviceType]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "创建服务" : "编辑服务"}</DialogTitle>
            <DialogDescription>选择服务类型并配置服务参数</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="execution">执行配置</TabsTrigger>
              <TabsTrigger value="startup">启动选项</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="type">服务类型 *</Label>
                <Select value={serviceType} onValueChange={handleServiceTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择服务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceTemplates).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{template.icon}</span>
                          <span>{template.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{currentTemplate.description}</p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  选择服务类型后，系统会自动填充常见的配置路径和参数，你可以根据实际情况进行修改。
                </AlertDescription>
              </Alert>

              <div className="grid gap-2">
                <Label htmlFor="name">服务名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：Redis Server"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  placeholder="服务的描述信息"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="group">所属分组 *</Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) => setFormData({ ...formData, groupId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分组" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentTemplate.defaultPort && (
                <div className="grid gap-2">
                  <Label htmlFor="port">端口号</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder={currentTemplate.defaultPort.toString()}
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">默认端口: {currentTemplate.defaultPort}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="execution" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="path">可执行文件路径 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="path"
                    placeholder={currentTemplate.defaultPath || "选择可执行文件或脚本"}
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    required
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" onClick={handleSelectFile}>
                          <FileCode className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>选择文件</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  {serviceType === "batch" && "选择 .bat 批处理文件"}
                  {serviceType === "shell" && "选择 .sh Shell 脚本文件"}
                  {!["batch", "shell"].includes(serviceType) && "选择可执行程序 (.exe) 或脚本文件"}
                </p>
                <p className="text-xs text-muted-foreground">
                  在浏览器开发模式下，出于安全原因无法自动获取完整磁盘路径，选择文件后只会显示文件名，请手动填写绝对路径；
                  在打包后的应用或 Tauri 窗口中，选择文件后会显示完整路径。
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="args">启动参数</Label>
                <Textarea
                  id="args"
                  placeholder={currentTemplate.defaultArgs || "例如：--port 6379 --daemonize no"}
                  value={formData.args}
                  onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">命令行参数，多个参数用空格或换行分隔</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="workDir">工作目录</Label>
                <div className="flex gap-2">
                  <Input
                    id="workDir"
                    placeholder={currentTemplate.defaultWorkDir || "服务运行的工作目录"}
                    value={formData.workDir}
                    onChange={(e) => setFormData({ ...formData, workDir: e.target.value })}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" onClick={handleSelectFolder}>
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>选择文件夹</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">程序启动时的当前工作目录，留空则使用可执行文件所在目录</p>
              </div>

              {serviceType === "batch" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    批处理文件 (.bat) 将使用 cmd.exe 执行。确保文件路径正确，并具有执行权限。
                  </AlertDescription>
                </Alert>
              )}

              {serviceType === "shell" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Shell 脚本 (.sh) 将使用 bash 执行。确保脚本具有执行权限 (chmod +x)。
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="startup" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoStart">自动启动</Label>
                  <p className="text-xs text-muted-foreground">系统启动时自动运行此服务</p>
                </div>
                <Switch
                  id="autoStart"
                  checked={formData.autoStart}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoStart: checked })}
                />
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
                <p className="text-xs text-muted-foreground">
                  服务启动前的等待时间，用于控制启动顺序。例如：数据库应该在应用服务器之前启动。
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>提示：</strong> 如果服务有依赖关系，建议在"依赖管理"中配置服务分组的依赖顺序，
                  系统会自动按依赖顺序启动服务。
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">{mode === "create" ? "创建服务" : "保存修改"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
