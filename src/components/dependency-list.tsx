"use client"

import type { ServiceGroup } from "@/types/service"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface DependencyListProps {
  groups: ServiceGroup[]
}

export function DependencyList({ groups }: DependencyListProps) {
  const [openItems, setOpenItems] = useState<string[]>(groups.map((g) => g.id))

  const getGroupById = (id: string) => groups.find((g) => g.id === id)

  const getGroupStatus = (group: ServiceGroup): "running" | "stopped" | "mixed" => {
    const runningCount = group.services.filter((s) => s.status === "running").length
    if (runningCount === 0) return "stopped"
    if (runningCount === group.services.length) return "running"
    return "mixed"
  }

  const toggleItem = (id: string) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const getDependencyChain = (groupId: string, visited = new Set<string>()): string[] => {
    if (visited.has(groupId)) return ["循环依赖!"]

    visited.add(groupId)
    const group = getGroupById(groupId)
    if (!group || group.dependencies.length === 0) return []

    const chain: string[] = []
    group.dependencies.forEach((depId) => {
      const depGroup = getGroupById(depId)
      if (depGroup) {
        chain.push(depGroup.name)
        const subChain = getDependencyChain(depId, new Set(visited))
        if (subChain.length > 0) {
          chain.push(...subChain.map((s) => `  → ${s}`))
        }
      }
    })

    return chain
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = openItems.includes(group.id)
        const hasDependencies = group.dependencies.length > 0
        const dependents = groups.filter((g) => g.dependencies.includes(group.id))
        const groupStatus = getGroupStatus(group)

        return (
          <Card key={group.id} className="overflow-hidden">
            <Collapsible open={isOpen} onOpenChange={() => toggleItem(group.id)}>
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    />
                    <div>
                      <p className="font-semibold text-foreground">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{group.services.length} 个服务</p>
                    </div>
                    <Badge
                      variant={
                        groupStatus === "running" ? "default" : groupStatus === "stopped" ? "secondary" : "outline"
                      }
                    >
                      {groupStatus === "running" ? "全部运行" : groupStatus === "stopped" ? "全部停止" : "部分运行"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasDependencies && <Badge variant="secondary">{group.dependencies.length} 个依赖</Badge>}
                    {dependents.length > 0 && <Badge variant="outline">被 {dependents.length} 个分组依赖</Badge>}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t border-border p-4">
                  {hasDependencies ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">依赖的分组：</h4>
                      <div className="space-y-2">
                        {group.dependencies.map((depId) => {
                          const depGroup = getGroupById(depId)
                          if (!depGroup) return null
                          const depStatus = getGroupStatus(depGroup)

                          return (
                            <div
                              key={depId}
                              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                            >
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{depGroup.name}</p>
                                <p className="text-xs text-muted-foreground">{depGroup.services.length} 个服务</p>
                              </div>
                              <Badge
                                variant={
                                  depStatus === "running"
                                    ? "default"
                                    : depStatus === "stopped"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {depStatus === "running"
                                  ? "全部运行"
                                  : depStatus === "stopped"
                                    ? "全部停止"
                                    : "部分运行"}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">启动顺序：</p>
                        <div className="space-y-1 font-mono text-xs text-foreground">
                          {getDependencyChain(group.id).map((dep, i) => (
                            <div key={i}>{dep}</div>
                          ))}
                          <div>→ {group.name}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">此分组没有依赖项</p>
                  )}

                  {dependents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-foreground">被以下分组依赖：</h4>
                      <div className="flex flex-wrap gap-2">
                        {dependents.map((dep) => (
                          <Badge key={dep.id} variant="outline">
                            {dep.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">包含的服务：</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-2"
                        >
                          <span className="text-xs font-medium text-foreground">{service.name}</span>
                          <Badge variant={service.status === "running" ? "default" : "secondary"} className="text-xs">
                            {service.status === "running" ? "运行" : "停止"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}
    </div>
  )
}
