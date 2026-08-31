import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <Skeleton className="h-4 w-96 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:w-96" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <div className="p-1">
              <div className="flex p-4 border-b">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 flex-1 mx-2" />
                ))}
              </div>

              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex p-4 border-b">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 flex-1 mx-2" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <Skeleton className="h-4 w-40 mt-4" />
        </CardContent>
      </Card>
    </div>
  )
}
