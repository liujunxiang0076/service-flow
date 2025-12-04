"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, Save } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { ExportConfigDialog } from "@/components/export-config-dialog"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  const [config, setConfig] = useState({
    webPort: 8899,
    webEnabled: true,
    authEnabled: true,
    username: "admin",
    sessionTimeout: 3600,
    ipWhitelist: "",
    autoBackup: true,
    backupInterval: 24,
    logLevel: "INFO",
    logRetention: 30,
  })

  const [showExportDialog, setShowExportDialog] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <PageHeader title="配置管理" description="管理系统配置和安全设置" />

          <Tabs defaultValue="web" className="space-y-6">
            <TabsList>
              <TabsTrigger value="web">Web 服务</TabsTrigger>
              <TabsTrigger value="auth">认证安全</TabsTrigger>
              <TabsTrigger value="system">系统设置</TabsTrigger>
              <TabsTrigger value="backup">备份管理</TabsTrigger>
            </TabsList>

            <TabsContent value="web">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-foreground">Web 服务配置</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="webEnabled">启用 Web 服务</Label>
                          <p className="text-sm text-muted-foreground">允许通过浏览器访问管理界面</p>
                        </div>
                        <Switch
                          id="webEnabled"
                          checked={config.webEnabled}
                          onCheckedChange={(checked: boolean) =>
                            setConfig({ ...config, webEnabled: checked })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="port">Web 服务端口</Label>
                        <Input
                          id="port"
                          type="number"
                          value={config.webPort}
                          onChange={(e) => setConfig({ ...config, webPort: Number.parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">修改后需要重启 Web 服务才能生效</p>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/50 p-4">
                        <p className="text-sm font-medium text-foreground">访问地址</p>
                        <p className="mt-2 font-mono text-sm text-primary">http://localhost:{config.webPort}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">重置</Button>
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      保存配置
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="auth">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-foreground">认证与安全</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="authEnabled">启用登录认证</Label>
                          <p className="text-sm text-muted-foreground">要求用户输入用户名和密码才能访问</p>
                        </div>
                        <Switch
                          id="authEnabled"
                          checked={config.authEnabled}
                          onCheckedChange={(checked: boolean) =>
                            setConfig({ ...config, authEnabled: checked })
                          }
                        />
                      </div>

                      {config.authEnabled && (
                        <>
                          <div className="grid gap-2">
                            <Label htmlFor="username">用户名</Label>
                            <Input
                              id="username"
                              value={config.username}
                              onChange={(e) => setConfig({ ...config, username: e.target.value })}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="password">新密码</Label>
                            <Input id="password" type="password" placeholder="留空表示不修改密码" />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">确认密码</Label>
                            <Input id="confirmPassword" type="password" placeholder="再次输入新密码" />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="sessionTimeout">会话超时（秒）</Label>
                            <Input
                              id="sessionTimeout"
                              type="number"
                              value={config.sessionTimeout}
                              onChange={(e) =>
                                setConfig({ ...config, sessionTimeout: Number.parseInt(e.target.value) })
                              }
                            />
                            <p className="text-xs text-muted-foreground">超过指定时间无操作将自动退出登录</p>
                          </div>
                        </>
                      )}

                      <div className="grid gap-2">
                        <Label htmlFor="ipWhitelist">IP 白名单</Label>
                        <Textarea
                          id="ipWhitelist"
                          placeholder="192.168.1.100&#10;192.168.1.0/24&#10;留空表示允许所有 IP"
                          value={config.ipWhitelist}
                          onChange={(e) => setConfig({ ...config, ipWhitelist: e.target.value })}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">每行一个 IP 地址或 CIDR 范围</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">重置</Button>
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      保存配置
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="system">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-foreground">系统设置</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="theme-mode">深色模式</Label>
                          <p className="text-sm text-muted-foreground">开启深色外观模式</p>
                        </div>
                        {mounted ? (
                          <Switch
                            id="theme-mode"
                            checked={resolvedTheme === "dark"}
                            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                          />
                        ) : (
                          <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="logLevel">日志级别</Label>
                        <select
                          id="logLevel"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={config.logLevel}
                          onChange={(e) => setConfig({ ...config, logLevel: e.target.value })}
                        >
                          <option value="DEBUG">DEBUG</option>
                          <option value="INFO">INFO</option>
                          <option value="WARN">WARN</option>
                          <option value="ERROR">ERROR</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="logRetention">日志保留天数</Label>
                        <Input
                          id="logRetention"
                          type="number"
                          value={config.logRetention}
                          onChange={(e) => setConfig({ ...config, logRetention: Number.parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">超过指定天数的日志将自动清理</p>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">系统信息</p>
                          <Badge variant="outline">v1.0.0</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">配置文件</span>
                            <span className="font-mono text-foreground">/etc/serviceflow/config.json</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">日志目录</span>
                            <span className="font-mono text-foreground">/var/log/serviceflow/</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">运行时间</span>
                            <span className="text-foreground">3 天 12 小时</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">重置</Button>
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      保存配置
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="backup">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-foreground">配置备份</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoBackup">自动备份</Label>
                          <p className="text-sm text-muted-foreground">定期自动备份配置文件</p>
                        </div>
                        <Switch
                          id="autoBackup"
                          checked={config.autoBackup}
                          onCheckedChange={(checked: boolean) =>
                            setConfig({ ...config, autoBackup: checked })
                          }
                        />
                      </div>

                      {config.autoBackup && (
                        <div className="grid gap-2">
                          <Label htmlFor="backupInterval">备份间隔（小时）</Label>
                          <Input
                            id="backupInterval"
                            type="number"
                            value={config.backupInterval}
                            onChange={(e) => setConfig({ ...config, backupInterval: Number.parseInt(e.target.value) })}
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground">配置导入/导出</h4>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Upload className="mr-2 h-4 w-4" />
                              导入配置
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                              <Download className="mr-2 h-4 w-4" />
                              导出配置
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-lg border border-border p-4">
                          <p className="mb-3 text-sm font-medium text-foreground">备份历史</p>
                          <div className="space-y-2">
                            {[
                              { date: "2024-01-15 14:00:00", size: "2.4 KB", auto: true },
                              { date: "2024-01-14 14:00:00", size: "2.3 KB", auto: true },
                              { date: "2024-01-13 10:30:00", size: "2.2 KB", auto: false },
                            ].map((backup, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{backup.date}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {backup.size} • {backup.auto ? "自动备份" : "手动备份"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm">
                                    恢复
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">重置</Button>
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      保存配置
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <ExportConfigDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
        </div>
      </main>
    </div>
  )
}
