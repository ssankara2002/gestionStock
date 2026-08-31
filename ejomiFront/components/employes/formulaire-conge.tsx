"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Conge, CongeCreateData, CongeUpdateData } from "@/types/conge"
import type { Employe } from "@/types"

interface FormulaireCongeProps {
  employeId?: number // Optionnel pour le cas général
  employes?: Employe[] // Liste des employés pour le manager
  conge?: Conge // Pour le mode édition
  onCongeSubmit: (data: CongeCreateData | CongeUpdateData) => void
}

export function FormulaireConge({ employeId, employes = [], conge, onCongeSubmit }: FormulaireCongeProps) {
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [type, setType] = useState("payé")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (conge) {
      // Mode édition
      setDateDebut(new Date(conge.dateDebut).toISOString().split("T")[0])
      setDateFin(new Date(conge.dateFin).toISOString().split("T")[0])
      setType(conge.type)
      setDescription(conge.description)
    } else {
      // Mode création
      setDateDebut("")
      setDateFin("")
      setType("payé")
      setDescription("")
    }
  }, [conge])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dateDebut || !dateFin || !description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    if (new Date(dateDebut) > new Date(dateFin)) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date de fin",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      if (conge) {
        // Mode édition
        const data: CongeUpdateData = { dateDebut, dateFin, type, description }
        onCongeSubmit(data)
      } else {
        // Mode création
        const data: CongeCreateData = {
          dateDebut,
          dateFin,
          type,
          description,
          statut: "EN_ATTENTE", // Le statut est défini par défaut à la création
        }
        onCongeSubmit(data)
        // Réinitialiser le formulaire uniquement après une création réussie.
        setDateDebut("")
        setDateFin("")
        setType("payé")
        setDescription("")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin</Label>
              <Input id="dateFin" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="type">Type de congé</Label>
              <AppSelect
                value={{ value: type, label: { "payé": "Payé", "sans solde": "Sans solde", "maladie": "Maladie", "maternité": "Maternité", "paternité": "Paternité" }[type] ?? type }}
                onChange={(opt: any) => setType(opt?.value ?? "payé")}
                options={[
                  { value: "payé", label: "Payé" },
                  { value: "sans solde", label: "Sans solde" },
                  { value: "maladie", label: "Maladie" },
                  { value: "maternité", label: "Maternité" },
                  { value: "paternité", label: "Paternité" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Motif détaillé de la demande de congé..."
              rows={3}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : conge ? "Modifier la demande" : "Enregistrer la demande"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
