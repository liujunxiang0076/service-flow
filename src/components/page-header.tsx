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
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-4">
          <GlobalSearch />
          <div className="flex items-center gap-2">
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
            {actions}
          </div>
        </div>
      </div>

      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}
