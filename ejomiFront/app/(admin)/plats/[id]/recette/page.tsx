"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Trash2, ChefHat, AlertTriangle, Info, Edit2, Check, X, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { recetteService } from "@/services/recette-service"
import { platService } from "@/services/plat-service"
import apiClient from "@/services/api-client"
import { usePermissions } from "@/hooks/usePermissions"
import Link from "next/link"

const UNITES = ["g", "kg", "ml", "L", "pièce", "cuillère", "sachet", "bouteille"]

function RecetteLigne({ r, canEdit, onDelete, onUpdate }: {
  r: any
  canEdit: boolean
  onDelete: (matierePremiereId: number) => void
  onUpdate: (matierePremiereId: number, qte: number, unite: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [qte, setQte] = useState(String(r.quantiteParPortion))
  const [unite, setUnite] = useState(r.unite)

  const save = () => {
    const val = parseFloat(qte)
    if (val > 0) { onUpdate(r.matierePremiereId, val, unite); setEditing(false) }
  }
  const cancel = () => { setQte(String(r.quantiteParPortion)); setUnite(r.unite); setEditing(false) }

  const portionsPossibles = r.quantiteParPortion > 0
    ? Math.floor(r.matierePremiere.quantiteStock / r.quantiteParPortion)
    : 0

  return (
    <TableRow>
      <TableCell className="font-medium">{r.matierePremiere.nom}</TableCell>
      <TableCell>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input type="number" min="0.01" step="0.01" value={qte} onChange={(e) => setQte(e.target.value)} className="w-20 h-7 text-sm" />
            <select value={unite} onChange={(e) => setUnite(e.target.value)} className="h-7 rounded-md border border-input bg-background px-2 text-sm">
              {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        ) : (
          <span className="font-mono">{r.quantiteParPortion} <span className="text-muted-foreground text-xs">{r.unite}</span></span>
        )}
      </TableCell>
      <TableCell>
        <span className="font-mono">{r.matierePremiere.quantiteStock} <span className="text-muted-foreground text-xs">{r.matierePremiere.unite || r.unite}</span></span>
      </TableCell>
      <TableCell>
        <Badge variant={portionsPossibles === 0 ? "destructive" : portionsPossibles < 5 ? "outline" : "secondary"}>
          {portionsPossibles} portion{portionsPossibles !== 1 ? "s" : ""}
        </Badge>
      </TableCell>
      {canEdit && (
        <TableCell className="text-right">
          {editing ? (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={save}><Check className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancel}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}><Edit2 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(r.matierePremiereId)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}

export default function RecettePlatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const platId = parseInt(id)
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission("plat.update")

  const [openIngredient, setOpenIngredient] = useState(false)
  const [mpId, setMpId] = useState("")
  const [qte, setQte] = useState("")
  const [unite, setUnite] = useState("g")

  const { data: plat } = useQuery({
    queryKey: ["plat", platId],
    queryFn: async () => (await platService.getById(String(platId))).data.data,
  })

  const { data: recette = [], isLoading } = useQuery({
    queryKey: ["recette", platId],
    queryFn: async () => ((await recetteService.getRecette(platId)).data as any).data || [],
  })

  const { data: capacite } = useQuery({
    queryKey: ["capacite", platId],
    queryFn: async () => ((await recetteService.getCapacite(platId)).data as any).data,
    refetchInterval: 30000,
  })

  const { data: matieres = [] } = useQuery({
    queryKey: ["matieres-premieres"],
    queryFn: async () => {
      const p = (await apiClient.get("/matieres-premieres")).data as any
      return p?.data?.data || p?.data || []
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["recette", platId] })
    queryClient.invalidateQueries({ queryKey: ["capacite", platId] })
    queryClient.invalidateQueries({ queryKey: ["capacite-tous-plats"] })
  }

  const addMutation = useMutation({
    mutationFn: () => recetteService.upsertIngredient(platId, { matierePremiereId: parseInt(mpId), quantiteParPortion: parseFloat(qte), unite }),
    onSuccess: () => {
      invalidate()
      toast({ title: "Ingrédient ajouté" })
      setOpenIngredient(false); setMpId(""); setQte(""); setUnite("g")
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.response?.data?.message || "Erreur", variant: "destructive" }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ matierePremiereId, quantiteParPortion, unite }: any) =>
      recetteService.upsertIngredient(platId, { matierePremiereId, quantiteParPortion, unite }),
    onSuccess: () => { invalidate(); toast({ title: "Quantité mise à jour" }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (matierePremiereId: number) => recetteService.deleteIngredient(platId, matierePremiereId),
    onSuccess: () => { invalidate(); toast({ title: "Ingrédient retiré" }) },
  })

  const recetteList = recette as any[]
  const matieresList = matieres as any[]
  const mpOptions = matieresList.filter((m: any) => !recetteList.some((r: any) => r.matierePremiereId === m.id))
  const capaciteNum: number | null = capacite?.capacite ?? null

  const capaciteColor =
    capaciteNum === null ? "" :
    capaciteNum === 0 ? "border-destructive bg-destructive/5" :
    capaciteNum < 5 ? "border-yellow-400 bg-yellow-50/50" :
    "border-green-400 bg-green-50/50"

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Recette — {plat?.libelle || "..."}
          </h1>
          <p className="text-muted-foreground text-sm">Configuration des ingrédients par portion</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/plats/${id}/preparations`}>
            Voir les préparations →
          </Link>
        </Button>
      </div>

      {/* Capacité calculée */}
      <Card className={capaciteColor}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Capacité de production — stock actuel
          </CardTitle>
          <CardDescription>Calculée automatiquement depuis le stock des ingrédients</CardDescription>
        </CardHeader>
        <CardContent>
          {capaciteNum === null ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Ajoutez des ingrédients pour calculer la capacité.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${capaciteNum === 0 ? "text-destructive" : capaciteNum < 5 ? "text-yellow-600" : "text-green-600"}`}>
                  {capaciteNum}
                </span>
                <span className="text-lg text-muted-foreground">portion{capaciteNum !== 1 ? "s" : ""} faisable{capaciteNum !== 1 ? "s" : ""}</span>
                {capaciteNum === 0 && <span className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Stock épuisé</span>}
                {capaciteNum > 0 && capaciteNum < 5 && <span className="text-sm text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Stock faible</span>}
                {capaciteNum >= 5 && <span className="text-sm text-green-600">✓ Stock suffisant</span>}
              </div>

              {capacite?.ingredients?.length > 0 && (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ingrédient</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Stock dispo</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qté / portion</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Portions possibles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacite.ingredients.map((ing: any) => (
                        <tr key={ing.matierePremiereId} className="border-t">
                          <td className="px-3 py-2">{ing.nom}</td>
                          <td className="px-3 py-2 text-right font-mono">{ing.stockActuel} <span className="text-muted-foreground text-xs">{ing.unite}</span></td>
                          <td className="px-3 py-2 text-right font-mono">{ing.quantiteParPortion} <span className="text-muted-foreground text-xs">{ing.unite}</span></td>
                          <td className="px-3 py-2 text-right">
                            <span className={`font-bold ${ing.portionsPossibles === 0 ? "text-destructive" : ing.portionsPossibles === capaciteNum ? "text-orange-600" : ""}`}>
                              {ing.portionsPossibles}
                            </span>
                            {ing.portionsPossibles === capaciteNum && ing.portionsPossibles > 0 && (
                              <span className="ml-1 text-xs text-orange-600">(goulot)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration ingrédients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ingrédients pour 1 portion</CardTitle>
              <CardDescription>{recetteList.length} ingrédient{recetteList.length !== 1 ? "s" : ""} configuré{recetteList.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            {canEdit && (
              <Dialog open={openIngredient} onOpenChange={setOpenIngredient}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Ajouter un ingrédient à la recette</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Ingrédient *</Label>
                      <select value={mpId} onChange={(e) => setMpId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Choisir un ingrédient...</option>
                        {mpOptions.map((m: any) => (
                          <option key={m.id} value={String(m.id)}>{m.nom}{m.categorie ? ` (${m.categorie})` : ""}</option>
                        ))}
                      </select>
                      {mpOptions.length === 0 && <p className="text-xs text-muted-foreground">Tous les ingrédients sont déjà dans la recette.</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Quantité par portion *</Label>
                        <Input type="number" min="0.01" step="0.01" placeholder="ex: 200" value={qte} onChange={(e) => setQte(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Unité *</Label>
                        <select value={unite} onChange={(e) => setUnite(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                          {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenIngredient(false)}>Annuler</Button>
                    <Button disabled={!mpId || !qte || parseFloat(qte) <= 0 || addMutation.isPending} onClick={() => addMutation.mutate()}>
                      {addMutation.isPending ? "Ajout..." : "Ajouter"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement...</div>
          ) : recetteList.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground space-y-2">
              <ChefHat className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">Aucun ingrédient configuré.</p>
              {canEdit && <p className="text-xs">Cliquez sur "Ajouter" pour commencer.</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrédient</TableHead>
                  <TableHead>Qté par portion</TableHead>
                  <TableHead>Stock actuel</TableHead>
                  <TableHead>Portions possibles</TableHead>
                  {canEdit && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recetteList.map((r: any) => (
                  <RecetteLigne
                    key={r.id}
                    r={r}
                    canEdit={canEdit}
                    onDelete={(mid) => deleteMutation.mutate(mid)}
                    onUpdate={(mid, q, u) => updateMutation.mutate({ matierePremiereId: mid, quantiteParPortion: q, unite: u })}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
