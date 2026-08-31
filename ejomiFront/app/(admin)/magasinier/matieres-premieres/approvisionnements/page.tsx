"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, Eye, Edit, Trash2, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { approvisionnementMatierePremiereService } from "@/services/approvisionnement-matiere-premiere-service"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { PermissionGuard } from "@/components/permissions"

interface Approvisionnement {
  id: number;
  dateApprovisionnement: string;
  montant: number;
  fournisseur: { nom: string; prenom: string };
  employe: { user: { nom: string; prenom: string } };
  lignes: { quantite: number }[];
}

export default function ApprovisionnementListPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [approvisionnements, setApprovisionnements] = useState<Approvisionnement[]>([])
  const [loading, setLoading] = useState(true)

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const approvsRes = await approvisionnementMatierePremiereService.getAll(currentPage)
        setApprovisionnements(approvsRes.data || [])
        setPagination({
          page: approvsRes.currentPage,
          totalPages: approvsRes.totalPages,
          total: approvsRes.totalItems,
          limit: 10,
          hasNext: approvsRes.currentPage < approvsRes.totalPages,
          hasPrev: approvsRes.currentPage > 1,
        })
      } catch (error: any) {
        toast({
          title: "Erreur de chargement",
          description: error.response?.data?.message || "Impossible de charger les approvisionnements.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentPage, toast])

  // Filtrer les approvisionnements
  const filteredApprovisionnements = approvisionnements.filter(
    (item) =>
      item.id.toString().includes(searchTerm) ||
      `${item.fournisseur.prenom} ${item.fournisseur.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'approvisionnement #${id} ? Cette action restaurera le stock.`)) return

    try {
      await approvisionnementMatierePremiereService.deleteById(id)
      toast({
        title: "Succès",
        description: "L'approvisionnement a été supprimé et le stock a été restauré.",
      })
      // Recharger les données pour refléter la suppression
      setApprovisionnements(prev => prev.filter(app => app.id !== id));
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de supprimer l'approvisionnement.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Approvisionnements de Matières Premières</CardTitle>
              <CardDescription>
                Historique des entrées en stock des matières premières.
              </CardDescription>
            </div>
            <PermissionGuard permission="approvisionnement_matiere_premiere.create">
              <Button asChild>
                <Link href="/magasinier/matieres-premieres/approvisionnements/nouveau">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau
                </Link>
              </Button>
            </PermissionGuard>

          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par fournisseur..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredApprovisionnements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun approvisionnement trouvé.</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead className="text-right">Nb. Articles</TableHead>
                    <TableHead className="text-right">Montant Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovisionnements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.dateApprovisionnement).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-medium">{`${item.fournisseur.prenom} ${item.fournisseur.nom}`}</TableCell>
                      <TableCell>{`${item.employe.user.prenom} ${item.employe.user.nom}`}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">{item.lignes.reduce((sum, l) => sum + l.quantite, 0)}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{item.montant.toFixed(2)} FCFA</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <PermissionGuard permission="approvisionnement_matiere_premiere.read">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/magasinier/matieres-premieres/approvisionnements/${item.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir</span>
                              </Link>
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="approvisionnement_matiere_premiere.update">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/magasinier/matieres-premieres/approvisionnements/${item.id}/modifier`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Link>
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="approvisionnement_matiere_premiere.delete">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </PermissionGuard>
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
    </div>
  )
}