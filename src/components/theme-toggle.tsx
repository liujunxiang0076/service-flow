"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
            )}
            <span className="sr-only">切换主题</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
