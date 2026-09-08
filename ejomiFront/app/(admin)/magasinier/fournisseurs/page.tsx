"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, PenLine, Plus, Search, Trash2, X } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Footer } from "@/components/layout/footer"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { fournisseurService } from "@/services"
import type { Fournisseur } from "@/types/fournisseur"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"

export default function FournisseursPage() {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const queryClient = useQueryClient()
  const itemsPerPage = 5
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading: loading } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: async () => {
      const response = await fournisseurService.getAll()
      const responseData = response.data
      return Array.isArray(responseData) ? responseData : (responseData.data || [])
    },
  })

  const allFournisseurs: Fournisseur[] = data || []

  const filteredFournisseurs = allFournisseurs.filter(
    (fournisseur) =>
      fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fournisseur.email && fournisseur.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fournisseur.tel && fournisseur.tel.includes(searchTerm)),
  )

  const totalPages = Math.ceil(filteredFournisseurs.length / itemsPerPage)
  const paginatedFournisseurs = filteredFournisseurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const pagination: PaginationInfo | null = filteredFournisseurs.length > itemsPerPage ? {
    page: currentPage,
    totalPages,
    total: filteredFournisseurs.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ?")) return

    try {
      await fournisseurService.delete(id)
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
      toast({
        title: "Fournisseur supprimé",
        description: "Le fournisseur a été supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fournisseur",
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
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fournisseurs</h1>
            <PermissionGuard permission="fournisseur.create">
              <Button asChild>
                <Link href="/magasinier/fournisseurs/nouveau">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau fournisseur
                </Link>
              </Button>
            </PermissionGuard>
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Liste des fournisseurs</CardTitle>
              <CardDescription>
                Gérez vos fournisseurs et consultez leur historique d'approvisionnements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher un fournisseur..."
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

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFournisseurs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Aucun fournisseur trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedFournisseurs.map((fournisseur) => (
                        <TableRow key={fournisseur.id}>
                          <TableCell className="font-medium">
                            {fournisseur.prenom} {fournisseur.nom}
                          </TableCell>
                          <TableCell>{fournisseur.email || "-"}</TableCell>
                          <TableCell>{fournisseur.tel}</TableCell>
                          <TableCell>{fournisseur.adresse}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission("fournisseur.read") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/magasinier/fournisseurs/${fournisseur.id}`}>
                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                    Voir
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("fournisseur.update") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/magasinier/fournisseurs/${fournisseur.id}/modifier`}>
                                    <PenLine className="mr-1 h-3.5 w-3.5" />
                                    Modifier
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("fournisseur.delete") && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(fournisseur.id)}>
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
