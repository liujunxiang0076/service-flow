"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { mockApplications, mockGroups } from "@/lib/mock-data"
import { Search, Server, Layers, FolderTree, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface SearchResult {
  type: "application" | "group" | "service"
  id: string
  name: string
  description?: string
  status?: string
  parentName?: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchResults: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    // Search applications
    mockApplications.forEach((app) => {
      if (app.name.toLowerCase().includes(lowerQuery) || app.description?.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: "application",
          id: app.id,
          name: app.name,
          description: app.description,
          status: app.status,
        })
      }
    })

    // Search groups
    mockGroups.forEach((group) => {
      if (group.name.toLowerCase().includes(lowerQuery) || group.description?.toLowerCase().includes(lowerQuery)) {
        const parentApp = mockApplications.find((app) => app.groupIds.includes(group.id))
        searchResults.push({
          type: "group",
          id: group.id,
          name: group.name,
          description: group.description,
          parentName: parentApp?.name,
        })
      }

      // Search services
      group.services.forEach((service) => {
        if (
          service.name.toLowerCase().includes(lowerQuery) ||
          service.description?.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            type: "service",
            id: service.id,
            name: service.name,
            description: service.description,
            status: service.status,
            parentName: group.name,
          })
        }
      })
    })

    setResults(searchResults.slice(0, 10))
    setSelectedIndex(0)
  }, [query])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false)
      setQuery("")
      switch (result.type) {
        case "application":
          navigate("/applications")
          break
        case "group":
          navigate("/groups")
          break
        case "service":
          navigate("/services")
          break
      }
    },
    [navigate],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((i) => (i > 0 ? i - 1 : i))
          break
        case "Enter":
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, results, selectedIndex, handleSelect])

  const getIcon = (type: string) => {
    switch (type) {
      case "application":
        return <Layers className="h-4 w-4 text-primary" />
      case "group":
        return <FolderTree className="h-4 w-4 text-accent" />
      case "service":
        return <Server className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "application":
        return "应用"
      case "group":
        return "分组"
      case "service":
        return "服务"
      default:
        return ""
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-64 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">搜索应用、分组、服务...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-xl">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索应用、分组、服务..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    index === selectedIndex ? "bg-accent" : "hover:bg-muted",
                  )}
                >
                  {getIcon(result.type)}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{result.name}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.parentName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{result.parentName}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{result.name}</span>
                      </div>
                    )}
                  </div>
                  {result.status && (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        result.status === "running" && "bg-success",
                        result.status === "stopped" && "bg-muted-foreground",
                        result.status === "error" && "bg-destructive",
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-sm text-muted-foreground">未找到匹配的结果</div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">输入关键词开始搜索</div>
          )}

          <div className="flex items-center justify-between border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-background px-1.5 py-0.5">↑</kbd>
              <kbd className="rounded border bg-background px-1.5 py-0.5">↓</kbd>
              <span>导航</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-background px-1.5 py-0.5">Enter</kbd>
              <span>选择</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-background px-1.5 py-0.5">Esc</kbd>
              <span>关闭</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
