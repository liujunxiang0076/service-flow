import type React from "react"
import { NotificationToast } from "@/components/notification-toast"
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <KeyboardShortcutsProvider>
            {children}
            <NotificationToast />
          </KeyboardShortcutsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
