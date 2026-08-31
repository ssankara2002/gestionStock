"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, CalendarClock, Search, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AppSelect } from "@/components/ui/app-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FormulaireAbsence } from "@/components/employes/formulaire-absence"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { absenceService, employesService as employeService } from "@/services"
import { useToast } from "@/hooks/use-toast"
import type { Absence, AbsenceCreateData } from "@/types/absence"
import type { Employe } from "@/types/employe"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function AbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmploye, setSelectedEmploye] = useState<string>("all")
  const [dateRange, setDateRange] = useState({ debut: "", fin: "" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAbsence, setEditingAbsence] = useState<Absence | undefined>()
  const { toast } = useToast()
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { hasPermission } = usePermissions()

  useEffect(() => {
    loadData()
  }, [currentPage, searchTerm, selectedEmploye, dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 10,
        searchTerm,
        employeId: selectedEmploye,
        dateDebut: dateRange.debut,
        dateFin: dateRange.fin,
      }
      const [absencesResponse, employesRes] = await Promise.all([
        absenceService.getAll(params),
        employeService.getAll(1, 1000), // page 1, limit 1000
      ])
      
      setAbsences(absencesResponse.data.data || [])
      setPagination({
        page: absencesResponse.data.page,
        totalPages: absencesResponse.data.totalPages,
        total: absencesResponse.data.total,
        limit: absencesResponse.data.limit,
        hasNext: absencesResponse.data.page < absencesResponse.data.totalPages,
        hasPrev: absencesResponse.data.page > 1,
      })
      setEmployes(employesRes.data.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données des absences et des employés.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAbsenceSubmit = async (data: AbsenceCreateData) => {
    try {
      if (editingAbsence) {
        await absenceService.update(editingAbsence.id.toString(), data)
        toast({
          title: "Succès",
          description: "L'absence a été modifiée avec succès.",
        })
      } else {
        await absenceService.create(data)
        toast({
          title: "Succès",
          description: "L'absence a été enregistrée avec succès.",
        })
      }
      await loadData()
      setDialogOpen(false)
      setEditingAbsence(undefined)
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de l'absence:", error)
      const isEditing = !!editingAbsence
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          `Impossible de ${isEditing ? "modifier" : "créer"} l'absence.`,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette absence ?")) {
      try {
        await absenceService.delete(id.toString())
        await loadData()
        toast({
          title: "Succès",
          description: "L'absence a été supprimée.",
        })
      } catch (error: any) {
        console.error("Erreur lors de la suppression:", error)
        toast({
          title: "Erreur",
          description: error.response?.data?.message || "Impossible de supprimer l'absence.",
          variant: "destructive",
        })
      }
    }
  }

  const handleEdit = (absence: Absence) => {
    setEditingAbsence(absence)
    setDialogOpen(true)
  }

  const totalAbsences = pagination?.total || 0
  // Le modèle Absence n'a qu'une seule date, donc la durée est toujours de 1 jour.
  const totalJours = totalAbsences

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Absences</h1>
          <p className="text-muted-foreground">Gérez les absences de tous les employés</p>
        </div>
        <PermissionGuard permission="absence.create">
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) setEditingAbsence(undefined)
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Absence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAbsence ? "Modifier l'absence" : "Nouvelle Absence"}</DialogTitle>
              </DialogHeader>
              <FormulaireAbsence
                employeId={0} // L'ID est géré dans le formulaire
                onAbsenceEnregistree={handleAbsenceSubmit}
                absence={editingAbsence}
              />
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      <PermissionGuard permission="absence.statistics">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAbsences}</div>
              <p className="text-xs text-muted-foreground">Toutes périodes confondues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jours</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJours}</div>
              <p className="text-xs text-muted-foreground">Jours d'absence cumulés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employés</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employes.length}</div>
              <p className="text-xs text-muted-foreground">Employés actifs</p>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou motif..."
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
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.debut}
                onChange={(e) => setDateRange({ ...dateRange, debut: e.target.value })}
                className="w-[160px]"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateRange.fin}
                onChange={(e) => setDateRange({ ...dateRange, fin: e.target.value })}
                className="w-[160px]"
                disabled={!dateRange.debut}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : absences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucune absence trouvée</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.map((absence) => (
                  <TableRow key={absence.id}>
                    <TableCell className="font-medium">
                      {absence.employe?.user?.prenom} {absence.employe?.user?.nom}
                    </TableCell>
                    <TableCell>{format(new Date(absence.date), "dd MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell className="max-w-xs truncate">{absence.motif}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <PermissionGuard permission="absence.update">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(absence)}>
                            Modifier
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="absence.delete">
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(absence.id)}>
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
        </CardContent>
        {pagination && pagination.totalPages > 1 && (
          <DataPagination
            pagination={pagination}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  )
}
