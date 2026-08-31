"use client"

import { useState } from "react"
import Image from "next/image"
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Store,
  Warehouse,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/context/auth-provider"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { dashboardService } from "@/services/dashboard-service"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"


// Define columns for the low stock products table
type LowStockProduct = {
  id: number
  libelle: string
  stockBoutique: number
  stockMagasin: number
  prixDeVenteUnitaire: number
}

const lowStockColumns: ColumnDef<LowStockProduct>[] = [
  {
    accessorKey: "libelle",
    header: "Produit",
    cell: ({ row }) => <div className="font-medium">{row.getValue("libelle")}</div>,
  },
  {
    accessorKey: "stockBoutique",
    header: "Boutique",
    cell: ({ row }) => {
      const qty = Number(row.getValue("stockBoutique"))
      return (
        <div className="flex items-center gap-2">
          {qty <= 5 && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
          <Badge variant={qty <= 5 ? "destructive" : "outline"}>{qty}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "stockMagasin",
    header: "Magasin",
    cell: ({ row }) => {
      const qty = Number(row.getValue("stockMagasin"))
      return (
        <Badge variant={qty <= 5 ? "secondary" : "outline"}>{qty}</Badge>
      )
    },
  },
  {
    accessorKey: "prixDeVenteUnitaire",
    header: "Prix",
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue("prixDeVenteUnitaire"))
      return <div>{price.toLocaleString()} FCFA</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original
      return (
        <Button asChild size="sm" variant="ghost">
          <Link href={`/produits/${product.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Voir
          </Link>
        </Button>
      )
    },
  },
]

export default function ManagerDashboardPage() {
  const { user } = useAuth()
  const [chartPeriod, setChartPeriod] = useState("week")
  const [stockAlerteLieu, setStockAlerteLieu] = useState<"boutique" | "magasin">("boutique")

  // Use React Query for caching and auto-refetching
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await dashboardService.getStats()
      return response.data
    },
    staleTime: 0,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Erreur lors du chargement des données</p>
      </div>
    )
  }

  const { inventory, customers, orders, recentOrders, lowStockProducts, lowStockMagasinProducts, topSellingProducts, salesChartData, payments } = stats

  // Préparer les données pour le graphique en fonction de la période sélectionnée
  const getChartData = () => {
    if (chartPeriod === "week") {
      return salesChartData.week.map((item: any) => ({
        name: format(new Date(item.date), "EEE dd", { locale: fr }),
        commandes: item.count,
        montant: item.total,
      }))
    } else if (chartPeriod === "month") {
      return salesChartData.month.map((item: any) => ({
        name: format(new Date(item.date), "dd MMM", { locale: fr }),
        commandes: item.count,
        montant: item.total,
      }))
    } else {
      // year
      const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
      return salesChartData.year.map((item: any) => ({
        name: monthNames[item.month - 1] || item.month,
        commandes: item.count,
        montant: item.total,
      }))
    }
  }

  const chartData = getChartData()

  return (
    <PermissionGuard permissions={["employe.read", "transaction.read"]} redirectTo="/auth/login">
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container py-8">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="font-playfair text-3xl font-bold md:text-4xl">Tableau de bord</h1>
              <p className="mt-1 text-muted-foreground">
                Bienvenue, {user?.prenom || user?.nom || "Utilisateur"}. Voici un aperçu de l'activité.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Mai 2025
              </Button>
              <Button className="btn-gold">
                <BarChart3 className="mr-2 h-4 w-4" />
                Générer un rapport
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className={inventory.lowStockCount > 0 ? "border-orange-500/50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inventaire</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-2xl font-bold">{inventory.totalProducts}</h3>
                      <p className={`text-xs ${inventory.percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {inventory.percentChange >= 0 ? (
                          <ArrowUpRight className="inline h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="inline h-3 w-3" />
                        )}
                        {Math.abs(inventory.percentChange)}%
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">produits en stock</p>
                  </div>
                  <div className={`rounded-full p-3 ${inventory.lowStockCount > 0 ? "bg-orange-100" : "bg-primary/10"}`}>
                    {inventory.lowStockCount > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-orange-600 animate-pulse" />
                    ) : (
                      <Package className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {inventory.lowStockCount > 0 ? (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      ⚠️ {inventory.lowStockCount} produit{inventory.lowStockCount > 1 ? "s" : ""} en stock faible (≤ 5)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ✓ Stock normal
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Clients</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-2xl font-bold">{customers.totalCustomers}</h3>
                      <p className={`text-xs ${customers.percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {customers.percentChange >= 0 ? (
                          <ArrowUpRight className="inline h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="inline h-3 w-3" />
                        )}
                        {Math.abs(customers.percentChange)}%
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">clients au total</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-green-500">+{customers.newThisMonth}</span> nouveaux clients ce
                    mois-ci
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ventes</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-2xl font-bold">{orders.totalOrders}</h3>
                      <p className={`text-xs ${orders.percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {orders.percentChange >= 0 ? (
                          <ArrowUpRight className="inline h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="inline h-3 w-3" />
                        )}
                        {Math.abs(orders.percentChange)}%
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">ventes ce mois-ci</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {orders.pendingOrders} en attente
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 text-xs">
                    {orders.completedOrders} complétées
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques Financières */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Statistiques Financières</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Paiements */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Payé</p>
                      <h3 className="text-2xl font-bold mt-2">{payments.totalPaiements.toLocaleString()} FCFA</h3>
                      <p className="text-xs text-muted-foreground mt-1">Tous les paiements reçus</p>
                    </div>
                    <div className="rounded-full bg-green-100 p-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-green-600 font-medium">
                      Ce mois: {payments.totalPaiementsCeMois.toLocaleString()} FCFA
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Créances */}
              <Card className={payments.totalCreances > 0 ? "border-orange-500/50" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Créances</p>
                      <h3 className="text-2xl font-bold mt-2">{payments.totalCreances.toLocaleString()} FCFA</h3>
                      <p className="text-xs text-muted-foreground mt-1">Montants non payés</p>
                    </div>
                    <div className={`rounded-full p-3 ${payments.totalCreances > 0 ? "bg-orange-100" : "bg-gray-100"}`}>
                      <AlertTriangle className={`h-5 w-5 ${payments.totalCreances > 0 ? "text-orange-600" : "text-gray-400"}`} />
                    </div>
                  </div>
                  {payments.totalCreances > 0 && (
                    <div className="mt-4">
                      <Badge variant="destructive" className="text-xs">
                        À recouvrer
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dépenses */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
                      <h3 className="text-2xl font-bold mt-2">{payments.totalDepenses.toLocaleString()} FCFA</h3>
                      <p className="text-xs text-muted-foreground mt-1">Appro. + Salaires</p>
                    </div>
                    <div className="rounded-full bg-red-100 p-3">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Balance */}
              <Card className={payments.balance >= 0 ? "border-green-500/50" : "border-red-500/50"}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Balance</p>
                      <h3 className={`text-2xl font-bold mt-2 ${payments.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {payments.balance >= 0 ? "+" : ""}{payments.balance.toLocaleString()} FCFA
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Revenus - Dépenses</p>
                    </div>
                    <div className={`rounded-full p-3 ${payments.balance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                      {payments.balance >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-red-600 transform rotate-180" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts and Tables */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Sales Chart */}
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ventes</CardTitle>
                    <CardDescription>Évolution des ventes et du chiffre d'affaires</CardDescription>
                  </div>
                  <Tabs defaultValue={chartPeriod} onValueChange={setChartPeriod}>
                    <TabsList className="grid w-[200px] grid-cols-3">
                      <TabsTrigger value="week">Semaine</TabsTrigger>
                      <TabsTrigger value="month">Mois</TabsTrigger>
                      <TabsTrigger value="year">Année</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Ventes', angle: -90, position: 'insideLeft', fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Montant (FCFA)', angle: 90, position: 'insideRight', fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number | undefined, name: string | undefined) => {
                            if (!value) return ["0", name || ""]
                            if (name === "montant") {
                              return [value.toLocaleString() + " FCFA", "Montant"]
                            }
                            return [value, "Ventes"]
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="commandes" fill="#d4af37" name="Ventes" />
                        <Bar yAxisId="right" dataKey="montant" fill="#82ca9d" name="Montant (FCFA)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">Aucune donnée</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Pas de ventes pour la période sélectionnée
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Ventes récentes</CardTitle>
                <CardDescription>Les 5 dernières ventes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <p className="font-medium">{order.clientName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>CMD-{order.id}</span>
                          <span>•</span>
                          <span>{format(new Date(order.date), "dd MMM yyyy", { locale: fr })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">{order.amount.toLocaleString()} FCFA</p>
                        <Badge variant={order.status === "payé" || order.status === "livrée" ? "outline" : "secondary"}>
                          {order.status === "payé" ? "Payée" : order.status === "livrée" ? "Livrée" : "En attente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/gerant/commandes">Voir toutes les ventes</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Low Stock Alert and Top Selling Products */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Low Stock Alert */}
            <Card className="col-span-1 lg:col-span-2 border-orange-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                    <CardTitle>Alerte de stock faible</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={stockAlerteLieu === "boutique" ? "default" : "outline"}
                      onClick={() => setStockAlerteLieu("boutique")}
                      className="gap-1.5"
                    >
                      <Store className="h-4 w-4" />
                      Boutique
                      {lowStockProducts.length > 0 && (
                        <Badge variant={stockAlerteLieu === "boutique" ? "secondary" : "destructive"} className="ml-1 h-5 px-1.5 text-xs">
                          {lowStockProducts.length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={stockAlerteLieu === "magasin" ? "default" : "outline"}
                      onClick={() => setStockAlerteLieu("magasin")}
                      className="gap-1.5"
                    >
                      <Warehouse className="h-4 w-4" />
                      Magasin
                      {lowStockMagasinProducts.length > 0 && (
                        <Badge variant={stockAlerteLieu === "magasin" ? "secondary" : "destructive"} className="ml-1 h-5 px-1.5 text-xs">
                          {lowStockMagasinProducts.length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {stockAlerteLieu === "boutique"
                    ? "Produits avec stock boutique ≤ 5 unités"
                    : "Produits avec stock magasin ≤ 5 unités"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const list = stockAlerteLieu === "boutique" ? lowStockProducts : lowStockMagasinProducts
                  return (
                    <>
                      {list.length > 0 && (
                        <div className="mb-4 rounded-lg bg-orange-50 border border-orange-200 p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-orange-800">
                                Attention ! {list.length} produit{list.length > 1 ? "s" : ""} en stock critique en {stockAlerteLieu === "boutique" ? "boutique" : "magasin"}
                              </p>
                              <p className="text-xs text-orange-700 mt-1">
                                {stockAlerteLieu === "boutique"
                                  ? "Stock boutique ≤ 5 unités. Effectuez un transfert depuis le magasin ou un réapprovisionnement."
                                  : "Stock magasin ≤ 5 unités. Veuillez créer un approvisionnement rapidement."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <DataTable
                          columns={lowStockColumns}
                          data={list}
                          searchColumn="libelle"
                          searchPlaceholder="Rechercher un produit..."
                        />
                      </div>
                    </>
                  )
                })()}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/magasinier/approvisionnements/ajouter">Créer un approvisionnement</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Top Selling Products */}
            <Card className="col-span-1">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle>Produits les plus vendus</CardTitle>
                </div>
                <CardDescription>Top des produits les plus demandés ce mois-ci</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topSellingProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune vente disponible
                    </div>
                  ) : (
                    topSellingProducts.map((product, index) => (
                      <div key={product.id} className="flex items-start gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {product.image ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}/uploads/${product.image}`}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/10 text-xs">
                              #{index + 1}
                            </Badge>
                            <h4 className="font-medium line-clamp-1">{product.name}</h4>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <p className="text-muted-foreground">{product.sales} commandés</p>
                            <p className="font-medium">{product.revenue.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/produits">Voir tous les produits</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </PermissionGuard>
  )
}
