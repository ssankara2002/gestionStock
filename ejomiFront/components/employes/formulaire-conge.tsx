"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import type { Conge, CongeCreateData, CongeUpdateData } from "@/types/conge"
import type { Employe } from "@/types"
import { congeSchema, type CongeFormValues } from "@/lib/validations"

interface FormulaireCongeProps {
  employeId?: number
  employes?: Employe[]
  conge?: Conge
  onCongeSubmit: (data: CongeCreateData | CongeUpdateData) => void
}

const TYPE_OPTIONS = [
  { value: "payé", label: "Payé" },
  { value: "sans solde", label: "Sans solde" },
  { value: "maladie", label: "Maladie" },
  { value: "maternité", label: "Maternité" },
  { value: "paternité", label: "Paternité" },
]

const TYPE_LABELS: Record<string, string> = {
  "payé": "Payé",
  "sans solde": "Sans solde",
  "maladie": "Maladie",
  "maternité": "Maternité",
  "paternité": "Paternité",
}

export function FormulaireConge({ employeId, employes = [], conge, onCongeSubmit }: FormulaireCongeProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CongeFormValues>({
    resolver: zodResolver(congeSchema),
    defaultValues: {
      employeId: employeId ?? undefined,
      dateDebut: "",
      dateFin: "",
      type: "payé",
      description: "",
    },
  })

  useEffect(() => {
    if (conge) {
      reset({
        employeId: conge.employeId ? Number(conge.employeId) : employeId,
        dateDebut: new Date(conge.dateDebut).toISOString().split("T")[0],
        dateFin: new Date(conge.dateFin).toISOString().split("T")[0],
        type: conge.type,
        description: conge.description,
      })
    } else {
      reset({
        employeId: employeId ?? undefined,
        dateDebut: "",
        dateFin: "",
        type: "payé",
        description: "",
      })
    }
  }, [conge, employeId, reset])

  const onSubmit = (data: CongeFormValues) => {
    if (conge) {
      const payload: CongeUpdateData = {
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        type: data.type,
        description: data.description,
      }
      onCongeSubmit(payload)
    } else {
      const payload: CongeCreateData = {
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        type: data.type,
        description: data.description,
        statut: "EN_ATTENTE",
        ...(data.employeId && { employeId: data.employeId }),
      }
      onCongeSubmit(payload)
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {employes.length > 0 && (
            <div className="space-y-2">
              <Label>Employé <span className="text-red-500">*</span></Label>
              <Controller
                name="employeId"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    placeholder="Sélectionner un employé"
                    value={field.value ? {
                      value: String(field.value),
                      label: employes.find(e => e.id === field.value)
                        ? `${employes.find(e => e.id === field.value)!.user?.prenom} ${employes.find(e => e.id === field.value)!.user?.nom}`
                        : String(field.value),
                    } : null}
                    onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : undefined)}
                    options={employes.map(e => ({ value: String(e.id), label: `${e.user?.prenom} ${e.user?.nom}` }))}
                  />
                )}
              />
              {errors.employeId && <p className="text-sm text-red-500">{errors.employeId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début <span className="text-red-500">*</span></Label>
              <Input id="dateDebut" type="date" {...register("dateDebut")} />
              {errors.dateDebut && <p className="text-sm text-red-500">{errors.dateDebut.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin <span className="text-red-500">*</span></Label>
              <Input id="dateFin" type="date" {...register("dateFin")} />
              {errors.dateFin && <p className="text-sm text-red-500">{errors.dateFin.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Type de congé <span className="text-red-500">*</span></Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    value={{ value: field.value, label: TYPE_LABELS[field.value] ?? field.value }}
                    onChange={(opt: any) => field.onChange(opt?.value ?? "payé")}
                    options={TYPE_OPTIONS}
                  />
                )}
              />
              {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Motif détaillé de la demande de congé..."
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : conge ? "Modifier la demande" : "Enregistrer la demande"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
