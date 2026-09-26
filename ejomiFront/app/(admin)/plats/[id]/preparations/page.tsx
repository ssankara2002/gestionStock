"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, PlayCircle, History, AlertTriangle, Info, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { recetteService } from "@/services/recette-service"
import { platService } from "@/services/plat-service"
import { usePermissions } from "@/hooks/usePermissions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

export default function PreparationsPlatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const platId = parseInt(id)
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissions()
  const canPreparer = hasPermission("plat.update")

  const [portions, setPortions] = useState("")
  const [note, setNote] = useState("")

  const { data: plat } = useQuery({
    queryKey: ["plat", platId],
    queryFn: async () => (await platService.getById(String(platId))).data.data,
  })

  const { data: capacite, refetch: refetchCapacite } = useQuery({
    queryKey: ["capacite", platId],
    queryFn: async () => ((await recetteService.getCapacite(platId)).data as any).data,
    refetchInterval: 30000,
  })

  const { data: historique = [], isLoading: loadingHistorique } = useQuery({
    queryKey: ["preparations", platId],
    queryFn: async () => ((await recetteService.getPreparations(platId)).data as any).data || [],
  })

  const { data: recette = [] } = useQuery({
    queryKey: ["recette", platId],
    queryFn: async () => ((await recetteService.getRecette(platId)).data as any).data || [],
  })

  const preparerMutation = useMutation({
    mutationFn: () =>
      recetteService.preparer(platId, { nombrePortions: parseInt(portions), note: note || undefined }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["capacite", platId] })
      queryClient.invalidateQueries({ queryKey: ["preparations", platId] })
      queryClient.invalidateQueries({ queryKey: ["capacite-tous-plats"] })
      const p = (res.data as any).data?.nombrePortions || portions
      toast({ title: "Préparation enregistrée", description: `${p} portion(s) — stock mis à jour automatiquement` })
      setPortions(""); setNote("")
      refetchCapacite()
    },
    onError: (e: any) => toast({
      title: "Stock insuffisant",
      description: e.response?.data?.message || e.message,
      variant: "destructive",
    }),
  })

  const recetteList = recette as any[]
  const historiqueList = historique as any[]
  const capaciteNum: number | null = capacite?.capacite ?? null
  const portionsMax = capaciteNum ?? 0
  const portionsVal = parseInt(portions)
  const canSubmit = canPreparer && portions && portionsVal > 0 && portionsVal <= portionsMax && !preparerMutation.isPending

  const recetteVide = recetteList.length === 0

  return (
    <div className="container py-8 space-y-6 max-w-3xl">

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PlayCircle className="h-6 w-6" />
            Préparations — {plat?.libelle || "..."}
          </h1>
          <p className="text-muted-foreground text-sm">Enregistrez les préparations du jour</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/plats/${id}/recette`}>
            ← Voir la recette
          </Link>
        </Button>
      </div>

      {/* Avertissement recette vide */}
      {recetteVide && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Recette non configurée</p>
            <p>Vous devez d'abord configurer les ingrédients de ce plat avant de pouvoir enregistrer une préparation.</p>
            <Link href={`/plats/${id}/recette`} className="underline font-medium mt-1 inline-block">
              Configurer la recette →
            </Link>
          </div>
        </div>
      )}

      {/* Formulaire de préparation */}
      {canPreparer && !recetteVide && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Enregistrer une préparation
            </CardTitle>
            <CardDescription>
              Le stock de chaque ingrédient sera décrémenté automatiquement selon la recette.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Capacité disponible */}
            <div className={`rounded-lg border p-4 ${capaciteNum === 0 ? "border-destructive bg-destructive/5" : capaciteNum !== null && capaciteNum < 5 ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capacité disponible maintenant</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${capaciteNum === 0 ? "text-destructive" : capaciteNum !== null && capaciteNum < 5 ? "text-yellow-600" : "text-green-600"}`}>
                  {capaciteNum ?? "—"}
                </span>
                {capaciteNum !== null && (
                  <span className="text-base text-muted-foreground">portion{capaciteNum !== 1 ? "s" : ""} faisable{capaciteNum !== 1 ? "s" : ""}</span>
                )}
              </div>
              {capaciteNum === 0 && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Stock épuisé — impossible de préparer
                </p>
              )}
              {capaciteNum !== null && capaciteNum > 0 && capaciteNum < 5 && (
                <p className="text-sm text-yellow-700 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Stock faible — pensez à réapprovisionner
                </p>
              )}

              {/* Détail par ingrédient */}
              {capacite?.ingredients?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {capacite.ingredients.map((ing: any) => (
                    <div key={ing.matierePremiereId} className="flex justify-between text-xs text-muted-foreground">
                      <span>{ing.nom}</span>
                      <span>
                        {ing.stockActuel} {ing.unite} → <strong className={ing.portionsPossibles === 0 ? "text-destructive" : ""}>{ing.portionsPossibles} portion{ing.portionsPossibles !== 1 ? "s" : ""}</strong>
                        {ing.portionsPossibles === capaciteNum && ing.portionsPossibles > 0 && (
                          <span className="text-orange-600 ml-1">(goulot)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saisie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de portions à préparer *</Label>
                <Input
                  type="number"
                  min={1}
                  max={portionsMax}
                  placeholder={`Maximum : ${portionsMax}`}
                  value={portions}
                  onChange={(e) => setPortions(e.target.value)}
                  disabled={portionsMax === 0}
                />
                {portions && portionsVal > portionsMax && (
                  <p className="text-xs text-destructive">Dépasse le stock disponible ({portionsMax} max)</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Note (optionnel)</Label>
                <Textarea
                  placeholder="Ex: Service du midi..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={1}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => preparerMutation.mutate()} disabled={!canSubmit} className="w-full sm:w-auto">
                <PlayCircle className="mr-2 h-4 w-4" />
                {preparerMutation.isPending ? "Enregistrement..." : "Confirmer la préparation"}
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                Stock décrémenté automatiquement
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des préparations
          </CardTitle>
          <CardDescription>{historiqueList.length} préparation{historiqueList.length !== 1 ? "s" : ""} enregistrée{historiqueList.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistorique ? (
            <div className="py-8 text-center text-muted-foreground">Chargement...</div>
          ) : historiqueList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Aucune préparation enregistrée pour ce plat.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Portions préparées</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historiqueList.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(h.datePreparation), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{h.nombrePortions} portion{h.nombrePortions !== 1 ? "s" : ""}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.note || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
