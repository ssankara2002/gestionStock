import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NouvelApprovisionnementLoading() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-24" />
            </CardTitle>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 mb-4 items-end">
                <div className="col-span-5">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10" />
                  </div>
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            ))}

            <Skeleton className="h-10 w-40 mt-2" />

            <div className="mt-6 flex justify-between items-center">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
