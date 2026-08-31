"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, PenLine, Plus, Search, Trash2, AlertTriangle, Package, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { matierePremiereService, getMatierePremiereStatistics } from "@/services/matiere-premiere-service"
import type { MatierePremiere } from "@/types/matierePremiere"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function MatieresPremieres() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<any>(null)
  const [matieres, setMatieres] = useState<MatierePremiere[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const { hasPermission } = usePermissions()

  // Charger les matières premières
  useEffect(() => {
    const loadMatieres = async () => {
      setLoading(true)
      try {
        const [response, statsRes] = await Promise.all([
          matierePremiereService.getAllMatieresPremieres(currentPage),
          getMatierePremiereStatistics()
        ]);
        setStats(statsRes.data);
        setMatieres(response.data || [])
        setPagination({
          page: response.currentPage,
          totalPages: response.totalPages,
          total: response.totalItems,
          limit: 10,
          hasNext: response.currentPage < response.totalPages,
          hasPrev: response.currentPage > 1,
        })
      } catch (error: any) {
        console.error('Erreur chargement matières premières:', error)
        toast({
          title: "Erreur de chargement",
          description: error.response?.data?.message || "Impossible de charger la liste des matières premières.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMatieres()
  }, [toast, currentPage])

  // Filtrer les matières premières
  const filteredMatieres = matieres.filter((matiere) =>
    matiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (matiere.categorie && matiere.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Supprimer une matière première
  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette matière première ?")) return

    try {
      await matierePremiereService.deleteMatierePremiere(id)
      setMatieres(matieres.filter((m) => m.id !== id))
      toast({
        title: "Succès",
        description: "Matière première supprimée avec succès",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de supprimer la matière première",
        variant: "destructive",
      })
    }
  }

  // Déterminer le badge de stock
  const getStockBadge = (quantite: number) => {
    if (quantite === 0) {
      return <Badge variant="destructive">Rupture</Badge>
    } else if (quantite <= 10) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Stock faible</Badge>
    }
    return <Badge variant="default" className="bg-green-600">En stock</Badge>
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {/* Cartes de statistiques */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Matières</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Nombre total de types de matières premières</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valeur du stock</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.totalStockValue || 0).toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">Valeur totale estimée du stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats?.lowStock || 0}</div>
                <p className="text-xs text-muted-foreground">Matières avec un stock inférieur à 10 unités</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Matières Premières</CardTitle>
                  <CardDescription>
                    Gérez les matières premières utilisées dans la production
                  </CardDescription>
                </div>
                <PermissionGuard permission="matiere_premiere.create">
                  <Button asChild>
                    <Link href="/magasinier/matieres-premieres/nouveau">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle matière première
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
                    placeholder="Rechercher une matière première..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredMatieres.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune matière première trouvée
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMatieres.map((matiere) => (
                        <TableRow key={matiere.id}>
                          <TableCell className="font-medium">{matiere.nom}</TableCell>
                          <TableCell>{matiere.categorie || "-"}</TableCell>
                          <TableCell className="text-right">
                            <span className={matiere.quantiteStock <= 10 ? "text-orange-500 font-semibold" : ""}>
                              {matiere.quantiteStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{getStockBadge(matiere.quantiteStock)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission("matiere_premiere.read") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/magasinier/matieres-premieres/${matiere.id}`}>
                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                    Voir
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("matiere_premiere.update") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/magasinier/matieres-premieres/${matiere.id}/modifier`}>
                                    <PenLine className="mr-1 h-3.5 w-3.5" />
                                    Modifier
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("matiere_premiere.delete") && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(matiere.id)}>
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
