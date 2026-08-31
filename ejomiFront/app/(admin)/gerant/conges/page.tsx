"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Search, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AppSelect } from "@/components/ui/app-select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FormulaireConge } from "@/components/employes/formulaire-conge"
import { congeService, employesService as employeService } from "@/services"
import type { Conge, CreateCongeDto, CongeStatut } from "@/types/conge"
import { useToast } from "@/hooks/use-toast"
import type { Employe } from "@/types/employe"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CongeUpdateData } from "@/types/conge"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { DataPagination } from "@/components/shared/data-pagination"

export default function CongesPage() {
  const [conges, setConges] = useState<Conge[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmploye, setSelectedEmploye] = useState<string>("all")
  const [selectedStatut, setSelectedStatut] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConge, setEditingConge] = useState<Conge | null>(null)
  const [viewingConge, setViewingConge] = useState<Conge | null>(null)
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // L'API pour les employés est paginée, on demande une page avec une grande limite.
      // L'API pour les congés n'est pas (encore) paginée.
      const [congesResponse, employesResponse] = await Promise.all([
        congeService.getAll(),
        employeService.getAll(1, 1000), // page 1, limit 1000
      ])
      
      // Les deux services retournent une réponse Axios. Les données sont dans `response.data.data`.
      // La réponse peut être `response.data` ou `response.data.data` selon si l'API pagine ou non.
      setConges(congesResponse.data.data || congesResponse.data || [])
      setEmployes(employesResponse.data.data || employesResponse.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCongeSubmit = async (data: CreateCongeDto | CongeUpdateData) => {
    try {
      if (editingConge) {
        await congeService.update(editingConge.id, data)
        toast({
          title: "Succès",
          description: "La demande de congé a été modifiée avec succès.",
        })
      } else {
        await congeService.create(data as CreateCongeDto)
        toast({
          title: "Succès",
          description: "La demande de congé a été créée avec succès.",
        })
      }
      await loadData()
      setDialogOpen(false)
      setEditingConge(null)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await congeService.approuver(id)
      await loadData()
      toast({
        title: "Succès",
        description: "Le congé a été approuvé.",
      })
    } catch (error) {
      console.error("Erreur lors de l'approbation du congé:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le congé.",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: number) => {
    try {
      await congeService.refuser(id)
      await loadData()
      toast({
        title: "Succès",
        description: "Le congé a été refusé.",
      })
    } catch (error) {
      console.error("Erreur lors du refus du congé:", error)
      toast({
        title: "Erreur",
        description: "Impossible de refuser le congé.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce congé ?")) {
      try {
        await congeService.delete(id.toString())
        await loadData()
        toast({
          title: "Succès",
          description: "Le congé a été supprimé.",
        })
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le congé.",
          variant: "destructive",
        })
      }
    }
  }

  const handleEdit = (conge: Conge) => {
    setEditingConge(conge)
    setDialogOpen(true)
  }

  const handleView = (conge: Conge) => {
    setViewingConge(conge)
  }

  const filteredConges = conges.filter((conge) => {
    const matchesSearch =
      conge.employe?.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conge.employe?.user?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conge.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmploye = selectedEmploye === "all" || conge.employeId === Number.parseInt(selectedEmploye)
    const matchesStatut = selectedStatut === "all" || conge.statut === selectedStatut
    return matchesSearch && matchesEmploye && matchesStatut
  })

  const totalCongesPages = Math.ceil(filteredConges.length / itemsPerPage)
  const paginatedConges = filteredConges.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const paginationConges = filteredConges.length > 0 ? {
    page: currentPage,
    totalPages: totalCongesPages,
    total: filteredConges.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalCongesPages,
    hasPrev: currentPage > 1,
  } : null

  const calculateDuration = (dateDebut: Date, dateFin: Date) => {
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    const diffTime = Math.abs(fin.getTime() - debut.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1
  }

  const getStatutBadge = (statut: CongeStatut) => {
    switch (statut) {
      case "APPROUVE":
        return <Badge className="bg-green-500">Approuvé</Badge>
      case "REFUSE":
        return <Badge variant="destructive">Refusé</Badge>
      case "EN_ATTENTE":
        return <Badge variant="secondary">En attente</Badge>
      default:
        return <Badge>{statut}</Badge>
    }
  }

  const stats = {
    total: filteredConges.length,
    enAttente: filteredConges.filter((c) => c.statut === "EN_ATTENTE").length,
    approuves: filteredConges.filter((c) => c.statut === "APPROUVE").length,
    refuses: filteredConges.filter((c) => c.statut === "REFUSE").length,
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Congés</h1>
          <p className="text-muted-foreground">Gérez les demandes de congés de tous les employés</p>
        </div>
        <PermissionGuard permission="conge.create">
          <div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open)
                if (!open) setEditingConge(null)
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nouveau Congé
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingConge ? "Modifier la Demande" : "Nouvelle Demande de Congé"}</DialogTitle>
                </DialogHeader>
                <FormulaireConge employes={employes} conge={editingConge} onCongeSubmit={handleCongeSubmit} />
              </DialogContent>
            </Dialog>
          </div>
        </PermissionGuard>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.enAttente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.approuves}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusés</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.refuses}</div>
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
                  placeholder="Rechercher par nom ou type..."
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
            <AppSelect
              className="w-[180px]"
              placeholder="Tous les statuts"
              value={{ value: selectedStatut, label: { all: "Tous les statuts", EN_ATTENTE: "En attente", APPROUVE: "Approuvé", REFUSE: "Refusé" }[selectedStatut] ?? selectedStatut }}
              onChange={(opt: any) => setSelectedStatut(opt?.value ?? "all")}
              options={[
                { value: "all", label: "Tous les statuts" },
                { value: "EN_ATTENTE", label: "En attente" },
                { value: "APPROUVE", label: "Approuvé" },
                { value: "REFUSE", label: "Refusé" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredConges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun congé trouvé</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Début</TableHead>
                  <TableHead>Date Fin</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConges.map((conge) => (
                  <TableRow key={conge.id}>
                    <TableCell className="font-medium">
                      {conge.employe?.user?.prenom} {conge.employe?.user?.nom}
                    </TableCell>
                    <TableCell>{conge.type}</TableCell>
                    <TableCell>{format(new Date(conge.dateDebut), "dd MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell>{format(new Date(conge.dateFin), "dd MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{calculateDuration(conge.dateDebut, conge.dateFin)} jour(s)</Badge>
                    </TableCell>
                    <TableCell>{getStatutBadge(conge.statut)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(conge)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {conge.statut !== "APPROUVE" && hasPermission("conge.update") && (
                          <Button variant="outline" size="sm" onClick={() => handleEdit(conge)}>
                            Modifier
                          </Button>
                        )}
                        {conge.statut === "EN_ATTENTE" && (
                          <>
                            {hasPermission("conge.approve") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 bg-transparent"
                                onClick={() => handleApprove(conge.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                            )}
                            {hasPermission("conge.reject") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() => handleReject(conge.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser
                              </Button>
                            )}
                          </>
                        )}
                        {conge.statut !== "APPROUVE" && hasPermission("conge.delete") && (
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(conge.id)}>
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {paginationConges && (
            <DataPagination
              pagination={paginationConges}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog pour voir la description */}
      <Dialog
        open={!!viewingConge}
        onOpenChange={(open) => {
          if (!open) setViewingConge(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du congé</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Employé</p>
            <p>{viewingConge?.employe?.user?.prenom} {viewingConge?.employe?.user?.nom}</p>
            <p className="text-sm font-medium text-muted-foreground pt-2">Description</p>
            <div className="max-h-[40vh] overflow-y-auto rounded-md border bg-muted p-3">
              <p className="text-sm whitespace-pre-wrap">{viewingConge?.description}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
