"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChefHat, Calendar, Utensils, Edit, Trash2, Warehouse } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/usePermissions"
import apiClient from "@/services/api-client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function PreparationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissions()

  const { data: prep, isLoading } = useQuery({
    queryKey: ["preparation", id],
    queryFn: async () => {
      const res = await apiClient.get(`/plats/preparations/${id}`)
      return (res.data as any).data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/plats/preparations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preparations-historique"] })
      toast({ title: "Préparation supprimée", description: "Le stock des ingrédients a été restauré." })
      router.push("/magasinier/productions")
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.response?.data?.message || e.message, variant: "destructive" }),
  })

  const confirmerSupprimer = () => {
    if (confirm("Supprimer cette préparation ? Le stock des ingrédients sera restauré.")) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) return <div className="container py-8 text-center text-muted-foreground">Chargement...</div>
  if (!prep) return <div className="container py-8 text-center text-muted-foreground">Préparation introuvable.</div>

  const lignes = prep.lignes || []

  return (
    <div className="container py-8 space-y-6 max-w-3xl">

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Préparation #{prep.id}
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(prep.datePreparation), "dd MMMM yyyy à HH:mm", { locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission("plat.update") && (
            <Button variant="outline" asChild>
              <Link href={`/magasinier/productions/${id}/modifier`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </Button>
          )}
          {hasPermission("plat.update") && (
            <Button variant="destructive" onClick={confirmerSupprimer} disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          )}
        </div>
      </div>

      {/* Infos générales */}
      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Utensils className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground">Plat</p>
              <p className="font-semibold">{prep.plat?.libelle || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ChefHat className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground">Plats préparés</p>
              <Badge variant="secondary" className="text-base mt-0.5">{prep.nombrePortions} plat{prep.nombrePortions !== 1 ? "s" : ""}</Badge>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Warehouse className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground">Stock restant (plat)</p>
              {(prep.stockPlatRestant ?? prep.plat?.stockPlat ?? 0) > 0
                ? <Badge variant="outline" className="text-base mt-0.5 text-orange-700 border-orange-300">
                    {prep.stockPlatRestant ?? prep.plat?.stockPlat} portion{(prep.stockPlatRestant ?? prep.plat?.stockPlat) !== 1 ? "s" : ""} en stock
                  </Badge>
                : <Badge variant="outline" className="text-base mt-0.5 text-green-700 border-green-300">Tout vendu</Badge>
              }
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-semibold">{format(new Date(prep.datePreparation), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
            </div>
          </div>
          {prep.note && (
            <div className="sm:col-span-3">
              <p className="text-muted-foreground">Note</p>
              <p className="font-medium">{prep.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock restant de ce plat */}
      {(() => {
        const stock: number = prep.stockPlatRestant ?? prep.plat?.stockPlat ?? 0
        const totalPrepares: number = prep.totalPreparesToutTemps ?? 0
        const totalVendus: number = prep.totalVendusToutTemps ?? 0
        if (stock === 0) {
          return (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4 flex items-center gap-4">
                <Warehouse className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Stock de plats "{prep.plat?.libelle}"</p>
                  <p className="text-xl font-bold text-green-600">Tout vendu — 0 portion en stock</p>
                  {totalPrepares > 0 && <p className="text-xs text-muted-foreground mt-1">{totalPrepares} préparés · {totalVendus} vendus (tout temps)</p>}
                </div>
              </CardContent>
            </Card>
          )
        }
        return (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <Warehouse className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Stock de plats "{prep.plat?.libelle}" disponibles</p>
                <p className="text-xl font-bold text-orange-600">
                  {stock} portion{stock !== 1 ? "s" : ""} en stock (frigo ou service)
                </p>
                {totalPrepares > 0 && <p className="text-xs text-muted-foreground mt-1">{totalPrepares} préparés · {totalVendus} vendus (tout temps)</p>}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Ingrédients utilisés */}
      <Card>
        <CardHeader>
          <CardTitle>Ingrédients utilisés</CardTitle>
        </CardHeader>
        <CardContent>
          {lignes.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Aucun ingrédient enregistré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrédient</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Quantité utilisée</TableHead>
                  <TableHead className="text-right">Stock actuel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.matierePremiere?.nom || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.matierePremiere?.categorie || "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {l.quantiteUtilisee} <span className="text-xs text-muted-foreground">{l.matierePremiere?.unite}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {l.matierePremiere?.quantiteStock ?? "—"} <span className="text-xs">{l.matierePremiere?.unite}</span>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-medium">
                  <TableCell colSpan={2}>Total ingrédients</TableCell>
                  <TableCell colSpan={2} className="text-right">{lignes.length} type{lignes.length !== 1 ? "s" : ""}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
