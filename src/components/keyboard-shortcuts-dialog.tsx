"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    {
      category: "全局",
      items: [
        { keys: ["⌘", "K"], description: "打开全局搜索" },
        { keys: ["⌘", "B"], description: "切换侧边栏" },
        { keys: ["⌘", "?"], description: "显示快捷键帮助" },
        { keys: ["⌘", "T"], description: "切换主题" },
      ],
    },
    {
      category: "导航",
      items: [
        { keys: ["G", "H"], description: "跳转到仪表盘" },
        { keys: ["G", "A"], description: "跳转到应用管理" },
        { keys: ["G", "G"], description: "跳转到分组管理" },
        { keys: ["G", "S"], description: "跳转到服务管理" },
        { keys: ["G", "D"], description: "跳转到依赖关系" },
        { keys: ["G", "L"], description: "跳转到日志管理" },
      ],
    },
    {
      category: "操作",
      items: [
        { keys: ["N"], description: "新建项目（当前页面）" },
        { keys: ["R"], description: "刷新当前页面" },
        { keys: ["Esc"], description: "关闭弹窗/取消操作" },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>键盘快捷键</DialogTitle>
          <DialogDescription>使用这些快捷键提高工作效率</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <Kbd key={keyIdx}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
