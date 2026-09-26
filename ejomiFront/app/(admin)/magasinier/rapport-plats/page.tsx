"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Minus, ChefHat, ShoppingBag, PackageCheck, Warehouse } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import apiClient from "@/services/api-client"

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA"

export default function RapportPlatsPage() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const todayStr = today.toISOString().split("T")[0]

  const [debut, setDebut] = useState(firstDay)
  const [fin, setFin] = useState(todayStr)
  const [filtres, setFiltres] = useState({ debut: firstDay, fin: todayStr })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rapport-plats", filtres.debut, filtres.fin],
    queryFn: async () => {
      const res = await apiClient.get(`/plats/rapport-couts?debut=${filtres.debut}&fin=${filtres.fin}`)
      return (res.data as any).data
    },
  })

  const appliquer = () => setFiltres({ debut, fin })

  const rapport: any[] = data?.rapport || []
  const totaux = data?.totaux

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Rapport coûts & ventes par plat
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Coût des ingrédients achetés vs revenus des ventes — stock de plats restants en temps réel
        </p>
      </div>

      {/* Filtre période */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Du</Label>
              <Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label>Au</Label>
              <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="w-40" />
            </div>
            <Button onClick={appliquer}>Appliquer</Button>
          </div>
        </CardContent>
      </Card>

      {/* Totaux */}
      {totaux && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <PackageCheck className="h-4 w-4" />
                Plats préparés
              </div>
              <p className="text-2xl font-bold">{totaux.totalPlatsPrepares}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ShoppingBag className="h-4 w-4" />
                Plats vendus
              </div>
              <p className="text-2xl font-bold">{totaux.totalPlatsVendus}</p>
            </CardContent>
          </Card>
          <Card className={totaux.totalStockRestant > 0 ? "border-orange-200" : "border-green-200"}>
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Warehouse className="h-4 w-4" />
                Stock restant
              </div>
              <p className={`text-2xl font-bold ${totaux.totalStockRestant > 0 ? "text-orange-600" : "text-green-600"}`}>
                {totaux.totalStockRestant}
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingDown className="h-4 w-4 text-blue-500" />
                Coût appro ingréd.
              </div>
              <p className="text-2xl font-bold text-blue-600">{fmt(totaux.coutApproIngredients)}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Coût utilisé
              </div>
              <p className="text-2xl font-bold text-red-600">{fmt(totaux.coutIngredients)}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Revenu ventes
              </div>
              <p className="text-2xl font-bold text-green-600">{fmt(totaux.revenuVente)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bénéfice global */}
      {totaux && (
        <Card className={totaux.benefice >= 0 ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"}>
          <CardContent className="pt-4 flex items-center gap-4">
            {totaux.benefice >= 0
              ? <TrendingUp className="h-8 w-8 text-green-600" />
              : <TrendingDown className="h-8 w-8 text-red-600" />}
            <div>
              <p className="text-sm text-muted-foreground">Bénéfice net sur la période (ventes − coût ingrédients utilisés)</p>
              <p className={`text-3xl font-bold ${totaux.benefice >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totaux.benefice >= 0 ? "+" : ""}{fmt(totaux.benefice)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau par plat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ChefHat className="h-5 w-5" />Détail par plat</CardTitle>
          <CardDescription>Préparés / vendus / stock restant / coût / revenu par plat sur la période</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Chargement...</div>
          ) : rapport.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Aucune donnée sur cette période.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plat</TableHead>
                    <TableHead className="text-right">Préparés</TableHead>
                    <TableHead className="text-right">Vendus</TableHead>
                    <TableHead className="text-right">Stock restant</TableHead>
                    <TableHead className="text-right">Écart période</TableHead>
                    <TableHead className="text-right">Coût appro</TableHead>
                    <TableHead className="text-right">Coût utilisé</TableHead>
                    <TableHead className="text-right">Revenu</TableHead>
                    <TableHead className="text-right">Bénéfice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapport.map((r: any) => {
                    const beneficePos = r.benefice >= 0
                    const hasActivity = r.totalPlatsPreparesUnites > 0 || r.totalPlatsVendus > 0 || r.stockPlatRestant > 0
                    const ecart: number = r.ecartPreparesVendus ?? (r.totalPlatsPreparesUnites - r.totalPlatsVendus)
                    return (
                      <TableRow key={r.platId} className={!hasActivity ? "opacity-40" : ""}>
                        <TableCell className="font-medium">{r.libelle}</TableCell>
                        <TableCell className="text-right">
                          {r.totalPlatsPreparesUnites > 0
                            ? <Badge variant="secondary">{r.totalPlatsPreparesUnites}</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.totalPlatsVendus > 0
                            ? <Badge variant="outline" className="text-green-700 border-green-300">{r.totalPlatsVendus}</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.stockPlatRestant > 0
                            ? <Badge variant="outline" className="text-orange-700 border-orange-300">{r.stockPlatRestant} en stock</Badge>
                            : <span className="text-muted-foreground text-xs">0</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {!hasActivity ? (
                            <span className="text-muted-foreground">—</span>
                          ) : ecart === 0 ? (
                            <span className="text-muted-foreground flex items-center justify-end gap-1"><Minus className="h-3 w-3" />0</span>
                          ) : ecart > 0 ? (
                            <span className="text-orange-600 font-semibold">+{ecart} invendu{ecart !== 1 ? "s" : ""}</span>
                          ) : (
                            <span className="text-blue-600 font-semibold">{ecart}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-mono text-sm">
                          {r.coutApproIngredients > 0 ? fmt(r.coutApproIngredients) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-mono text-sm">
                          {r.coutIngredients > 0 ? fmt(r.coutIngredients) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-mono text-sm">
                          {r.revenuVente > 0 ? fmt(r.revenuVente) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono">
                          {!hasActivity ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={beneficePos ? "text-green-600" : "text-red-600"}>
                              {r.benefice >= 0 ? "+" : ""}{fmt(r.benefice)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
