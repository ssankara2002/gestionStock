"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Select from "react-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { employesService } from "@/services"
import type { AbsenceCreateData, Absence } from "@/types/absence"
import type { Employe } from "@/types"

interface FormulaireAbsenceProps {
  employeId: number
  absence?: Absence
  onAbsenceEnregistree: (data: AbsenceCreateData) => void
}

export function FormulaireAbsence({ employeId, absence, onAbsenceEnregistree }: FormulaireAbsenceProps) {
  const getTodayDate = () => new Date().toISOString().split("T")[0]

  const [date, setDate] = useState(getTodayDate())
  const [selectedEmployeId, setSelectedEmployeId] = useState<string>(employeId > 0 ? String(employeId) : "")
  const [employes, setEmployes] = useState<Employe[]>([])
  const [motif, setMotif] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (absence) {
      if ((absence as any).date) setDate((absence as any).date.split("T")[0])
      setMotif(absence.motif)
      if (absence.employeId) setSelectedEmployeId(String(absence.employeId))
    } else {
      resetForm()
    }
  }, [absence])

  useEffect(() => {
    const loadEmployes = async () => {
      try {
        const response = await employesService.getAll(1, 1000)
        const loadedEmployes = response.data.data || []
        setEmployes(loadedEmployes)
      } catch (err) {
        console.error("Impossible de charger la liste des employés", err)
        toast({ title: "Erreur", description: "Impossible de charger les employés.", variant: "destructive" })
      }
    }
    loadEmployes()
  }, [toast])

  const resetForm = () => {
    setDate(getTodayDate())
    setMotif("")
    if (employeId <= 0) setSelectedEmployeId("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !motif || !selectedEmployeId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const data: AbsenceCreateData = {
        employeId: Number(selectedEmployeId),
        date,
        motif,
      }

      onAbsenceEnregistree(data)

      if (!absence) resetForm()
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de l'absence:", error)
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'enregistrer l'absence",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const employeOptions = useMemo(
    () =>
      employes.map((e) => ({
        value: String(e.id),
        label: e.user ? `${e.user.prenom} ${e.user.nom}` : `Employé ${e.id}`,
      })),
    [employes]
  )

  const selectedEmployeOption = employeOptions.find((opt) => opt.value === selectedEmployeId) || null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{absence ? "Modifier l'absence" : "Enregistrer une absence"}</CardTitle>
        <CardDescription>
          {absence ? "Modifiez les informations de l'absence" : "Ajoutez une nouvelle absence pour cet employé"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sélecteur Employé */}
            <div className="space-y-2">
              <Label htmlFor="employe">Employé</Label>
              <Select
                id="employe"
                isDisabled={employeId > 0}
                options={employeOptions}
                value={selectedEmployeOption}
                onChange={(option) => setSelectedEmployeId(option?.value || "")}
                placeholder="Sélectionner un employé..."
                isSearchable
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#d1d5db",
                    borderRadius: "0.5rem",
                    minHeight: "42px",
                  }),
                }}
              />
            </div>

            {/* Date */}
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif">Motif</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Raison de l'absence..."
              rows={3}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : absence ? "Modifier l'absence" : "Enregistrer l'absence"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
