"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, AlertTriangle, CheckCircle, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { recetteService } from "@/services/recette-service"

const baseUrl = () =>
  process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost"

export default function CapacitePlatsPage() {
  const { data: plats = [], isLoading } = useQuery({
    queryKey: ["capacite-tous-plats"],
    queryFn: async () => {
      const res = await recetteService.getCapaciteTousPlats()
      return (res.data as any).data || []
    },
    refetchInterval: 60000,
  })

  const avecRecette = (plats as any[]).filter((p: any) => p.capacite !== null)
  const sansRecette = (plats as any[]).filter((p: any) => p.capacite === null)
  const enRupture = avecRecette.filter((p: any) => p.capacite === 0)
  const faible = avecRecette.filter((p: any) => p.capacite > 0 && p.capacite < 5)
  const ok = avecRecette.filter((p: any) => p.capacite >= 5)

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          Capacité de production
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estimation du nombre de portions réalisables selon le stock de ingrédients
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total plats</p>
            <p className="text-2xl font-bold">{(plats as any[]).length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Stock suffisant</p>
            <p className="text-2xl font-bold text-green-600">{ok.length}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Stock faible (&lt;5)</p>
            <p className="text-2xl font-bold text-yellow-600">{faible.length}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">En rupture</p>
            <p className="text-2xl font-bold text-destructive">{enRupture.length}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(plats as any[]).map((plat: any) => {
            const cap: number | null = plat.capacite
            const imgSrc = plat.image
              ? `${baseUrl()}/uploads/${plat.image}`
              : "/placeholder.svg?height=80&width=80"

            let borderClass = ""
            let icon = <CheckCircle className="h-5 w-5 text-green-500" />
            let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "default"

            if (cap === null) {
              borderClass = "border-dashed"
              icon = <Settings className="h-5 w-5 text-muted-foreground" />
              badgeVariant = "secondary"
            } else if (cap === 0) {
              borderClass = "border-destructive"
              icon = <AlertTriangle className="h-5 w-5 text-destructive" />
              badgeVariant = "destructive"
            } else if (cap < 5) {
              borderClass = "border-yellow-400"
              icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />
              badgeVariant = "outline"
            }

            return (
              <Card key={plat.platId} className={borderClass}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden border">
                      <Image src={imgSrc} alt={plat.libelle} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {icon}
                        <p className="font-medium truncate">{plat.libelle}</p>
                      </div>
                      {cap === null ? (
                        <p className="text-xs text-muted-foreground mt-1">Recette non configurée</p>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={badgeVariant}>
                            {cap} portion{cap !== 1 ? "s" : ""}
                          </Badge>
                          {cap === 0 && <span className="text-xs text-destructive">Rupture de stock</span>}
                          {cap > 0 && cap < 5 && <span className="text-xs text-yellow-600">Stock faible</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/plats/${plat.platId}/recette`}>
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        {cap === null ? "Configurer recette" : "Voir recette"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {sansRecette.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {sansRecette.length} plat(s) sans recette configurée — cliquez sur "Configurer recette" pour les paramétrer.
        </p>
      )}
    </div>
  )
}
