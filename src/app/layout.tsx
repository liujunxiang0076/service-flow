import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { NotificationToast } from "@/components/notification-toast"
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ServiceFlow - 服务管理工具",
  description: "轻量级、开箱即用、稳定可靠的服务管理和编排工具",
  generator: "v0.app",
}

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
