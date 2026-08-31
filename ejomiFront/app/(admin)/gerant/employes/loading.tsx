import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EmployesLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-10 w-full sm:w-96" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-[100px]" />
                  <Skeleton className="h-9 w-[100px]" />
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <div className="p-4">
                  <div className="flex items-center space-x-4 py-4">
                    <Skeleton className="h-6 w-[150px]" />
                    <Skeleton className="h-6 w-[200px]" />
                    <Skeleton className="h-6 w-[150px]" />
                    <Skeleton className="h-6 w-[100px]" />
                    <Skeleton className="h-6 w-[120px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-6 w-[80px]" />
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 py-4">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-4 w-[80px]" />
                    </div>
                  ))}
                </div>
              </div>

              <Skeleton className="mt-4 h-4 w-[200px]" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
