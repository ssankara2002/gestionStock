"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { absenceSchema, type AbsenceFormValues } from "@/lib/validations"
import { useState } from "react"

interface FormulaireAbsenceProps {
  employeId: number
  absence?: Absence
  onAbsenceEnregistree: (data: AbsenceCreateData) => void
}

export function FormulaireAbsence({ employeId, absence, onAbsenceEnregistree }: FormulaireAbsenceProps) {
  const [employes, setEmployes] = useState<Employe[]>([])
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AbsenceFormValues>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      employeId: employeId > 0 ? employeId : undefined,
      date: new Date().toISOString().split("T")[0],
      motif: "",
    },
  })

  const selectedEmployeId = watch("employeId")

  useEffect(() => {
    if (absence) {
      reset({
        employeId: absence.employeId ? Number(absence.employeId) : (employeId > 0 ? employeId : undefined),
        date: (absence as any).date ? (absence as any).date.split("T")[0] : new Date().toISOString().split("T")[0],
        motif: absence.motif ?? "",
      })
    } else {
      reset({
        employeId: employeId > 0 ? employeId : undefined,
        date: new Date().toISOString().split("T")[0],
        motif: "",
      })
    }
  }, [absence, employeId, reset])

  useEffect(() => {
    employesService.getAll(1, 1000).then((res) => {
      setEmployes(res.data.data || [])
    }).catch(() => {
      toast({ title: "Erreur", description: "Impossible de charger les employés.", variant: "destructive" })
    })
  }, [toast])

  const employeOptions = useMemo(
    () => employes.map((e) => ({
      value: e.id,
      label: e.user ? `${e.user.prenom} ${e.user.nom}` : `Employé ${e.id}`,
    })),
    [employes]
  )

  const selectedEmployeOption = employeOptions.find((opt) => opt.value === selectedEmployeId) ?? null

  const onSubmit = (data: AbsenceFormValues) => {
    const payload: AbsenceCreateData = {
      employeId: data.employeId,
      date: data.date,
      motif: data.motif ?? "",
    }
    onAbsenceEnregistree(payload)
    if (!absence) {
      reset({
        employeId: employeId > 0 ? employeId : undefined,
        date: new Date().toISOString().split("T")[0],
        motif: "",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{absence ? "Modifier l'absence" : "Enregistrer une absence"}</CardTitle>
        <CardDescription>
          {absence ? "Modifiez les informations de l'absence" : "Ajoutez une nouvelle absence pour cet employé"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employe">Employé <span className="text-red-500">*</span></Label>
              <Select
                id="employe"
                isDisabled={employeId > 0}
                options={employeOptions}
                value={selectedEmployeOption}
                onChange={(option) => setValue("employeId", option?.value ?? (undefined as any), { shouldValidate: true })}
                placeholder="Sélectionner un employé..."
                isSearchable
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: errors.employeId ? "#ef4444" : "#d1d5db",
                    borderRadius: "0.5rem",
                    minHeight: "42px",
                  }),
                }}
              />
              {errors.employeId && <p className="text-sm text-red-500">{errors.employeId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              id="motif"
              {...register("motif")}
              placeholder="Raison de l'absence..."
              rows={3}
            />
            {errors.motif && <p className="text-sm text-red-500">{errors.motif.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : absence ? "Modifier l'absence" : "Enregistrer l'absence"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
