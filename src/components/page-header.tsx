"use client"

import type { ReactNode } from "react"
import { GlobalSearch } from "@/components/global-search"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Keyboard } from "lucide-react"
import { useState } from "react"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  showGlobalActions?: boolean
}

export function PageHeader({ title, description, actions, showGlobalActions = false }: PageHeaderProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* 左侧标题区，占据主要宽度，防止被右侧按钮挤成竖排 */}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground break-words">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground break-words">
              {description}
            </p>
          )}
        </div>

        {/* 右侧搜索 + 操作区：在空间不足时整体换行到下一行 */}
        <div className="flex flex-wrap items-center justify-end gap-3 lg:flex-shrink-0">
          {showGlobalActions && (
            <>
              <GlobalSearch />
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)}>
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>键盘快捷键 (⌘?)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          )}
          <div className="flex flex-wrap items-center gap-2 justify-end">{actions}</div>
        </div>
      </div>

      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}
