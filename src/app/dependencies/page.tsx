
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { DependencyGraph } from "@/components/dependency-graph"
import { DependencyList } from "@/components/dependency-list"
import { mockGroups } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DependencyManager } from "@/components/dependency-manager"

export default function DependenciesPage() {
  const hasCircularDeps = false // This would be calculated by a utility function

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <PageHeader title="依赖关系" description="可视化查看和管理服务分组间的依赖关系" />

          {hasCircularDeps && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>检测到循环依赖</AlertTitle>
              <AlertDescription>分组间存在循环依赖，这可能导致启动失败。请检查并修复依赖关系。</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="graph" className="space-y-4">
            <TabsList>
              <TabsTrigger value="graph">依赖图</TabsTrigger>
              <TabsTrigger value="list">依赖列表</TabsTrigger>
              <TabsTrigger value="manage">依赖管理</TabsTrigger>
            </TabsList>

            <TabsContent value="graph">
              <Card className="p-6">
                <DependencyGraph groups={mockGroups} />
              </Card>
            </TabsContent>

            <TabsContent value="list">
              <DependencyList groups={mockGroups} />
            </TabsContent>

            <TabsContent value="manage">
              <DependencyManager groups={mockGroups} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
