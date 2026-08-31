"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getMatierePremiereById, updateMatierePremiere } from "@/services/matiere-premiere-service"
import type { MatierePremiere, MatierePremiereUpdateData } from "@/types/matierePremiere"

export default function ModifierMatierePremierePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<MatierePremiereUpdateData>({
    nom: "",
    categorie: "",
    description: "",
    quantiteStock: 0,
    prixAchat: 0,
  })

  useEffect(() => {
    const loadMatiere = async () => {
      if (!params.id) return

      try {
        const matiere = await getMatierePremiereById(params.id as string)
        setFormData({
          nom: matiere.nom,
          categorie: matiere.categorie || "",
          description: matiere.description || "",
          quantiteStock: matiere.quantiteStock,
          prixAchat: matiere.prixAchat,
        })
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: "Impossible de charger la matière première",
          variant: "destructive",
        })
        router.push("/magasinier/matieres-premieres")
      } finally {
        setLoading(false)
      }
    }

    loadMatiere()
  }, [params.id, toast, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "quantiteStock" || name === "prixAchat" ? parseFloat(value) || 0 : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.nom) {
        throw new Error("Le nom est obligatoire")
      }

      await updateMatierePremiere(params.id as string, formData)

      toast({
        title: "Matière première modifiée",
        description: "Les modifications ont été enregistrées avec succès",
      })

      router.push(`/magasinier/matieres-premieres/${params.id}`)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/magasinier/matieres-premieres/${params.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Modifier la matière première</h1>
            </div>
            <Button type="submit" form="matiere-form" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de la matière première</CardTitle>
              <CardDescription>Modifiez les informations de la matière première</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="matiere-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Ex: Or 24 carats"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie</Label>
                    <Input
                      id="categorie"
                      name="categorie"
                      value={formData.categorie}
                      onChange={handleChange}
                      placeholder="Ex: Métaux précieux"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantiteStock">Quantité en stock</Label>
                    <Input
                      id="quantiteStock"
                      name="quantiteStock"
                      type="number"
                      min="0"
                      value={formData.quantiteStock}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Description de la matière première..."
                    rows={4}
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
