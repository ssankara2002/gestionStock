"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Absence } from "@/types/absence"
import { useToast } from "@/hooks/use-toast"
import { absenceService } from "@/services"
import { FormulaireAbsence } from "./formulaire-absence"

interface ListeAbsencesProps {
  employeId: number
}

export function ListeAbsences({ employeId }: ListeAbsencesProps) {
  const { toast } = useToast()
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const fetchAbsences = async () => {
    try {
      setLoading(true)
      const response = await absenceService.getByEmployeId(employeId)
      setAbsences(response.data.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des absences:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les absences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAbsences()
  }, [employeId])

  const handleEdit = (absence: Absence) => {
    setEditingAbsence(absence)
    setShowEditDialog(true)
  }

  const handleCloseEdit = () => {
    setEditingAbsence(null)
    setShowEditDialog(false)
  }

  const handleDelete = async (id: string | number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette absence ?")) return

    try {
      await absenceService.delete(id)
      toast({
        title: "Succès",
        description: "L'absence a été supprimée avec succès",
      })
      fetchAbsences()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'absence",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <FormulaireAbsence employeId={employeId} onAbsenceEnregistree={fetchAbsences} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Aucune absence enregistrée
                </TableCell>
              </TableRow>
            ) : (
              absences.map((absence) => (
                <TableRow key={absence.id}>
                  <TableCell>{format(new Date((absence as any).date), "dd MMM yyyy", { locale: fr })}</TableCell>
                  <TableCell>{absence.motif}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(absence)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(absence.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'absence</DialogTitle>
          </DialogHeader>
          {editingAbsence && (
            <FormulaireAbsence
              employeId={employeId}
              absence={editingAbsence}
              onAbsenceEnregistree={() => {
                fetchAbsences()
                handleCloseEdit()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
