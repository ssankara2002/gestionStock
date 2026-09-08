"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { salairePaiementService } from "@/services/salaire-paiement-service"
import type { CreateSalairePaiementDto } from "@/types/salairePaiement"
import type { Employe } from "@/types"
import { paiementSalaireSchema, type PaiementSalaireFormValues } from "@/lib/validations"

interface FormulaireSalaireProps {
  employes: Employe[]
  onPaiementCreated: () => void
}

const MODE_OPTIONS = [
  { value: "ESPECES", label: "Espèces" },
  { value: "VIREMENT", label: "Virement" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
]

const MODE_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  MOBILE_MONEY: "Mobile Money",
}

export function FormulaireSalaire({ employes, onPaiementCreated }: FormulaireSalaireProps) {
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaiementSalaireFormValues>({
    resolver: zodResolver(paiementSalaireSchema),
    defaultValues: {
      employeId: undefined,
      salaireBase: 0,
      avantage: 0,
      indemnite: 0,
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear(),
      modePaiement: "ESPECES",
    },
  })

  const selectedEmployeId = watch("employeId")
  const salaireBase = watch("salaireBase") ?? 0
  const avantage = watch("avantage") ?? 0
  const indemnite = watch("indemnite") ?? 0
  const montantNet = Number(salaireBase) + Number(avantage) + Number(indemnite)

  useEffect(() => {
    if (selectedEmployeId) {
      const employe = employes.find((e) => e.id === Number(selectedEmployeId))
      if (employe) {
        setValue("salaireBase", employe.salaire, { shouldValidate: false })
      }
    } else {
      setValue("salaireBase", 0, { shouldValidate: false })
    }
  }, [selectedEmployeId, employes, setValue])

  const onSubmit = async (data: PaiementSalaireFormValues) => {
    try {
      const payload: CreateSalairePaiementDto = {
        employeId: data.employeId,
        montant: data.salaireBase,
        avantage: data.avantage,
        indemnite: data.indemnite,
        datePaiement: new Date().toISOString(),
        modePaiement: data.modePaiement,
        periode: `${data.annee}-${String(data.mois).padStart(2, "0")}-01`,
      }

      await salairePaiementService.create(payload)

      toast({ title: "Succès", description: "Le paiement de salaire a été enregistré avec succès." })

      reset({
        employeId: undefined,
        salaireBase: 0,
        avantage: 0,
        indemnite: 0,
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear(),
        modePaiement: "ESPECES",
      })

      onPaiementCreated()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || error?.message || "Impossible d'enregistrer le paiement",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="salaireBase">Salaire de base (FCFA) <span className="text-red-500">*</span></Label>
              <Input id="salaireBase" type="number" min="0" {...register("salaireBase")} />
              {errors.salaireBase && <p className="text-sm text-red-500">{errors.salaireBase.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avantage">Avantages (FCFA) <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input id="avantage" type="number" min="0" {...register("avantage")} />
              {errors.avantage && <p className="text-sm text-red-500">{errors.avantage.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="indemnite">Indemnités (FCFA) <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input id="indemnite" type="number" min="0" {...register("indemnite")} />
              {errors.indemnite && <p className="text-sm text-red-500">{errors.indemnite.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Net à payer (FCFA)</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 font-semibold text-green-700">
                {montantNet.toLocaleString()} FCFA
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mois">Mois <span className="text-red-500">*</span></Label>
              <Input id="mois" type="number" min="1" max="12" {...register("mois")} />
              {errors.mois && <p className="text-sm text-red-500">{errors.mois.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annee">Année <span className="text-red-500">*</span></Label>
              <Input id="annee" type="number" min="2020" max="2100" {...register("annee")} />
              {errors.annee && <p className="text-sm text-red-500">{errors.annee.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Mode de paiement <span className="text-red-500">*</span></Label>
              <Controller
                name="modePaiement"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    value={{ value: field.value, label: MODE_LABELS[field.value] ?? field.value }}
                    onChange={(opt: any) => field.onChange(opt?.value ?? "ESPECES")}
                    options={MODE_OPTIONS}
                  />
                )}
              />
              {errors.modePaiement && <p className="text-sm text-red-500">{errors.modePaiement.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer le paiement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
