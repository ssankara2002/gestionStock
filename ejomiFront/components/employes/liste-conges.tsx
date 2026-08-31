"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Check, Eye, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Conge } from "@/types/conge"
import { useToast } from "@/hooks/use-toast" 
import { congeService } from "@/services/conge-service"
import { FormulaireConge } from "./formulaire-conge"

interface ListeCongesProps {
  employeId: number
}

export function ListeConges({ employeId }: ListeCongesProps) {
  const { toast } = useToast()
  const [conges, setConges] = useState<Conge[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConge, setEditingConge] = useState<Conge | null>(null)
  const [viewingConge, setViewingConge] = useState<Conge | null>(null)

  const fetchConges = async () => {
    try {
      setLoading(true)
      const response = await congeService.getByEmployeId(employeId)
      setConges(response.data.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des congés:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les congés",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConges()
  }, [employeId])

  const handleCongeSubmit = async (data: any) => {
    try {
      if (editingConge) {
        await congeService.update(editingConge.id, data)
        toast({ title: "Succès", description: "Le congé a été modifié." })
        setIsDialogOpen(false)
      } else {
        await congeService.create(data)
        toast({ title: "Succès", description: "La demande de congé a été créée." })
      }
      setEditingConge(null)
      fetchConges()
    } catch (error) {
      console.error("Erreur lors de la soumission du congé:", error)
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" })
    }
  }

  const handleApprouver = async (id: string) => {
    try {
      await congeService.approuver(id)
      toast({
        title: "Succès",
        description: "Le congé a été approuvé",
      })
      fetchConges()
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le congé",
        variant: "destructive",
      })
    }
  }

  const handleRefuser = async (id: string) => {
    try {
      await congeService.refuser(id)
      toast({
        title: "Succès",
        description: "Le congé a été refusé",
      })
      fetchConges()
    } catch (error) {
      console.error("Erreur lors du refus:", error)
      toast({
        title: "Erreur",
        description: "Impossible de refuser le congé",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce congé ?")) return

    try {
      await congeService.delete(id)
      toast({
        title: "Succès",
        description: "Le congé a été supprimé avec succès",
      })
      fetchConges()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le congé",
        variant: "destructive",
      })
    }
  }

  const calculerDuree = (dateDebut: string, dateFin: string) => {
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    const diffTime = Math.abs(fin.getTime() - debut.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "approuvé":
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>
      case "refusé":
        return <Badge className="bg-red-100 text-red-800">Refusé</Badge>
      default:
        return <Badge className="bg-orange-100 text-orange-800">En attente</Badge>
    }
  }

  const handleEdit = (conge: Conge) => {
    setEditingConge(conge)
    setIsDialogOpen(true)
  }

  if (loading) {
    return <div className="text-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => handleEdit(null)}>
        <Plus className="mr-2 h-4 w-4" />
        Nouvelle demande de congé
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date de début</TableHead>
              <TableHead>Date de fin</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun congé enregistré
                </TableCell>
              </TableRow>
            ) : (
              conges.map((conge) => (
                <TableRow key={conge.id}>
                  <TableCell>{format(new Date(conge.dateDebut), "dd MMM yyyy", { locale: fr })}</TableCell>
                  <TableCell>{format(new Date(conge.dateFin), "dd MMM yyyy", { locale: fr })}</TableCell>
                  <TableCell>{calculerDuree(conge.dateDebut, conge.dateFin)} jour(s)</TableCell>
                  <TableCell className="capitalize">{conge.type}</TableCell>
                  <TableCell>{getStatutBadge(conge.statut)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setViewingConge(conge)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {conge.statut !== "APPROUVE" && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(conge)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {conge.statut === "en attente" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleApprouver(conge.id)}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRefuser(conge.id)}>
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {conge.statut !== "APPROUVE" && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(conge.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Dialog pour voir la description */}
      <Dialog
        open={!!viewingConge}
        onOpenChange={(open) => {
          if (!open) setViewingConge(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Description du congé</DialogTitle>
          </DialogHeader>
          <div className="max-h-[40vh] overflow-y-auto rounded-md border bg-muted p-3">
            <p className="py-4 text-sm whitespace-pre-wrap">{viewingConge?.description}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer/modifier un congé */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingConge(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConge ? "Modifier la demande" : "Nouvelle demande de congé"}</DialogTitle>
          </DialogHeader>
          <FormulaireConge employeId={employeId} conge={editingConge} onCongeSubmit={handleCongeSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
