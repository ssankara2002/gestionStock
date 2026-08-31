"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { useToast } from "@/hooks/use-toast"
import { productionService } from "@/services/production-service"
import { getAllMatieresPremieres } from "@/services/matiere-premiere-service"
import { produitService, employesService } from "@/services"
import type { Produit } from "@/types/produit"
import type { Employe } from "@/types/employe"
import type { MatierePremiere } from "@/types/matierePremiere"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

  const [formData, setFormData] = useState({
    produitId: "",
    quantiteFabriquee: 0,
    dateProduction: new Date().toISOString().split("T")[0],
    employeId: "",
    lot: "",
  })

  const [consommations, setConsommations] = useState<ConsommationInput[]>([])
  const [newConsommation, setNewConsommation] = useState<ConsommationInput>({
    matierePremiereId: "",
    quantite: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [produitsRes, employesRes, matieresData] = await Promise.all([
          produitService.getAll(),
          employesService.getAll(),
          getAllMatieresPremieres(),
        ])

        setProduits(produitsRes.data.data || [])
        setEmployes(employesRes.data.data || [])
        setMatieres(matieresData.data || [])
      } catch (error: any) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données",
          variant: "destructive",
        })
      }
    }

    loadData()
  }, [toast])

  const handleChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const addConsommation = () => {
    if (!newConsommation.matierePremiereId || newConsommation.quantite <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une matière première et une quantité valide",
        variant: "destructive",
      })
      return
    }

    // Vérifier le stock disponible
    const matiere = matieres.find((m) => m.id === newConsommation.matierePremiereId)
    if (matiere && matiere.quantiteStock < newConsommation.quantite) {
      toast({
        title: "Stock insuffisant",
        description: `Stock disponible: ${matiere.quantiteStock}`,
        variant: "destructive",
      })
      return
    }

    setConsommations([...consommations, newConsommation])
    setNewConsommation({ matierePremiereId: "", quantite: 0 })
  }

  const removeConsommation = (index: number) => {
    setConsommations(consommations.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.produitId || !formData.employeId || formData.quantiteFabriquee <= 0) {
        throw new Error("Tous les champs obligatoires doivent être remplis")
      }

      await productionService.create({
        ...formData,
        consommations: consommations.length > 0 ? consommations : undefined,
      })

      toast({
        title: "Production créée",
        description: "La production a été enregistrée avec succès",
      })

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

  const getMatiereNom = (id: string) => {
    return matieres.find((m) => m.id === id)?.nom || "N/A"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/magasinier/productions">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Nouvelle Production</h1>
            </div>
            <Button type="submit" form="production-form" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de la production</CardTitle>
                <CardDescription>Remplissez les informations de la nouvelle production</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="production-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="produitId">Produit fabriqué *</Label>
                      <AppSelect
                        placeholder="Sélectionner un produit"
                        value={formData.produitId ? { value: formData.produitId, label: produits.find(p => p.id.toString() === formData.produitId)?.libelle ?? formData.produitId } : null}
                        onChange={(opt: any) => handleChange("produitId", opt?.value ?? "")}
                        options={produits.map(p => ({ value: p.id.toString(), label: p.libelle }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantiteFabriquee">Quantité fabriquée *</Label>
                      <Input
                        id="quantiteFabriquee"
                        type="number"
                        min="1"
                        value={formData.quantiteFabriquee}
                        onChange={(e) => handleChange("quantiteFabriquee", parseInt(e.target.value) || 0)}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeId">Responsable *</Label>
                      <AppSelect
                        placeholder="Sélectionner un employé"
                        value={formData.employeId ? { value: formData.employeId, label: employes.find(e => e.id.toString() === formData.employeId) ? `${employes.find(e => e.id.toString() === formData.employeId)!.user?.prenom} ${employes.find(e => e.id.toString() === formData.employeId)!.user?.nom}` : formData.employeId } : null}
                        onChange={(opt: any) => handleChange("employeId", opt?.value ?? "")}
                        options={employes.map(e => ({ value: e.id.toString(), label: `${e.user?.prenom} ${e.user?.nom}` }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateProduction">Date de production *</Label>
                      <Input
                        id="dateProduction"
                        type="date"
                        value={formData.dateProduction}
                        onChange={(e) => handleChange("dateProduction", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lot">Numéro de lot (optionnel)</Label>
                      <Input
                        id="lot"
                        value={formData.lot}
                        onChange={(e) => handleChange("lot", e.target.value)}
                        placeholder="LOT-2025-001"
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matières premières consommées</CardTitle>
                <CardDescription>
                  Ajoutez les matières premières utilisées pour cette production
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Matière première</Label>
                    <AppSelect
                      placeholder="Sélectionner"
                      value={newConsommation.matierePremiereId ? { value: newConsommation.matierePremiereId, label: matieres.find(m => m.id === newConsommation.matierePremiereId) ? `${matieres.find(m => m.id === newConsommation.matierePremiereId)!.nom} (Stock: ${matieres.find(m => m.id === newConsommation.matierePremiereId)!.quantiteStock})` : newConsommation.matierePremiereId } : null}
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
                      onChange={(e) =>
                        setNewConsommation({
                          ...newConsommation,
                          quantite: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button type="button" onClick={addConsommation} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
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
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeConsommation(index)}
                              >
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
