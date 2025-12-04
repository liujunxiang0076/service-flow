import type React from "react"
import { NotificationToast } from "@/components/notification-toast"
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider"
import "./globals.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`font-sans antialiased`}>
        <KeyboardShortcutsProvider>
          {children}
          <NotificationToast />
        </KeyboardShortcutsProvider>
      </body>
    </html>
  )
}
