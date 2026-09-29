"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Eye, Edit, Trash2, FileText, Banknote, Receipt, ShoppingBag } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Footer } from "@/components/layout/footer"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { commandesService } from "@/services/commande-service"
import { avoirService } from "@/services"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { useToast } from "@/hooks/use-toast"
import type { Commande } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const STATUT_LABEL: Record<string, { label: string; color: string }> = {
  EN_COURS:       { label: "En cours",    color: "bg-yellow-100 text-yellow-700" },
  PAYE:           { label: "Payé",        color: "bg-green-100 text-green-700" },
  EN_ATTENTE:     { label: "En attente",  color: "bg-yellow-100 text-yellow-700" },
  CONFIRMEE:      { label: "Confirmée",   color: "bg-blue-100 text-blue-700" },
  EN_PREPARATION: { label: "En prépa.",   color: "bg-orange-100 text-orange-700" },
  PRETE:          { label: "Prête",       color: "bg-teal-100 text-teal-700" },
  LIVREE:         { label: "Livrée",      color: "bg-green-100 text-green-700" },
  ANNULEE:        { label: "Annulée",     color: "bg-red-100 text-red-700" },
}

function EncaisserModal({ commande, onClose }: { commande: Commande; onClose: () => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const montantTotal = Number(commande.montant)
  const [montantPaye, setMontantPaye] = useState(String(montantTotal))
  const [modePaiement, setModePaiement] = useState("ESPECES")
  const [creditUtilise, setCreditUtilise] = useState("0")

  // Crédit dispo du client
  const { data: creditData } = useQuery({
    queryKey: ["client-credit", (commande as any).clientId],
    queryFn: async () => {
      const res = await avoirService.getClientCredit(String((commande as any).clientId))
      return (res as any).data?.data?.creditDisponible ?? 0
    },
    enabled: !!(commande as any).clientId,
  })
  const creditDispo = Number(creditData || 0)

  const creditNum = Math.min(Number(creditUtilise) || 0, creditDispo, montantTotal)
  const resteAPayer = Math.max(0, montantTotal - creditNum)

  const mutation = useMutation({
    mutationFn: () => commandesService.payer(String(commande.id), {
      montantPaye: Number(montantPaye),
      modePaiement,
      creditUtilise: creditNum,
    }),
    onSuccess: async (res: any) => {
      await queryClient.invalidateQueries({ queryKey: ["commandes"] })
      toast({ title: "Payé", description: "Commande encaissée. Téléchargement du reçu..." })
      // Télécharger le reçu
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      const token = localStorage.getItem("token")
      const r = await fetch(`${API_URL}/commandes/recu?id=${commande.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const blob = await r.blob()
        window.open(window.URL.createObjectURL(blob), "_blank")
      }
      onClose()
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.response?.data?.message, variant: "destructive" }),
  })

  const handlePayer = () => {
    mutation.mutate()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            Encaisser la commande
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{(commande as any).client?.prenom} {(commande as any).client?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CMD</span>
              <span className="font-mono">CMD-{String(commande.id).padStart(5, "0")}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
              <span>Total à payer</span>
              <span>{montantTotal.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>

          {creditDispo > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-teal-600" />
                Crédit disponible : <span className="font-bold text-teal-600">{creditDispo.toLocaleString("fr-FR")} FCFA</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={Math.min(creditDispo, montantTotal)}
                  value={creditUtilise}
                  onChange={e => {
                    setCreditUtilise(e.target.value)
                    const c = Math.min(Number(e.target.value) || 0, creditDispo, montantTotal)
                    setMontantPaye(String(Math.max(0, montantTotal - c)))
                  }}
                  className="text-right"
                />
                <span className="text-muted-foreground shrink-0">FCFA de crédit</span>
              </div>
              <Button variant="outline" size="sm" className="w-full text-teal-700 border-teal-300"
                onClick={() => {
                  const c = Math.min(creditDispo, montantTotal)
                  setCreditUtilise(String(c))
                  setMontantPaye(String(Math.max(0, montantTotal - c)))
                }}>
                Utiliser tout le crédit ({Math.min(creditDispo, montantTotal).toLocaleString("fr-FR")} FCFA)
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Montant reçu en espèces</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={montantPaye}
                onChange={e => setMontantPaye(e.target.value)}
                className="text-right"
              />
              <Button type="button" variant="outline" className="shrink-0"
                onClick={() => setMontantPaye(String(resteAPayer))}>
                Tout
              </Button>
              <span className="text-muted-foreground shrink-0">FCFA</span>
            </div>
            {(() => {
              const reste = resteAPayer - (Number(montantPaye) || 0)
              return reste > 0 ? (
                <p className="text-sm font-semibold text-red-600">
                  Reste dû : {reste.toLocaleString("fr-FR")} FCFA
                </p>
              ) : null
            })()}
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <select
              value={modePaiement}
              onChange={e => setModePaiement(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="ESPECES">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARTE">Carte</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>

          {creditNum > 0 && (
            <div className="p-3 rounded-lg bg-green-50 text-sm space-y-1">
              <div className="flex justify-between text-teal-700">
                <span>Crédit utilisé</span>
                <span>- {creditNum.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between font-bold text-green-700 border-t pt-1">
                <span>Reste en espèces</span>
                <span>{resteAPayer.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handlePayer} disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
            {mutation.isPending ? "Encaissement..." : "Encaisser et imprimer reçu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CommandesPage() {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commandeToDelete, setCommandeToDelete] = useState<Commande | null>(null)
  const [commandeToEncaisser, setCommandeToEncaisser] = useState<Commande | null>(null)
  const itemsPerPage = 20

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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/commandes/facture?id=${commandeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      window.open(window.URL.createObjectURL(blob), '_blank')
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger la facture", variant: "destructive" })
    }
  }

  const telechargerRecu = async (commandeId: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/commandes/recu?id=${commandeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      window.open(window.URL.createObjectURL(blob), '_blank')
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger le reçu", variant: "destructive" })
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
                  <TableHead>N°</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Vendeur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCommandes ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Chargement des ventes...</TableCell>
                  </TableRow>
                ) : paginatedCommandes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Aucune vente trouvée</TableCell>
                  </TableRow>
                ) : (
                  paginatedCommandes.map((commande) => {
                    const statut = STATUT_LABEL[(commande as any).statut] || { label: (commande as any).statut, color: "bg-gray-100 text-gray-700" }
                    const estEnCours = (commande as any).statut === "EN_COURS"
                    const estPaye = (commande as any).statut === "PAYE"
                    return (
                      <TableRow key={commande.id}>
                        <TableCell className="font-mono text-sm">CMD-{String(commande.id).padStart(5, "0")}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(commande.dateCommande), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {commande.client ? `${commande.client.prenom} ${commande.client.nom}` : "Client inconnu"}
                          </span>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {commande.vendeur?.user?.prenom} {commande.vendeur?.user?.nom}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {commande.vendeur?.user?.prenom} {commande.vendeur?.user?.nom || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statut.color}`}>
                            {statut.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {Number(commande.montant).toLocaleString("fr-FR")} FCFA
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">

                            {/* EN COURS : Facture + Encaisser */}
                            {estEnCours && (
                              <>
                                <Button variant="outline" size="sm" className="h-8 gap-1" title="Facture" onClick={() => telechargerFacture(commande.id)}>
                                  <FileText className="h-4 w-4" />Facture
                                </Button>
                                <PermissionGuard permission="commande.create">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 gap-1"
                                    onClick={() => setCommandeToEncaisser(commande)}>
                                    <Banknote className="h-4 w-4" />Encaisser
                                  </Button>
                                </PermissionGuard>
                              </>
                            )}

                            {/* PAYÉ : Reçu uniquement */}
                            {estPaye && (
                              <Button variant="outline" size="sm" className="h-8 gap-1 text-green-700 border-green-300" title="Reçu" onClick={() => telechargerRecu(commande.id)}>
                                <Receipt className="h-4 w-4" />Reçu
                              </Button>
                            )}

                            {/* Autres statuts : facture */}
                            {!estEnCours && !estPaye && (
                              <Button variant="ghost" size="icon" title="Facture" onClick={() => telechargerFacture(commande.id)}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}

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
                            <PermissionGuard permission="commande.delete">
                              <Button
                                variant="ghost" size="icon" title="Supprimer la vente"
                                className="text-destructive hover:text-destructive"
                                onClick={() => { setCommandeToDelete(commande); setDeleteDialogOpen(true) }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
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

      {commandeToEncaisser && (
        <EncaisserModal
          commande={commandeToEncaisser}
          onClose={() => setCommandeToEncaisser(null)}
        />
      )}

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
