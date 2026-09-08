"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { productionService } from "@/services/production-service"
import { getAllMatieresPremieres } from "@/services/matiere-premiere-service"
import { produitService, employesService } from "@/services"
import type { Produit } from "@/types/produit"
import type { Employe } from "@/types/employe"
import type { MatierePremiere } from "@/types/matierePremiere"
import { productionSchema, type ProductionFormValues } from "@/lib/validations"

interface ConsommationInput {
  matierePremiereId: string
  quantite: number
}

export default function NouvelleProductionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [produits, setProduits] = useState<Produit[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [matieres, setMatieres] = useState<MatierePremiere[]>([])
  const [consommations, setConsommations] = useState<ConsommationInput[]>([])
  const [newConsommation, setNewConsommation] = useState<ConsommationInput>({ matierePremiereId: "", quantite: 0 })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductionFormValues>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      produitId: "",
      quantiteFabriquee: 0,
      dateProduction: new Date().toISOString().split("T")[0],
      employeId: "",
      lot: "",
    },
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [produitsRes, employesRes, matieresData] = await Promise.all([
          produitService.getAll(),
          employesService.getAll(),
          getAllMatieresPremieres(),
        ])
        setProduits((produitsRes as any).data?.data || produitsRes.data || [])
        setEmployes((employesRes as any).data?.data || employesRes.data || [])
        setMatieres((matieresData as any)?.data || matieresData || [])
      } catch (error: any) {
        toast({ title: "Erreur de chargement", description: "Impossible de charger les données", variant: "destructive" })
      }
    }
    loadData()
  }, [toast])

  const addConsommation = () => {
    if (!newConsommation.matierePremiereId || newConsommation.quantite <= 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une matière première et une quantité valide", variant: "destructive" })
      return
    }
    const matiere = matieres.find((m) => m.id === newConsommation.matierePremiereId)
    if (matiere && matiere.quantiteStock < newConsommation.quantite) {
      toast({ title: "Stock insuffisant", description: `Stock disponible: ${matiere.quantiteStock}`, variant: "destructive" })
      return
    }
    setConsommations([...consommations, newConsommation])
    setNewConsommation({ matierePremiereId: "", quantite: 0 })
  }

  const removeConsommation = (index: number) => {
    setConsommations(consommations.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductionFormValues) => {
    setIsSubmitting(true)
    try {
      await productionService.create({
        ...data,
        consommations: consommations.length > 0 ? consommations : undefined,
      })
      toast({ title: "Production créée", description: "La production a été enregistrée avec succès" })
      router.push("/magasinier/productions")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMatiereNom = (id: string) => matieres.find((m) => m.id === id)?.nom || "N/A"

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/magasinier/productions"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Nouvelle Production</h1>
            </div>
            <Button type="submit" form="production-form" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de la production</CardTitle>
                <CardDescription>Remplissez les informations de la nouvelle production</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="production-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Produit fabriqué *</Label>
                      <Controller
                        name="produitId"
                        control={control}
                        render={({ field }) => (
                          <AppSelect
                            placeholder="Sélectionner un produit"
                            value={field.value ? { value: field.value, label: produits.find(p => p.id.toString() === field.value)?.libelle ?? field.value } : null}
                            onChange={(opt: any) => field.onChange(opt?.value ?? "")}
                            options={produits.map(p => ({ value: p.id.toString(), label: p.libelle }))}
                          />
                        )}
                      />
                      {errors.produitId && <p className="text-sm text-red-500 mt-1">{errors.produitId.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantiteFabriquee">Quantité fabriquée *</Label>
                      <Input id="quantiteFabriquee" type="number" min="1" placeholder="0" {...register("quantiteFabriquee")} />
                      {errors.quantiteFabriquee && <p className="text-sm text-red-500 mt-1">{errors.quantiteFabriquee.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Responsable *</Label>
                      <Controller
                        name="employeId"
                        control={control}
                        render={({ field }) => (
                          <AppSelect
                            placeholder="Sélectionner un employé"
                            value={field.value ? {
                              value: field.value,
                              label: employes.find(e => e.id.toString() === field.value)
                                ? `${employes.find(e => e.id.toString() === field.value)!.user?.prenom} ${employes.find(e => e.id.toString() === field.value)!.user?.nom}`
                                : field.value
                            } : null}
                            onChange={(opt: any) => field.onChange(opt?.value ?? "")}
                            options={employes.map(e => ({ value: e.id.toString(), label: `${e.user?.prenom} ${e.user?.nom}` }))}
                          />
                        )}
                      />
                      {errors.employeId && <p className="text-sm text-red-500 mt-1">{errors.employeId.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateProduction">Date de production *</Label>
                      <Input id="dateProduction" type="date" {...register("dateProduction")} />
                      {errors.dateProduction && <p className="text-sm text-red-500 mt-1">{errors.dateProduction.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lot">Numéro de lot (optionnel)</Label>
                      <Input id="lot" placeholder="LOT-2025-001" {...register("lot")} />
                      {errors.lot && <p className="text-sm text-red-500 mt-1">{errors.lot.message}</p>}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matières premières consommées</CardTitle>
                <CardDescription>Ajoutez les matières premières utilisées pour cette production</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Matière première</Label>
                    <AppSelect
                      placeholder="Sélectionner"
                      value={newConsommation.matierePremiereId
                        ? { value: newConsommation.matierePremiereId, label: matieres.find(m => m.id === newConsommation.matierePremiereId) ? `${matieres.find(m => m.id === newConsommation.matierePremiereId)!.nom} (Stock: ${matieres.find(m => m.id === newConsommation.matierePremiereId)!.quantiteStock})` : newConsommation.matierePremiereId }
                        : null}
                      onChange={(opt: any) => setNewConsommation({ ...newConsommation, matierePremiereId: opt?.value ?? "" })}
                      options={matieres.map(m => ({ value: m.id, label: `${m.nom} (Stock: ${m.quantiteStock})` }))}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newConsommation.quantite}
                      onChange={(e) => setNewConsommation({ ...newConsommation, quantite: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" onClick={addConsommation} size="icon"><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>

                {consommations.length > 0 && (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matière première</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consommations.map((consommation, index) => (
                          <TableRow key={index}>
                            <TableCell>{getMatiereNom(consommation.matierePremiereId)}</TableCell>
                            <TableCell className="text-right">{consommation.quantite}</TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeConsommation(index)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
