
import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Server } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would make an API call
    navigate("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <Server className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">ServiceFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">服务管理工具</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            登录
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>默认用户名：admin</p>
          <p>默认密码：admin</p>
        </div>
      </Card>
    </div>
  )
}
