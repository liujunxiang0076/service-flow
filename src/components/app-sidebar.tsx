
import {
  LayoutDashboard,
  Server,
  Network,
  Activity,
  FileText,
  Settings,
  Layers,
  FolderTree,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
  { name: "仪表盘", href: "/", icon: LayoutDashboard },
  { name: "应用管理", href: "/applications", icon: Layers },
  { name: "分组管理", href: "/groups", icon: FolderTree },
  { name: "服务管理", href: "/services", icon: Server },
  { name: "依赖关系", href: "/dependencies", icon: Network },
  { name: "健康检查", href: "/health", icon: Activity },
  { name: "日志管理", href: "/logs", icon: FileText },
  { name: "配置管理", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // Sync state with actual DOM on mount
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    if (html.classList.contains("dark")) {
      html.classList.remove("dark")
      setIsDark(false)
    } else {
      html.classList.add("dark")
      setIsDark(true)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header / Logo */}
        <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <div className="flex items-center overflow-hidden">
              <Server className="h-6 w-6 shrink-0 text-primary" />
              <span className="ml-2 text-lg font-semibold text-sidebar-foreground truncate">ServiceFlow</span>
            </div>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCollapsed(!collapsed)}
                className="text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground h-8 w-8"
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "展开侧栏" : "收起侧栏"}</TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              )
            }
            return linkContent
          })}
        </nav>

        {/* Footer Actions */}
        <div className={cn("border-t border-sidebar-border p-3", collapsed && "flex flex-col items-center")}>
          <div className={cn("flex gap-2", collapsed ? "flex-col" : "")}>
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className={cn(
                    "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    collapsed ? "w-full justify-center" : "w-full justify-start px-2",
                  )}
                >
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {!collapsed && <span className="ml-2">切换主题</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{isDark ? "切换亮色主题" : "切换深色主题"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
