"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Search, Save, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/services/api-client"

interface LignePrepLocal {
  id: string
  matierePremiereId: number
  nom: string
  unite: string
  quantiteUtilisee: number
  stockDisponible: number
}

export default function ModifierPreparationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [platLibelle, setPlatLibelle] = useState("")
  const [nombrePortions, setNombrePortions] = useState("1")
  const [note, setNote] = useState("")
  const [lignes, setLignes] = useState<LignePrepLocal[]>([])
  const [matieres, setMatieres] = useState<any[]>([])
  const [searchIngredient, setSearchIngredient] = useState("")
  const [stocksOriginaux, setStocksOriginaux] = useState<Record<number, number>>({})

  useEffect(() => {
    Promise.all([
      apiClient.get(`/plats/preparations/${id}`),
      apiClient.get("/matieres-premieres?limit=1000"),
    ]).then(([prepRes, mpRes]) => {
      const prep = (prepRes.data as any).data
      const mp = (mpRes.data as any)
      const toutesMP = mp?.data?.data || mp?.data || []
      setMatieres(toutesMP)
      setPlatLibelle(prep.plat?.libelle || "")
      setNombrePortions(String(prep.nombrePortions))
      setNote(prep.note || "")

      // Construire un map stock actuel + quantité de cette prépa (pour calculer "stock effectif")
      const origaux: Record<number, number> = {}
      const lignesInit: LignePrepLocal[] = (prep.lignes || []).map((l: any) => {
        const mpInfo = toutesMP.find((m: any) => m.id === l.matierePremiereId)
        const stockActuel = mpInfo?.quantiteStock ?? 0
        const stockEffectif = stockActuel + l.quantiteUtilisee // stock actuel + ce qu'on avait utilisé
        origaux[l.matierePremiereId] = l.quantiteUtilisee
        return {
          id: Math.random().toString(36).substring(2),
          matierePremiereId: l.matierePremiereId,
          nom: l.matierePremiere?.nom || mpInfo?.nom || "—",
          unite: l.matierePremiere?.unite || mpInfo?.unite || "",
          quantiteUtilisee: l.quantiteUtilisee,
          stockDisponible: stockEffectif,
        }
      })
      setLignes(lignesInit)
      setStocksOriginaux(origaux)
    }).catch((e) => {
      toast({ title: "Erreur", description: e.response?.data?.message || "Impossible de charger", variant: "destructive" })
      router.push("/magasinier/productions")
    }).finally(() => setLoading(false))
  }, [id])

  const filteredIngredients = matieres.filter((m) =>
    m.nom.toLowerCase().includes(searchIngredient.toLowerCase()) &&
    !lignes.some((l) => l.matierePremiereId === m.id)
  )

  const ajouterIngredient = (mp: any) => {
    const ancienneQte = stocksOriginaux[mp.id] ?? 0
    setLignes((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2),
        matierePremiereId: mp.id,
        nom: mp.nom,
        unite: mp.unite || "",
        quantiteUtilisee: 0,
        stockDisponible: mp.quantiteStock + ancienneQte,
      },
    ])
    setSearchIngredient("")
  }

  const updateQuantite = (id: string, val: string) => {
    const num = parseFloat(val)
    setLignes((prev) => prev.map((l) => l.id === id ? { ...l, quantiteUtilisee: isNaN(num) ? 0 : num } : l))
  }

  const supprimerLigne = (id: string) => setLignes((prev) => prev.filter((l) => l.id !== id))

  const valider = async () => {
    if (lignes.length === 0) {
      toast({ title: "Ajoutez au moins un ingrédient", variant: "destructive" }); return
    }
    if (lignes.some((l) => l.quantiteUtilisee <= 0)) {
      toast({ title: "Quantités invalides", description: "Toutes les quantités doivent être > 0", variant: "destructive" }); return
    }
    const insuff = lignes.filter((l) => l.quantiteUtilisee > l.stockDisponible)
    if (insuff.length > 0) {
      toast({ title: "Stock insuffisant", description: insuff.map((l) => `${l.nom}: besoin ${l.quantiteUtilisee}, dispo ${l.stockDisponible}`).join(" | "), variant: "destructive" }); return
    }

    setSaving(true)
    try {
      await apiClient.put(`/plats/preparations/${id}`, {
        nombrePortions: parseInt(nombrePortions) || 1,
        note: note || undefined,
        lignes: lignes.map((l) => ({ matierePremiereId: l.matierePremiereId, quantiteUtilisee: l.quantiteUtilisee })),
      })
      toast({ title: "Préparation modifiée", description: "Le stock a été recalculé." })
      router.push(`/magasinier/productions/${id}`)
    } catch (e: any) {
      toast({ title: "Erreur", description: e.response?.data?.message || e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const stockOk = lignes.length > 0 && lignes.every((l) => l.quantiteUtilisee > 0 && l.quantiteUtilisee <= l.stockDisponible)

  if (loading) return <div className="container py-8 text-center text-muted-foreground">Chargement...</div>

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/magasinier/productions/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <ChefHat className="h-7 w-7" />
        Modifier la préparation #{id}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          {/* Infos */}
          <Card>
            <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Plat</Label>
                <Input value={platLibelle} disabled className="bg-muted" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de plats préparés</Label>
                  <Input type="number" min="1" value={nombrePortions} onChange={(e) => setNombrePortions(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Note (optionnel)</Label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingrédients */}
          <Card>
            <CardHeader><CardTitle>Ingrédients utilisés</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ajouter un ingrédient..."
                  className="pl-9"
                  value={searchIngredient}
                  onChange={(e) => setSearchIngredient(e.target.value)}
                />
                {searchIngredient && filteredIngredients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                    {filteredIngredients.map((mp) => (
                      <div key={mp.id} className="p-3 hover:bg-muted cursor-pointer flex justify-between" onClick={() => ajouterIngredient(mp)}>
                        <span className="font-medium">{mp.nom}</span>
                        <span className="text-sm text-muted-foreground">Stock: {mp.quantiteStock} {mp.unite}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {lignes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                  Aucun ingrédient.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrédient</TableHead>
                      <TableHead className="text-right">Dispo (avec remise)</TableHead>
                      <TableHead className="text-center">Quantité utilisée</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((ligne) => {
                      const depasse = ligne.quantiteUtilisee > ligne.stockDisponible
                      return (
                        <TableRow key={ligne.id} className={depasse ? "bg-destructive/5" : ""}>
                          <TableCell className="font-medium">{ligne.nom}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {ligne.stockDisponible} <span className="text-xs">{ligne.unite}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number" min="0.01" step="0.01"
                                value={ligne.quantiteUtilisee || ""}
                                onChange={(e) => updateQuantite(ligne.id, e.target.value)}
                                className={`w-28 h-8 text-right ${depasse ? "border-destructive" : ""}`}
                              />
                              <span className="text-xs text-muted-foreground">{ligne.unite}</span>
                            </div>
                            {depasse && <p className="text-xs text-destructive text-center mt-1">Dépasse le stock</p>}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => supprimerLigne(ligne.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Récap */}
        <div>
          <Card className="sticky top-8">
            <CardHeader><CardTitle>Récapitulatif</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plat</span>
                  <span className="font-medium">{platLibelle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plats préparés</span>
                  <span className="font-medium">{nombrePortions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingrédients</span>
                  <span className="font-medium">{lignes.length}</span>
                </div>
              </div>
              {lignes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    {lignes.map((l) => (
                      <div key={l.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[130px]">{l.nom}</span>
                        <span className={l.quantiteUtilisee > l.stockDisponible ? "text-destructive font-medium" : ""}>
                          {l.quantiteUtilisee || 0} {l.unite}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" size="lg" disabled={!stockOk || saving} onClick={valider}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/magasinier/productions/${id}`}>Annuler</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
