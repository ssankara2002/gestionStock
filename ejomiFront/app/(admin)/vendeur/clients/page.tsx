"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, PenLine, Plus, Search, Trash2, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Footer } from "@/components/layout/footer"
import { useToast } from "@/hooks/use-toast"
import { clientService } from "@/services"
import type { Client } from "@/services/client-service"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function ClientsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { hasPermission } = usePermissions()

  // Use React Query for caching
  const itemsPerPage = 5

  const { data, isLoading: loading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientService.getAll()
      const payload = response.data
      return Array.isArray(payload) ? payload : (payload?.data || [])
    },
  })

  const clients: Client[] = data || []

  const filteredClients = clients.filter((client) =>
    (client.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((client.email || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((client.tel || '').includes(searchTerm))
  )

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const pagination = filteredClients.length > itemsPerPage ? {
    page: currentPage,
    totalPages,
    total: filteredClients.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  // Fonction pour supprimer un client
  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce client ?")) return

    try {
      await clientService.delete(id)
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès",
      })
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Impossible de supprimer le client."
      toast({
        title: "Suppression impossible",
        description: message,
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
    <div className="flex flex-col min-h-screen w-full">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clients</h1>
            <PermissionGuard permission="user.create">
              <Button asChild>
                <Link href="/vendeur/clients/nouveau">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau client
                </Link>
              </Button>
            </PermissionGuard>
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Liste des clients</CardTitle>
              <CardDescription>Gérez vos clients et consultez leur historique d'achats.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher un client..."
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
                    {paginatedClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Aucun client trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.prenom} {client.nom}
                          </TableCell>
                          <TableCell>{client.email || "-"}</TableCell>
                          <TableCell>{client.tel || "-"}</TableCell>
                          <TableCell>{client.adresse || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission("user.read") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/vendeur/clients/${client.id}`}>
                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                    Voir
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("user.update") && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/vendeur/clients/${client.id}/modifier`}>
                                    <PenLine className="mr-1 h-3.5 w-3.5" />
                                    Modifier
                                  </Link>
                                </Button>
                              )}
                              {hasPermission("user.delete") && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(client.id)}
                                >
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
