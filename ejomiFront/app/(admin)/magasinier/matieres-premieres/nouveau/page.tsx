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

const UNITES = ["g", "kg", "mg", "mL", "cL", "L", "unité", "pièce", "sachet", "boîte", "bouteille", "cuillère"]

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
    defaultValues: { nom: "", categorie: "", description: "", unite: "unité" },
  })

  const onSubmit = async (data: MatierePremiereFormValues) => {
    setIsSubmitting(true)
    try {
      await createMatierePremiere(data)
      toast({ title: "Ingrédient ajoutée", description: `${data.nom} a été ajouté avec succès` })
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
    <div className="container py-8">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="outline" size="icon" asChild>
              <Link href="/magasinier/matieres-premieres"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Nouvelle Ingrédient</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de la ingrédient</CardTitle>
              <CardDescription>Remplissez les informations de la nouvelle ingrédient</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                    <Input id="nom" placeholder="Ex: Tomate" {...register("nom")} />
                    {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                    <Input id="categorie" placeholder="Ex: Légumes" {...register("categorie")} />
                    {errors.categorie && <p className="text-sm text-red-500 mt-1">{errors.categorie.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unite">Unité de mesure <span className="text-red-500">*</span></Label>
                    <select id="unite" {...register("unite")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    {errors.unite && <p className="text-sm text-red-500 mt-1">{errors.unite.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                  <Textarea id="description" placeholder="Description de la ingrédient..." rows={4} {...register("description")} />
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
    </div>
  )
}
