"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { productionService } from "@/services/production-service"
import type { Production } from "@/types/production"
import { DataPagination } from "@/components/shared/data-pagination"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function ProductionsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { hasPermission } = usePermissions()

  useEffect(() => {
    const loadProductions = async () => {
      setLoading(true)
      try {
        const data = await productionService.getAll()
        setProductions(data)
      } catch (error: any) {
        console.error('Erreur chargement productions:', error)
        toast({
          title: "Erreur de chargement",
          description: error.response?.data?.message || "Impossible de charger les productions",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProductions()
  }, [toast])

  const allFilteredProductions = productions.filter((prod) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (prod.produit?.libelle && prod.produit.libelle.toLowerCase().includes(searchLower)) ||
      (prod.lot && prod.lot.toLowerCase().includes(searchLower)) ||
      (prod.employe?.user &&
        (`${prod.employe.user.prenom} ${prod.employe.user.nom}`.toLowerCase().includes(searchLower)))
    )
  })
  const totalItems = allFilteredProductions.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const filteredProductions = allFilteredProductions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = totalItems > 0 ? {
    page: currentPage,
    totalPages,
    total: totalItems,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette production ?")) return

    try {
      await productionService.delete(id)
      setProductions(productions.filter((p) => p.id !== id))
      toast({
        title: "Succès",
        description: "Production supprimée avec succès",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de supprimer la production",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Productions</CardTitle>
                  <CardDescription>
                    Gérez les enregistrements de production et consommation de matières premières
                  </CardDescription>
                </div>
                <PermissionGuard permission="production.create">
                  <Button asChild>
                    <Link href="/magasinier/productions/nouveau">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle production
                    </Link>
                  </Button>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher une production..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredProductions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune production trouvée
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Quantité fabriquée</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProductions.map((production) => (
                        <TableRow key={production.id}>
                          <TableCell className="font-medium">
                            {production.produit?.libelle || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{production.quantiteFabriquee} unités</Badge>
                          </TableCell>
                          <TableCell>{formatDate(production.dateProduction)}</TableCell>
                          <TableCell>
                            {production.employe?.user
                              ? `${production.employe.user.prenom} ${production.employe.user.nom}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {production.lot ? (
                              <Badge variant="outline">{production.lot}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission("production.read") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/magasinier/productions/${production.id}`}>
                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                    Voir
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("production.delete") && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(production.id)}>
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  Supprimer
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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
        </main>
      </div>
    </div>
  )
}
