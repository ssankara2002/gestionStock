"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Eye, Edit, Trash2, FileText } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Footer } from "@/components/layout/footer"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { commandesService } from "@/services/commande-service"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { useToast } from "@/hooks/use-toast"
import type { Commande } from "@/types"

export default function CommandesPage() {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commandeToDelete, setCommandeToDelete] = useState<Commande | null>(null)
  const itemsPerPage = 5

  const { data: commandesData, isLoading: loadingCommandes } = useQuery({
    queryKey: ['commandes'],
    queryFn: async () => {
      const response = await commandesService.getAll()
      const payload = response.data
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.data)) return payload.data
      return []
    },
  })

  const allCommandes: Commande[] = commandesData || []

  const filteredCommandes = allCommandes.filter((commande) =>
    commande.id.toString().includes(searchTerm) ||
    (commande.client &&
      `${commande.client.prenom} ${commande.client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalCommandes = filteredCommandes.length
  const totalPages = Math.ceil(totalCommandes / itemsPerPage)
  const paginatedCommandes = filteredCommandes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const pagination: PaginationInfo | null = totalCommandes > itemsPerPage ? {
    page: currentPage,
    totalPages,
    total: totalCommandes,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  const handleDelete = async () => {
    if (!commandeToDelete) return
    await commandesService.delete(commandeToDelete.id.toString())
    queryClient.invalidateQueries({ queryKey: ['commandes'] })
  }

  const telechargerFacture = async (commandeId: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/commandes/facture?id=${commandeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `facture-commande-${commandeId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      if (a.parentNode === document.body) document.body.removeChild(a)
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger la facture", variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <main className="flex-1 w-full">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="font-playfair text-2xl sm:text-3xl font-bold md:text-4xl">Gestion des Ventes</h1>
              <p className="mt-1 text-muted-foreground">Consultez, créez et gérez les ventes clients</p>
            </div>
            <div className="flex items-center gap-4">
              <PermissionGuard permission="commande.create">
                <Button asChild className="btn-gold">
                  <Link href="/vendeur/commandes/nouvelle">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle vente
                  </Link>
                </Button>
              </PermissionGuard>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une vente..."
                className="pl-9 max-w-md"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCommandes ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Chargement des ventes...
                    </TableCell>
                  </TableRow>
                ) : paginatedCommandes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Aucune vente trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCommandes.map((commande) => (
                    <TableRow key={commande.id}>
                      <TableCell>
                        {format(new Date(commande.dateCommande), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {commande.client ? `${commande.client.prenom} ${commande.client.nom}` : "Client inconnu"}
                      </TableCell>
                      <TableCell>
                        {commande.vendeur?.user?.prenom} {commande.vendeur?.user?.nom || "Vendeur inconnu"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {commande.montant.toFixed(2)} FR CFA
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission("commande.read") && (
                            <Button asChild variant="ghost" size="icon" title="Voir les détails">
                              <Link href={`/vendeur/commandes/${commande.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <PermissionGuard permission="commande.update">
                            <Button asChild variant="ghost" size="icon" title="Modifier la vente">
                              <Link href={`/vendeur/commandes/${commande.id}/modifier`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </PermissionGuard>
                          <Button variant="ghost" size="icon" title="Télécharger la facture" onClick={() => telechargerFacture(commande.id)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <PermissionGuard permission="commande.delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Supprimer la vente"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { setCommandeToDelete(commande); setDeleteDialogOpen(true) }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && (
            <div className="mt-4">
              <DataPagination
                pagination={pagination}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setCommandeToDelete(null) }}
        onConfirm={handleDelete}
        title="Supprimer la vente"
        description="Cette action est irréversible. Le stock des produits sera restauré."
        entityName={`La vente #${commandeToDelete?.id}`}
      />
    </div>
  )
}
