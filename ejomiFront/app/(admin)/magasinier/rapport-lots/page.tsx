"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Package, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/services/api-client"

interface LotRapport {
  id: number
  produit: { id: number; libelle: string; prixDeVenteUnitaire: number }
  dateAppro: string
  approvisionnementId: number
  prixAchat: number
  prixVente: number
  margeUnitaire: number
  tauxMarge: number
  quantiteInitiale: number
  quantiteVendue: number
  quantiteRestante: number
  margeRealisee: number
  margePotentielle: number
  margeTotale: number
  statut: "INTACT" | "PARTIEL" | "EPUISE"
}

interface Totaux {
  quantiteInitiale: number
  quantiteVendue: number
  quantiteRestante: number
  margeRealisee: number
  margePotentielle: number
  margeTotale: number
}

const STATUT_CONFIG = {
  INTACT:  { label: "Non entamé",  variant: "secondary" as const },
  PARTIEL: { label: "En cours",    variant: "default"   as const },
  EPUISE:  { label: "Épuisé",      variant: "outline"   as const },
}

export default function RapportLotsPage() {
  const { toast } = useToast()
  const [lots, setLots] = useState<LotRapport[]>([])
  const [totaux, setTotaux] = useState<Totaux | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/lots/rapport")
        const body = res.data
        setLots(body.data || [])
        setTotaux(body.totaux || null)
      } catch (error: any) {
        toast({ title: "Erreur", description: "Impossible de charger le rapport", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Grouper par produit
  const lotsParProduit = lots.reduce<Record<number, { libelle: string; lots: LotRapport[] }>>((acc, lot) => {
    if (!acc[lot.produit.id]) acc[lot.produit.id] = { libelle: lot.produit.libelle, lots: [] }
    acc[lot.produit.id].lots.push(lot)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement du rapport...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold">Rapport des lots FIFO</h1>
          <p className="text-muted-foreground">
            Suivi de chaque lot d'approvisionnement — vendu, restant et marge réalisée
          </p>
        </div>

        {/* Totaux globaux */}
        {totaux && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">Qté totale</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold">{totaux.quantiteInitiale}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">Vendues</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-green-600">{totaux.quantiteVendue}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">Restantes</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-blue-600">{totaux.quantiteRestante}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">Marge réalisée</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-green-600">{totaux.margeRealisee.toLocaleString()} F</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">Marge potentielle</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-orange-500">{totaux.margePotentielle.toLocaleString()} F</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">Marge totale si tout vendu</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold">{totaux.margeTotale.toLocaleString()} F</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Un tableau par produit */}
        {Object.values(lotsParProduit).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>Aucun lot trouvé. Commencez par créer des approvisionnements.</p>
            </CardContent>
          </Card>
        ) : (
          Object.values(lotsParProduit).map(({ libelle, lots: lotsGroup }) => {
            const totalVendu = lotsGroup.reduce((s, l) => s + l.quantiteVendue, 0)
            const totalRestant = lotsGroup.reduce((s, l) => s + l.quantiteRestante, 0)
            const totalInitial = lotsGroup.reduce((s, l) => s + l.quantiteInitiale, 0)
            const margeRealiseeTotal = lotsGroup.reduce((s, l) => s + l.margeRealisee, 0)
            const margePotentielleTotal = lotsGroup.reduce((s, l) => s + l.margePotentielle, 0)

            return (
              <Card key={libelle}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {libelle}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Total: <strong>{totalInitial}</strong></span>
                      <span className="text-green-600">Vendus: <strong>{totalVendu}</strong></span>
                      <span className="text-blue-600">Restants: <strong>{totalRestant}</strong></span>
                    </div>
                  </div>
                  {/* Barre de progression vente */}
                  <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: totalInitial > 0 ? `${(totalVendu / totalInitial) * 100}%` : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalInitial > 0 ? ((totalVendu / totalInitial) * 100).toFixed(0) : 0}% vendu
                    — Marge réalisée : <span className="text-green-600 font-semibold">{margeRealiseeTotal.toLocaleString()} FCFA</span>
                    &nbsp;| Potentielle : <span className="text-orange-500 font-semibold">{margePotentielleTotal.toLocaleString()} FCFA</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot #</TableHead>
                        <TableHead>Date appro</TableHead>
                        <TableHead className="text-right">Prix achat</TableHead>
                        <TableHead className="text-right">Prix vente</TableHead>
                        <TableHead className="text-right">Marge/u</TableHead>
                        <TableHead className="text-center">Qté initiale</TableHead>
                        <TableHead className="text-center">Vendues</TableHead>
                        <TableHead className="text-center">Restantes</TableHead>
                        <TableHead className="text-right">Marge réalisée</TableHead>
                        <TableHead className="text-right">Marge potentielle</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotsGroup.map((lot) => (
                        <TableRow key={lot.id} className={lot.statut === "EPUISE" ? "opacity-50" : ""}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            L-{lot.id}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(lot.dateAppro), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">{lot.prixAchat.toLocaleString()} F</TableCell>
                          <TableCell className="text-right">{lot.prixVente.toLocaleString()} F</TableCell>
                          <TableCell className={`text-right font-semibold ${lot.margeUnitaire >= 0 ? "text-green-600" : "text-red-600"}`}>
                            <span className="flex items-center justify-end gap-1">
                              {lot.margeUnitaire >= 0
                                ? <TrendingUp className="h-3 w-3" />
                                : <TrendingDown className="h-3 w-3" />}
                              {lot.margeUnitaire.toLocaleString()} F
                              <span className="text-xs font-normal text-muted-foreground">({lot.tauxMarge}%)</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{lot.quantiteInitiale}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">{lot.quantiteVendue}</TableCell>
                          <TableCell className="text-center">
                            <span className={lot.quantiteRestante > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                              {lot.quantiteRestante}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {lot.margeRealisee.toLocaleString()} F
                          </TableCell>
                          <TableCell className="text-right text-orange-500">
                            {lot.quantiteRestante > 0 ? `${lot.margePotentielle.toLocaleString()} F` : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={STATUT_CONFIG[lot.statut].variant}>
                              {STATUT_CONFIG[lot.statut].label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
