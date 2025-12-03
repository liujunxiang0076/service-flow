import { AppSidebar } from "@/components/app-sidebar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function GroupsLoading() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <div className="mb-8">
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
