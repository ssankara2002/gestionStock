"use client"

import { useState } from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import {
  TrendingUp, TrendingDown, Wallet, ShoppingCart, Package,
  AlertTriangle, BarChart3, FileText, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useQuery } from "@tanstack/react-query"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import apiClient from "@/services/api-client"

interface BilanData {
  periode: { debut: string; fin: string }
  revenus: {
    totalVentes: number
    totalPaiementsRecus: number
    creances: number
    nbCommandes: number
    nbCommandesLivrees: number
  }
  depenses: {
    totalApprovisionnements: number
    totalSalaires: number
    total: number
  }
  beneficeNet: number
  margePercent: number
  topProduits: Array<{ libelle: string; quantite: number; montant: number }>
  detailTransactions: Array<{ type: string; libelle: string; montant: number; date: string }>
}

const PERIODES_RAPIDES = [
  {
    label: "Ce mois",
    debut: () => format(startOfMonth(new Date()), "yyyy-MM-dd"),
    fin: () => format(endOfMonth(new Date()), "yyyy-MM-dd"),
  },
  {
    label: "Mois précédent",
    debut: () => format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
    fin: () => format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
  },
  {
    label: "3 derniers mois",
    debut: () => format(startOfMonth(subMonths(new Date(), 2)), "yyyy-MM-dd"),
    fin: () => format(endOfMonth(new Date()), "yyyy-MM-dd"),
  },
  {
    label: "Cette année",
    debut: () => format(startOfYear(new Date()), "yyyy-MM-dd"),
    fin: () => format(endOfYear(new Date()), "yyyy-MM-dd"),
  },
]

const PIE_COLORS = ["#d4af37", "#ef4444"]

export default function BilanFinancierPage() {
  const today = new Date()
  const [debut, setDebut] = useState(format(startOfMonth(today), "yyyy-MM-dd"))
  const [fin, setFin] = useState(format(endOfMonth(today), "yyyy-MM-dd"))
  const [queryParams, setQueryParams] = useState({ debut, fin })

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bilan", queryParams.debut, queryParams.fin],
    queryFn: async () => {
      const res = await apiClient.get(`/bilan?debut=${queryParams.debut}&fin=${queryParams.fin}`)
      return res.data.data as BilanData
    },
  })

  const appliquer = () => setQueryParams({ debut, fin })

  const pieData = data
    ? [
        { name: "Revenus reçus", value: data.revenus.totalPaiementsRecus },
        { name: "Dépenses", value: data.depenses.total },
      ]
    : []

  const barData = data
    ? [
        { name: "Revenus", montant: data.revenus.totalVentes, fill: "#22c55e" },
        { name: "Encaissés", montant: data.revenus.totalPaiementsRecus, fill: "#d4af37" },
        { name: "Appro.", montant: data.depenses.totalApprovisionnements, fill: "#ef4444" },
        { name: "Salaires", montant: data.depenses.totalSalaires, fill: "#f97316" },
      ]
    : []

  return (
    <div className="container py-8 space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold">Bilan Financier</h1>
          <p className="text-muted-foreground mt-1">Analyse des revenus et dépenses sur une période</p>
        </div>
        <Badge variant="outline" className="text-sm w-fit">
          <FileText className="h-4 w-4 mr-1" />
          {queryParams.debut} → {queryParams.fin}
        </Badge>
      </div>

      {/* Sélecteur de période */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner la période</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PERIODES_RAPIDES.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant="outline"
                onClick={() => {
                  const d = p.debut()
                  const f = p.fin()
                  setDebut(d)
                  setFin(f)
                  setQueryParams({ debut: d, fin: f })
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label>Date de début</Label>
              <Input type="date" value={debut} onChange={e => setDebut(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1">
              <Label>Date de fin</Label>
              <Input type="date" value={fin} onChange={e => setFin(e.target.value)} className="w-44" />
            </div>
            <Button onClick={appliquer} className="btn-gold">
              Générer le bilan
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Erreur lors du chargement du bilan.
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-500/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                    <h3 className="text-2xl font-bold mt-1">{data.revenus.totalVentes.toLocaleString()}</h3>
                    <p className="text-xs text-muted-foreground">FCFA</p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Encaissé : <span className="font-semibold text-green-600">{data.revenus.totalPaiementsRecus.toLocaleString()} FCFA</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-500/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total dépenses</p>
                    <h3 className="text-2xl font-bold mt-1">{data.depenses.total.toLocaleString()}</h3>
                    <p className="text-xs text-muted-foreground">FCFA</p>
                  </div>
                  <div className="rounded-full bg-red-100 p-3">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                  <span>Appro: <b>{data.depenses.totalApprovisionnements.toLocaleString()}</b></span>
                  <span>•</span>
                  <span>Salaires: <b>{data.depenses.totalSalaires.toLocaleString()}</b></span>
                </div>
              </CardContent>
            </Card>

            <Card className={data.beneficeNet >= 0 ? "border-green-500/50" : "border-red-500/50"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bénéfice net</p>
                    <h3 className={`text-2xl font-bold mt-1 ${data.beneficeNet >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {data.beneficeNet >= 0 ? "+" : ""}{data.beneficeNet.toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted-foreground">FCFA</p>
                  </div>
                  <div className={`rounded-full p-3 ${data.beneficeNet >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                    {data.beneficeNet >= 0
                      ? <ArrowUpRight className="h-5 w-5 text-green-600" />
                      : <ArrowDownRight className="h-5 w-5 text-red-600" />}
                  </div>
                </div>
                <div className="mt-3 text-xs flex items-center gap-1">
                  Marge : <Badge variant={data.margePercent >= 0 ? "outline" : "destructive"} className="text-xs">
                    {data.margePercent}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes</p>
                    <h3 className="text-2xl font-bold mt-1">{data.revenus.nbCommandes}</h3>
                    <p className="text-xs text-muted-foreground">sur la période</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                  <span>{data.revenus.nbCommandesLivrees} livrées</span>
                  {data.revenus.creances > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600 font-semibold">
                        Créances: {data.revenus.creances.toLocaleString()} FCFA
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Bar chart comparatif */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenus vs Dépenses</CardTitle>
                <CardDescription>Comparaison des flux financiers de la période</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} FCFA`]} />
                      <Bar dataKey="montant" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie chart */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition</CardTitle>
                <CardDescription>Revenus encaissés vs Dépenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} FCFA`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#d4af37] inline-block" />Revenus</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#ef4444] inline-block" />Dépenses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top produits + Transactions */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Top produits vendus */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle>Top 5 produits vendus</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {data.topProduits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune vente sur cette période</p>
                ) : (
                  <div className="space-y-3">
                    {data.topProduits.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/10 w-7 h-7 flex items-center justify-center text-xs shrink-0">
                          {i + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.libelle}</p>
                          <p className="text-xs text-muted-foreground">{p.quantite} unités</p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">{p.montant.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dernières transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <CardTitle>Transactions récentes</CardTitle>
                </div>
                <CardDescription>25 dernières de la période</CardDescription>
              </CardHeader>
              <CardContent>
                {data.detailTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune transaction</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {data.detailTransactions.map((t, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{t.libelle}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold shrink-0 ${t.type === "ENTREE" ? "text-green-600" : "text-red-600"}`}>
                          {t.type === "ENTREE" ? "+" : "-"}{Number(t.montant).toLocaleString()} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerte créances */}
          {data.revenus.creances > 0 && (
            <Card className="border-orange-500/50 bg-orange-50">
              <CardContent className="p-5 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-orange-800">Créances non recouvrées</p>
                  <p className="text-sm text-orange-700 mt-1">
                    {data.revenus.creances.toLocaleString()} FCFA restent à encaisser sur cette période.
                    Le chiffre d'affaires réel encaissé est de {data.revenus.totalPaiementsRecus.toLocaleString()} FCFA
                    sur {data.revenus.totalVentes.toLocaleString()} FCFA facturés.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
