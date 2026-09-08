"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Download, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { SalairePaiement } from "@/types/salairePaiement"
import type { Employe } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { salairePaiementService } from "@/services/salaire-paiement-service"
import { FormulaireSalaire } from "./formulaire-salaire"
import { BulletinSalaire } from "./bulletin-salaire"

interface ListeSalairesProps {
  employeId: number
  employeSalaire: number
  employe?: Employe
}

export function ListeSalaires({ employeId, employeSalaire, employe }: ListeSalairesProps) {
  const { toast } = useToast()
  const [salaires, setSalaires] = useState<SalairePaiement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPaiement, setSelectedPaiement] = useState<SalairePaiement | null>(null)
  const [showBulletin, setShowBulletin] = useState(false)

  const fetchSalaires = async () => {
    try {
      setLoading(true)
      const response = await salairePaiementService.getByEmployeId(employeId)
      setSalaires(response.data.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des salaires:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les paiements de salaire",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalaires()
  }, [employeId])

  const handleDelete = async (id: string | number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) return

    try {
      await salairePaiementService.delete(id)
      toast({
        title: "Succès",
        description: "Le paiement a été supprimé avec succès",
      })
      fetchSalaires()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le paiement",
        variant: "destructive",
      })
    }
  }

  const handleVoirBulletin = (paiement: SalairePaiement) => {
    setSelectedPaiement(paiement)
    setShowBulletin(true)
  }

  const handleImprimerBulletin = () => {
    window.print()
  }

  const getMoisNom = (mois: number) => {
    const moisNoms = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]
    return moisNoms[mois - 1] || mois
  }

  if (loading) {
    return <div className="text-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <FormulaireSalaire
        employes={employe ? [employe] : []}
        onPaiementCreated={fetchSalaires}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Période</TableHead>
              <TableHead>Date de paiement</TableHead>
              <TableHead className="text-right">Avantages</TableHead>
              <TableHead className="text-right">Indemnités</TableHead>
              <TableHead className="text-right">Montant net</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaires.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun paiement enregistré
                </TableCell>
              </TableRow>
            ) : (
              salaires.map((salaire) => (
                <TableRow key={salaire.id}>
                  <TableCell className="font-medium">
                    {salaire.periode ?? "-"}
                  </TableCell>
                  <TableCell>{salaire.datePaiement ? format(new Date(salaire.datePaiement), "dd MMM yyyy", { locale: fr }) : "-"}</TableCell>
                  <TableCell className="text-right">
                    {salaire.avantage ? `${salaire.avantage.toLocaleString()} FCFA` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {salaire.indemnite ? `${salaire.indemnite.toLocaleString()} FCFA` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {salaire.montant.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleVoirBulletin(salaire)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(salaire.id)}>
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

      <Dialog open={showBulletin} onOpenChange={setShowBulletin}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulletin de paie</DialogTitle>
          </DialogHeader>
          {selectedPaiement && (
            <div>
              <BulletinSalaire paiement={selectedPaiement} employeNom="Nom" employePrenom="Prénom" />
              <div className="flex justify-end gap-2 mt-4 print:hidden">
                <Button onClick={handleImprimerBulletin}>
                  <Download className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
