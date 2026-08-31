import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ClientDetailLoading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-[180px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[250px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-[150px] mb-2" />
                  <Skeleton className="h-6 w-[200px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              ))}
              <Skeleton className="h-[1px] w-full my-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-6 w-[100px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[250px]" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-4">
            <div className="flex items-center space-x-4 py-2">
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[100px]" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
