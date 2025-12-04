import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Trash2, Play, Pause, RefreshCw, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockGroups, defaultLogConfig } from "@/lib/mock-data"
import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const mockLogs = [
  { time: "2024-01-15 14:32:01", level: "INFO", service: "Redis", message: "Server started on port 6379" },
  { time: "2024-01-15 14:32:05", level: "INFO", service: "MySQL", message: "Database connection established" },
  { time: "2024-01-15 14:32:10", level: "INFO", service: "后端 API", message: "Express server listening on port 3000" },
  { time: "2024-01-15 14:32:15", level: "WARN", service: "后端 API", message: "Connection pool reaching 80% capacity" },
  {
    time: "2024-01-15 14:32:20",
    level: "ERROR",
    service: "Prometheus",
    message: "Failed to scrape metrics from target",
  },
  { time: "2024-01-15 14:32:25", level: "INFO", service: "Redis", message: "Background saving started" },
  { time: "2024-01-15 14:32:30", level: "INFO", service: "后端 API", message: "GET /api/users 200 45ms" },
  { time: "2024-01-15 14:32:35", level: "DEBUG", service: "后端 API", message: "Query executed: SELECT * FROM users" },
]

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [autoScroll, setAutoScroll] = useState(true)
  const [logConfig, setLogConfig] = useState(defaultLogConfig)
  const [configOpen, setConfigOpen] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const allServices = mockGroups.flatMap((g) => g.services)

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesService = selectedService === "all" || log.service === selectedService
    const matchesLevel = selectedLevel === "all" || log.level === selectedLevel
    return matchesSearch && matchesService && matchesLevel
  })

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const handleRefresh = () => {
    console.log("[v0] Refreshing logs...")
    // In real implementation, this would fetch new logs
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="container mx-auto flex h-full flex-col p-8">
            <div className="shrink-0">
            <PageHeader
              title="日志管理"
              description="实时查看和搜索服务日志"
              actions={
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          刷新
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>刷新日志</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="mr-2 h-4 w-4" />
                              配置
                            </Button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>日志配置</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>日志配置</DialogTitle>
                        <DialogDescription>配置日志获取模式和其他选项</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>日志获取模式</Label>
                          <RadioGroup
                            value={logConfig.mode}
                            onValueChange={(value: any) => setLogConfig({ ...logConfig, mode: value })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="realtime" id="realtime" />
                              <Label htmlFor="realtime" className="cursor-pointer font-normal">
                                实时获取 - 自动推送最新日志
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="periodic" id="periodic" />
                              <Label htmlFor="periodic" className="cursor-pointer font-normal">
                                定期获取 - 按固定间隔刷新日志
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="manual" id="manual" />
                              <Label htmlFor="manual" className="cursor-pointer font-normal">
                                手动获取 - 仅在点击刷新时更新
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {logConfig.mode === "periodic" && (
                          <div className="space-y-2">
                            <Label htmlFor="interval">刷新间隔（秒）</Label>
                            <Input
                              id="interval"
                              type="number"
                              min="1"
                              value={logConfig.interval || 5}
                              onChange={(e) => setLogConfig({ ...logConfig, interval: Number.parseInt(e.target.value) })}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="maxLines">最大日志行数</Label>
                          <Input
                            id="maxLines"
                            type="number"
                            min="100"
                            step="100"
                            value={logConfig.maxLines}
                            onChange={(e) => setLogConfig({ ...logConfig, maxLines: Number.parseInt(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="retention">日志保留天数</Label>
                          <Input
                            id="retention"
                            type="number"
                            min="1"
                            value={logConfig.retention}
                            onChange={(e) => setLogConfig({ ...logConfig, retention: Number.parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfigOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={() => setConfigOpen(false)}>保存配置</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          导出
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>导出日志文件</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          清空
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>清空所有日志</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              }
            />

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="relative min-w-[250px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索日志内容..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="所有服务" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有服务</SelectItem>
                  {allServices.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="日志级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有级别</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={autoScroll ? "default" : "outline"}
                      size="icon"
                      onClick={() => setAutoScroll(!autoScroll)}
                    >
                      {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{autoScroll ? "停止自动滚动" : "启用自动滚动"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            </div>

            {/* Logs Container */}
            <div className="flex-1 overflow-hidden">
            <Card className="flex h-full flex-col overflow-hidden">
              <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                {filteredLogs.map((log, index) => (
                  <div key={index} className="mb-1 flex gap-3 rounded px-2 py-1 hover:bg-muted/50">
                    <span className="shrink-0 text-muted-foreground">{log.time}</span>
                    <Badge
                      variant={
                        log.level === "ERROR"
                          ? "destructive"
                          : log.level === "WARN"
                            ? "default"
                            : log.level === "DEBUG"
                              ? "secondary"
                              : "outline"
                      }
                      className="shrink-0"
                    >
                      {log.level}
                    </Badge>
                    <span className="shrink-0 text-primary">[{log.service}]</span>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                显示 {filteredLogs.length} 条日志
                {autoScroll && <span className="ml-4">• 自动滚动已启用</span>}
                <span className="ml-4">
                  • 模式: {
                    logConfig.mode === "realtime" ? "实时获取" : logConfig.mode === "periodic" ? "定期获取" : "手动获取"
                  }
                </span>
              </div>
            </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
