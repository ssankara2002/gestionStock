"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Edit, Plus, Search, Eye, Trash2, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/layout/footer"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

import type { Produit } from "@/types/produit"
import { produitService } from "@/services"
import { DataPagination } from "@/components/shared/data-pagination"

export default function WarehouseProductsPage() {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Use React Query for caching
  const { data: produits = [], isLoading: loading } = useQuery({
    queryKey: ['produits'],
    queryFn: async () => {
      const res = await produitService.getAll()
      return res.data.data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await produitService.delete(id.toString())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de supprimer le produit",
        variant: "destructive",
      })
    },
  })

  // 🔍 Filtrage
  const allFilteredProducts = produits.filter((product) => {
    const matchesSearch =
      product.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    return matchesSearch
  })
  const totalItems = allFilteredProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const filteredProducts = allFilteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = totalItems > 0 ? {
    page: currentPage,
    totalPages,
    total: totalItems,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  // ❌ Suppression
  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    deleteMutation.mutate(productToDelete)
    setProductToDelete(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestion des Produits</h1>
            <PermissionGuard permission="produit.create">
              <Button asChild className="btn-gold">
                <Link href="/produits/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Link>
              </Button>
            </PermissionGuard>
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Liste des produits</CardTitle>
              <CardDescription>Gérez l'inventaire des produits, ajoutez de nouveaux produits ou modifiez les existants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher un produit..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Effacer</span>
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Chargement des produits...</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Prix de vente</TableHead>
                        <TableHead className="text-center">Stock Magasin</TableHead>
                        <TableHead className="text-center">Stock Boutique</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Aucun produit trouvé.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => {
                          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:3000"
                          const imageUrl = product.image
                            ? (product.image.startsWith("http") ? product.image : `${baseUrl}/uploads/${product.image}`)
                            : "/placeholder.svg?height=300&width=400"

                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="w-16 h-16 relative">
                                  <Image
                                    src={imageUrl}
                                    alt={product.libelle}
                                    fill
                                    className="object-contain rounded"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{product.libelle}</TableCell>
                              <TableCell className="max-w-xs">
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  {product.description || "-"}
                                </p>
                              </TableCell>
                              <TableCell>{product.prixDeVenteUnitaire} FCFA</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={(product.stockMagasin?.quantite ?? 0) > (product.stockMagasin?.seuilAlerte ?? 10) ? "outline" : "destructive"}>
                                  {product.stockMagasin?.quantite ?? 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={(product.stockBoutique?.quantite ?? 0) > (product.stockBoutique?.seuilAlerte ?? 5) ? "outline" : "destructive"}>
                                  {product.stockBoutique?.quantite ?? 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {hasPermission("produit.read") && (
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/produits/${product.id}`}>
                                        <Eye className="mr-1 h-3.5 w-3.5" />
                                        Voir
                                      </Link>
                                    </Button>
                                  )}
                                  {hasPermission("produit.update") && (
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/produits/${product.id}/edit`}>
                                        <Edit className="mr-1 h-3.5 w-3.5" />
                                        Modifier
                                      </Link>
                                    </Button>
                                  )}
                                  {hasPermission("produit.delete") && (
                                    <Button variant="destructive" size="sm" onClick={() => setProductToDelete(product.id)}>
                                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                                      Supprimer
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              {pagination && (
                <DataPagination
                  pagination={pagination}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 🧱 Dialog de confirmation suppression */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
