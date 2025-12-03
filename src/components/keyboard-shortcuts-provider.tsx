"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + ? - Show shortcuts
      if (modKey && e.shiftKey && e.key === "?") {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }

      // Cmd/Ctrl + B - Toggle sidebar (handled by sidebar component)
      // Cmd/Ctrl + K - Global search (handled by GlobalSearch component)
      // Cmd/Ctrl + T - Theme toggle (handled by ThemeToggle component)

      // Navigation shortcuts (G + key)
      if (e.key === "g" && !modKey) {
        // Wait for second key
        const handleSecondKey = (e2: KeyboardEvent) => {
          e2.preventDefault()
          window.removeEventListener("keydown", handleSecondKey)

          switch (e2.key) {
            case "h":
              navigate("/")
              break
            case "a":
              navigate("/applications")
              break
            case "g":
              navigate("/groups")
              break
            case "s":
              navigate("/services")
              break
            case "d":
              navigate("/dependencies")
              break
            case "l":
              navigate("/logs")
              break
            case "c":
              navigate("/health")
              break
            case "t":
              navigate("/settings")
              break
          }
        }

        window.addEventListener("keydown", handleSecondKey, { once: true })
        setTimeout(() => {
          window.removeEventListener("keydown", handleSecondKey)
        }, 1000)
      }

      // R - Refresh (trigger a soft refresh)
      if (e.key === "r" && !modKey && !e.shiftKey) {
        e.preventDefault()
        // router.refresh() not supported in SPA the same way
        // navigate(0)
        window.location.reload()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate, pathname])

  return (
    <>
      {children}
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}
