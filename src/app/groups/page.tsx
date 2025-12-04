
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ServiceGroupCard } from "@/components/service-group-card"
import { GroupDialog } from "@/components/create-group-dialog"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConfig } from "@/hooks/use-config"
import type { ServiceGroup } from "@/types/service"

export default function GroupsPage() {
  const { config, loading, createGroup, updateGroup, deleteGroup } = useConfig()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApp, setSelectedApp] = useState<string>("all")
  const [editingGroup, setEditingGroup] = useState<ServiceGroup | null>(null)

  const groups = config?.groups || []
  const applications = config?.applications || []

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesApp = selectedApp === "all" || group.applicationId === selectedApp
    return matchesSearch && matchesApp
  })

  const handleDelete = async (groupId: string) => {
    if (confirm("确定要删除这个服务分组吗？此操作无法撤销。")) {
      await deleteGroup(groupId)
    }
  }

  if (loading && !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <PageHeader
            title="分组管理"
            description="管理服务分组和批量操作"
            actions={
              <GroupDialog
                applications={applications}
                onSubmit={createGroup}
                trigger={
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          新建分组
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>创建新的服务分组</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                }
              />
            }
          />

          {editingGroup && (
            <GroupDialog
              applications={applications}
              mode="edit"
              initialData={editingGroup}
              open={!!editingGroup}
              onOpenChange={(open: any) => !open && setEditingGroup(null)}
              onSubmit={async (data: ServiceGroup) => {
                await updateGroup(data)
                setEditingGroup(null)
              }}
            />
          )}

          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索分组名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedApp} onValueChange={setSelectedApp}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="筛选应用" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有应用</SelectItem>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <ServiceGroupCard 
                  key={group.id} 
                  group={group} 
                  onEdit={() => setEditingGroup(group)}
                  onDelete={() => handleDelete(group.id)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">未找到匹配的分组</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
