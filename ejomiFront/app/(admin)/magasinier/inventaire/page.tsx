"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, Warehouse, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { inventaireService } from "@/services/inventaire-service"
import { useAuth } from "@/context/auth-provider"
import type { AjustementStock } from "@/types/inventaire"
import Link from "next/link"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"

type Lieu = "MAGASIN" | "BOUTIQUE"

interface ProduitStock {
  id: number
  libelle: string
  quantite: number
  seuilAlerte: number
  stockId: number
}

export default function InventairePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [lieu, setLieu] = useState<Lieu>("MAGASIN")
  const [produits, setProduits] = useState<ProduitStock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ajustements, setAjustements] = useState<Map<number, AjustementStock>>(new Map())
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [search, setSearch] = useState("")
  const itemsPerPage = 10

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const loadProduits = useCallback(async (l: Lieu, page = 1, resetAdjustments = false) => {
    setLoading(true)
    if (resetAdjustments) setAjustements(new Map())
    try {
      const response = await inventaireService.getProduits(l, page, 1000)
      const payload = response.data?.data || response.data || []
      const raw: any[] = Array.isArray(payload) ? payload : payload.data || []
      const mapped: ProduitStock[] = raw.map((item: any) => {
        const stock = item.stockMagasin ?? item.stockBoutique ?? null
        const baseId = item.produitId ?? item.id ?? item.produit?.id
        const quantityValue = item.quantite ?? stock?.quantite ?? 0
        const seuilValue = item.seuilAlerte ?? stock?.seuilAlerte ?? (l === 'MAGASIN' ? 10 : 5)

        return {
          id: baseId,
          libelle: item.libelle ?? item.produit?.libelle ?? 'Produit',
          quantite: quantityValue,
          seuilAlerte: seuilValue,
          stockId: item.stockMagasinId ?? item.stockBoutiqueId ?? item.id,
        }
      })
      setProduits(mapped)

      const filtered = mapped.filter((produit) =>
        produit.libelle.toLowerCase().includes(search.toLowerCase())
      )
      const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
      const safePage = Math.min(page, totalPages)
      setPagination({
        page: safePage,
        limit: itemsPerPage,
        total: filtered.length,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      })
    } catch (error: any) {
      toast({
        title: "Erreur de chargement",
        description: error.response?.data?.message || "Impossible de charger les produits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    setCurrentPage(1)
    loadProduits(lieu, 1, true)
  }, [lieu, loadProduits])

  const handleQuantiteChange = (produitId: number, quantitePhysique: number, quantiteTheorique: number) => {
    setAjustements(prev => {
      const newMap = new Map(prev)
      if (quantitePhysique !== quantiteTheorique) {
        newMap.set(produitId, {
          produitId,
          quantiteTheorique,
          quantitePhysique,
          ecart: quantitePhysique - quantiteTheorique,
        })
      } else {
        newMap.delete(produitId)
      }
      return newMap
    })
  }

  const handleCommentaireChange = (produitId: number, commentaire: string) => {
    setAjustements(prev => {
      const newMap = new Map(prev)
      const a = newMap.get(produitId)
      if (a) newMap.set(produitId, { ...a, commentaire })
      return newMap
    })
  }

  const handleValidateInventaire = async () => {
    if (ajustements.size === 0) {
      toast({ title: "Aucun ajustement", description: "Modifiez au moins une quantité avant de valider", variant: "destructive" })
      return
    }
    if (!user?.employe?.id) {
      toast({ title: "Erreur", description: "Impossible d'identifier l'employé", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await inventaireService.ajusterStock({
        employeId: user.employe.id,
        lieu,
        ajustements: Array.from(ajustements.values()),
      })
      toast({ title: "Inventaire enregistré", description: `${ajustements.size} ajustement(s) effectué(s) avec succès` })
      await loadProduits(lieu, currentPage, true)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible d'enregistrer l'inventaire",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PermissionGuard permissions={["inventaire.create"]} redirectTo="/auth/login">
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventaire des produits</h1>
            <p className="text-muted-foreground text-sm mt-1">Saisissez les quantités physiques réellement comptées</p>
          </div>
          <div className="flex gap-2">
            <Link href="/magasinier/inventaire/historique">
              <Button variant="outline">Historique</Button>
            </Link>
            <Button
              onClick={handleValidateInventaire}
              disabled={saving || ajustements.size === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Valider ({ajustements.size})
            </Button>
          </div>
        </div>

        {/* Sélecteur Magasin / Boutique */}
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => setLieu("MAGASIN")}
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
              lieu === "MAGASIN" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
            }`}
          >
            <Warehouse className="h-4 w-4" />
            Magasin
          </button>
          <button
            type="button"
            onClick={() => setLieu("BOUTIQUE")}
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
              lieu === "BOUTIQUE" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
            }`}
          >
            <Store className="h-4 w-4" />
            Boutique
          </button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              Stock {lieu === "MAGASIN" ? "Magasin" : "Boutique"}
            </CardTitle>
            <CardDescription>
              {ajustements.size > 0
                ? `${ajustements.size} produit(s) avec ajustement en attente`
                : "Aucun ajustement en attente"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Input
                type="search"
                placeholder="Filtrer par produit..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Chargement...</div>
            ) : (() => {
              const allFilteredProduits = produits.filter((produit) =>
                produit.libelle.toLowerCase().includes(search.toLowerCase())
              )
              const totalItems = allFilteredProduits.length
              const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
              const safePage = Math.min(currentPage, totalPages)
              const filteredProduits = allFilteredProduits.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage)

              if (filteredProduits.length === 0) {
                return <div className="py-12 text-center text-muted-foreground">Aucun produit trouvé</div>
              }

              return (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Stock théorique</TableHead>
                        <TableHead className="text-right w-36">Quantité physique</TableHead>
                        <TableHead className="text-right">Écart</TableHead>
                        <TableHead>Commentaire</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProduits.map((produit) => {
                        const ajustement = ajustements.get(produit.id)
                        const quantitePhysique = ajustement?.quantitePhysique ?? produit.quantite
                        const ecart = quantitePhysique - produit.quantite

                        return (
                          <TableRow key={produit.id} className={ajustement ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                            <TableCell className="font-medium">{produit.libelle}</TableCell>
                            <TableCell className="text-right">{produit.quantite}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="0"
                                value={quantitePhysique}
                                onChange={(e) =>
                                  handleQuantiteChange(
                                    produit.id,
                                    parseInt(e.target.value) || 0,
                                    produit.quantite
                                  )
                                }
                                className="w-24 text-right ml-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={ecart > 0 ? "text-green-600 font-semibold" : ecart < 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                                {ecart > 0 ? "+" : ""}{ecart}
                              </span>
                            </TableCell>
                            <TableCell>
                              {ajustement && (
                                <Input
                                  type="text"
                                  placeholder="Commentaire (optionnel)"
                                  value={ajustement.commentaire || ""}
                                  onChange={(e) => handleCommentaireChange(produit.id, e.target.value)}
                                  className="w-56"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}

            <DataPagination
              pagination={pagination}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
