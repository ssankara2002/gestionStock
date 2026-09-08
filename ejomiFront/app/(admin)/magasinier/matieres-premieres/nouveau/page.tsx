"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createMatierePremiere } from "@/services/matiere-premiere-service"
import { matierePremiereSchema, type MatierePremiereFormValues } from "@/lib/validations"

export default function NouvelleMatierePremierePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MatierePremiereFormValues>({
    resolver: zodResolver(matierePremiereSchema),
    defaultValues: { nom: "", categorie: "", description: "", quantiteStock: 0, prixAchat: 0 },
  })

  const onSubmit = async (data: MatierePremiereFormValues) => {
    setIsSubmitting(true)
    try {
      await createMatierePremiere(data)
      toast({ title: "Matière première ajoutée", description: `${data.nom} a été ajouté avec succès` })
      router.push("/magasinier/matieres-premieres")
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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/magasinier/matieres-premieres"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Nouvelle Matière Première</h1>
            </div>
            <Button type="submit" form="matiere-form" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de la matière première</CardTitle>
              <CardDescription>Remplissez les informations de la nouvelle matière première</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="matiere-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                    <Input id="nom" placeholder="Ex: Or 24 carats" {...register("nom")} />
                    {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                    <Input id="categorie" placeholder="Ex: Métaux précieux" {...register("categorie")} />
                    {errors.categorie && <p className="text-sm text-red-500 mt-1">{errors.categorie.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantiteStock">Quantité en stock initiale <span className="text-red-500">*</span></Label>
                    <Input
                      id="quantiteStock"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("quantiteStock")}
                    />
                    {errors.quantiteStock && <p className="text-sm text-red-500 mt-1">{errors.quantiteStock.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prixAchat">Prix d'achat (FCFA) <span className="text-red-500">*</span></Label>
                    <Input
                      id="prixAchat"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("prixAchat")}
                    />
                    {errors.prixAchat && <p className="text-sm text-red-500 mt-1">{errors.prixAchat.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                  <Textarea id="description" placeholder="Description de la matière première..." rows={4} {...register("description")} />
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
