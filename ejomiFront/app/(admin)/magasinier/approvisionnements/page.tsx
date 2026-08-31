"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, Eye, Edit, Trash2, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AppSelect } from "@/components/ui/app-select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { Footer } from "@/components/layout/footer"
import { approvisionnementService, fournisseurService } from "@/services"
import type { Approvisionnement } from "@/types/approvisionnement"
import type { Fournisseur } from "@/types/fournisseur"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function ApprovisionnementListPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [approvisionnements, setApprovisionnements] = useState<Approvisionnement[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("")
  const [fournisseurFilter, setFournisseurFilter] = useState<string>("tous")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const { hasPermission } = usePermissions()

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [approvsRes, fournisseursRes] = await Promise.all([
          approvisionnementService.getAll(),
          fournisseurService.getAll(),
        ])
        const approvsPayload = approvsRes.data
        setApprovisionnements(Array.isArray(approvsPayload) ? approvsPayload : (approvsPayload?.data || []))

        const fournisseursData = (fournisseursRes.data as any)
        setFournisseurs(Array.isArray(fournisseursData) ? fournisseursData : (fournisseursData?.data || []))
      } catch (error: any) {
        toast({
          title: "Erreur de chargement",
          description:
            error.response?.data?.message ||
            "Impossible de charger les approvisionnements. Veuillez réessayer plus tard.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toast])

  // Fonction pour obtenir le nom du fournisseur
  const getFournisseurName = (id: number | string) => {
    const fournisseur = fournisseurs.find((f) => f.id === Number(id))
    return fournisseur ? `${fournisseur.prenom} ${fournisseur.nom}` : "Inconnu"
  }

  const filteredApprovisionnements = approvisionnements.filter((app) => {
    // Filtre de recherche
    const searchMatch =
      app.id.toString().includes(searchTerm) ||
      getFournisseurName(app.fournisseurId).toLowerCase().includes(searchTerm.toLowerCase())

    // Filtre de fournisseur
    const fournisseurMatch = fournisseurFilter === "tous" || app.fournisseurId.toString() === fournisseurFilter

    return searchMatch && fournisseurMatch
  })

  const totalPages = Math.ceil(filteredApprovisionnements.length / itemsPerPage)
  const paginatedApprovisionnements = filteredApprovisionnements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const pagination: PaginationInfo | null = filteredApprovisionnements.length > itemsPerPage ? {
    page: currentPage,
    totalPages,
    total: filteredApprovisionnements.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet approvisionnement ? Le stock sera réduit en conséquence.")) {
      return
    }

    try {
      await approvisionnementService.delete(id)
      setApprovisionnements((prev) => prev.filter((app) => app.id !== id))
      toast({
        title: "Approvisionnement supprimé",
        description: "L'approvisionnement a été supprimé avec succès",
      })
    } catch (error: any) {
      toast({
        title: "Erreur lors de la suppression",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Approvisionnements</h1>
            <PermissionGuard permission="approvisionnement.create">
              <Button asChild>
                <Link href="/magasinier/approvisionnements/nouveau">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel approvisionnement
                </Link>
              </Button>
            </PermissionGuard>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des approvisionnements</CardTitle>
              <CardDescription>Consultez et gérez tous les approvisionnements de produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="mr-2 h-4 w-4" />
                          Filtres
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <div className="p-2">
                          <p className="text-sm font-medium mb-1">Fournisseur</p>
                          <AppSelect
                            placeholder="Tous les fournisseurs"
                            value={fournisseurFilter === "tous" ? { value: "tous", label: "Tous les fournisseurs" } : fournisseurs.find(f => f.id.toString() === fournisseurFilter) ? { value: fournisseurFilter, label: `${fournisseurs.find(f => f.id.toString() === fournisseurFilter)!.prenom} ${fournisseurs.find(f => f.id.toString() === fournisseurFilter)!.nom}` } : null}
                            onChange={(opt: any) => setFournisseurFilter(opt?.value ?? "tous")}
                            options={[
                              { value: "tous", label: "Tous les fournisseurs" },
                              ...fournisseurs.map(f => ({ value: f.id.toString(), label: `${f.prenom} ${f.nom}` })),
                            ]}
                          />
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("")
                        setFournisseurFilter("tous")
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-center">Produits</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApprovisionnements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Aucun approvisionnement trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedApprovisionnements.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>{new Date(app.dateApprovisionnement).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>{getFournisseurName(app.fournisseurId)}</TableCell>
                          <TableCell className="text-center">{app.lignes?.length || 0}</TableCell>
                          <TableCell className="text-right">{app.montant.toFixed(2)} FCFA</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {hasPermission("approvisionnement.read") && (
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/magasinier/approvisionnements/${app.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Voir</span>
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("approvisionnement.update") && (
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/magasinier/approvisionnements/${app.id}/modifier`}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Modifier</span>
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("approvisionnement.delete") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(Number(app.id))}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Supprimer</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

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
      <Footer />
    </div>
  )
}
