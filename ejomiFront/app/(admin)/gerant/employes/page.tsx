"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Download, Eye, Filter, PenLine, Plus, Search, Trash2, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/layout/footer"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { employesService } from "@/services"
import { Employe } from "@/types"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { useToast } from "@/hooks/use-toast"

export default function EmployesPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Use React Query for caching
  const itemsPerPage = 5

  const { data: responseData, isLoading: loading, error } = useQuery({
    queryKey: ['employes'],
    queryFn: async () => {
      const response = await employesService.getAll()
      const payload = response.data
      return Array.isArray(payload) ? payload : (payload?.data || [])
    },
  })

  const allEmployes: Employe[] = responseData || []

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await employesService.delete(id.toString())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'employé",
        variant: "destructive",
      })
    },
  })

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      deleteMutation.mutate(id)
    }
  }

  const filteredEmployes = allEmployes.filter((employe) => {
    const matchesSearch =
      employe.userId.toString().includes(searchTerm) ||
      employe.id.toString().includes(searchTerm) ||
      employe.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employe.user?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employe.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employe.user?.tel?.includes(searchTerm)

    return matchesSearch
  })

  const totalPages = Math.ceil(filteredEmployes.length / itemsPerPage)
  const paginatedEmployes = filteredEmployes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const pagination: PaginationInfo | null = filteredEmployes.length > itemsPerPage ? {
    page: currentPage,
    totalPages,
    total: filteredEmployes.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  if (loading) return <div className="flex justify-center p-8">Chargement...</div>
  if (error) return <div className="flex justify-center p-8 text-red-500">Erreur lors du chargement des employés</div>

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Employés</h1>
            <PermissionGuard permission="employe.create">
              <Button asChild>
                <Link href="/gerant/employes/nouveau">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel employé
                </Link>
              </Button>
            </PermissionGuard>
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Liste des employés</CardTitle>
              <CardDescription>Gérez les employés de votre entreprise et leurs accès.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher un employé..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Effacer la recherche</span>
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <PermissionGuard permission="employe.export">
                    <Button variant="outline" size="sm" className="h-9">
                      <Download className="mr-2 h-4 w-4" />
                      Exporter
                    </Button>
                  </PermissionGuard>
                </div>
              </div>


              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom complet</TableHead>
                      <TableHead>Email</TableHead>
                                            <TableHead>Telephone</TableHead>

                      <TableHead>Rôle</TableHead>
                      <TableHead>Salaire</TableHead>
                      <TableHead>Date d'embauche</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Aucun employé trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEmployes.map((employe) => (
                        <TableRow key={employe.id}>
                          <TableCell className="font-medium">
                            {employe.user ? `${employe.user.prenom} ${employe.user.nom}` : `Utilisateur ${employe.userId}`}
                          </TableCell>
                          <TableCell>{employe.user?.email || "N/A"}</TableCell>
                          <TableCell>{employe.user?.tel || "N/A"}</TableCell>
                          <TableCell>{employe.user?.role?.name || "Aucun rôle"}</TableCell>
                          <TableCell>{employe.salaire.toLocaleString()} FCFA</TableCell>
                          <TableCell>{new Date(employe.dateEmbauche).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission("employe.read") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/gerant/employes/${employe.id}`}>
                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                    Voir
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("employe.update") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/gerant/employes/${employe.id}/modifier`}>
                                    <PenLine className="mr-1 h-3.5 w-3.5" />
                                    Modifier
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("employe.delete") && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(employe.id)}>
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  Supprimer
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
