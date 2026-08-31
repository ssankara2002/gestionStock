"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, Search, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AppSelect } from "@/components/ui/app-select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FormulaireSalaire } from "@/components/employes/formulaire-salaire"
import { BulletinSalaire } from "@/components/employes/bulletin-salaire"
import { salairePaiementService } from "@/services/salaire-paiement-service"
import { employesService as employeService } from "@/services"
import type { SalairePaiement } from "@/types/salairePaiement"
import type { Employe } from "@/types/employe"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { DataPagination } from "@/components/shared/data-pagination"

export default function PaiementsSalairesPage() {
  const [paiements, setPaiements] = useState<SalairePaiement[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmploye, setSelectedEmploye] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulletinDialogOpen, setBulletinDialogOpen] = useState(false)
  const [selectedPaiement, setSelectedPaiement] = useState<SalairePaiement | null>(null)
  const { hasPermission } = usePermissions()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [paiementsRes, employesRes] = await Promise.all([
        salairePaiementService.getAll(), // Ce service ne semble pas paginé
        employeService.getAll(1, 1000), // L'API employés est paginée, on charge tout pour le filtre
      ])
      // Les services retournent la réponse Axios complète
      setPaiements(paiementsRes.data.data || paiementsRes.data || [])
      // La réponse des employés est paginée, on prend `data.data`
      setEmployes(employesRes.data.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaiementCreated = async () => {
    try {
      await loadData()
      setDialogOpen(false)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      try {
        await salairePaiementService.delete(id)
        await loadData()
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
      }
    }
  }

  const handleViewBulletin = (paiement: SalairePaiement) => {
    setSelectedPaiement(paiement)
    setBulletinDialogOpen(true)
  }

  const handleDownloadBulletin = async (paiementId: string | number) => {
    try {
      const response = await salairePaiementService.downloadBulletinPaie(paiementId)

      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)

      // Créer un lien temporaire et déclencher le téléchargement
      const link = document.createElement('a')
      link.href = url
      link.download = `bulletin-paie-${paiementId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Nettoyer
    } catch (error) {
      console.error('Erreur lors du téléchargement du bulletin:', error)
      alert('Erreur lors du téléchargement du bulletin de paie')
    }
  }

  const filteredPaiements = paiements.filter((paiement) => {
    const matchesSearch =
      paiement.employe?.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paiement.employe?.user?.prenom?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmploye = selectedEmploye === "all" || paiement.employeId === Number.parseInt(selectedEmploye)
    return matchesSearch && matchesEmploye
  })

  const totalPaiementsPages = Math.ceil(filteredPaiements.length / itemsPerPage)
  const paginatedPaiements = filteredPaiements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const paginationPaiements = filteredPaiements.length > 0 ? {
    page: currentPage,
    totalPages: totalPaiementsPages,
    total: filteredPaiements.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPaiementsPages,
    hasPrev: currentPage > 1,
  } : null

  const totalPaiements = filteredPaiements.reduce((sum, p) => sum + Number(p.montant), 0)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const paiementsMoisActuel = filteredPaiements.filter((p) => {
    const date = new Date(p.datePaiement)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const totalMoisActuel = paiementsMoisActuel.reduce((sum, p) => sum + Number(p.montant), 0)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paiements de Salaires</h1>
          <p className="text-muted-foreground">Gérez les paiements de salaires de tous les employés</p>
        </div>
        <PermissionGuard permission="salaire_paiement.create">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Paiement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau Paiement de Salaire</DialogTitle>
              </DialogHeader>
              <FormulaireSalaire employes={employes} onPaiementCreated={handlePaiementCreated} />
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paiements</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPaiements.length}</div>
            <p className="text-xs text-muted-foreground">Tous les paiements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaiements.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">Tous les paiements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paiementsMoisActuel.length}</div>
            <p className="text-xs text-muted-foreground">Paiements du mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Mois</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalMoisActuel.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">Total du mois</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom d'employé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <AppSelect
              className="w-[200px]"
              placeholder="Tous les employés"
              value={selectedEmploye === "all" ? { value: "all", label: "Tous les employés" } : { value: selectedEmploye, label: employes.find(e => e.id.toString() === selectedEmploye) ? `${employes.find(e => e.id.toString() === selectedEmploye)!.user?.prenom} ${employes.find(e => e.id.toString() === selectedEmploye)!.user?.nom}` : selectedEmploye }}
              onChange={(opt: any) => setSelectedEmploye(opt?.value ?? "all")}
              options={[
                { value: "all", label: "Tous les employés" },
                ...employes.map(e => ({ value: e.id.toString(), label: `${e.user?.prenom} ${e.user?.nom}` })),
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredPaiements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun paiement trouvé</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Date Paiement</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Mode de Paiement</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPaiements.map((paiement) => (
                  <TableRow key={paiement.id}>
                    <TableCell className="font-medium">
                      {paiement.employe?.user?.prenom} {paiement.employe?.user?.nom}
                    </TableCell>
                    <TableCell>{format(new Date(paiement.datePaiement), "dd MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">{Number(paiement.montant).toLocaleString()} FCFA</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paiement.modePaiement}</Badge>
                    </TableCell>
                    <TableCell>
                      {paiement.periode ? format(new Date(paiement.periode), "MMMM yyyy", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewBulletin(paiement)}>
                          Voir
                        </Button>
                        <PermissionGuard permission="salaire_paiement.export">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadBulletin(paiement.id)}>
                            <Download className="h-4 w-4 mr-1" />
                            PDF A5
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="salaire_paiement.delete">
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(paiement.id)}>
                            Supprimer
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {paginationPaiements && (
            <DataPagination
              pagination={paginationPaiements}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={bulletinDialogOpen} onOpenChange={setBulletinDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulletin de Salaire</DialogTitle>
          </DialogHeader>
          {selectedPaiement && (
            <BulletinSalaire
              paiement={selectedPaiement}
              employeNom={selectedPaiement.employe?.user?.nom || ""}
              employePrenom={selectedPaiement.employe?.user?.prenom || ""}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
