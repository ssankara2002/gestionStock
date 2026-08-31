import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function NouveauFournisseurLoading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-[180px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
