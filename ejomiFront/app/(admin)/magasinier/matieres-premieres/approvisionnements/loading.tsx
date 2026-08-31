import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApprovisionnementLoading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <div className="p-4">
              <div className="grid grid-cols-7 gap-4 py-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4 py-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
