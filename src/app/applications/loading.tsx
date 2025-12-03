import { AppSidebar } from "@/components/app-sidebar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ApplicationsLoading() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <div className="mb-8">
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="mb-4 h-12 w-12 rounded-lg" />
                <Skeleton className="mb-2 h-6 w-32" />
                <Skeleton className="mb-4 h-4 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
