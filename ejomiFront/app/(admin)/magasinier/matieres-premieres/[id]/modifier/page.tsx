"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getMatierePremiereById, updateMatierePremiere } from "@/services/matiere-premiere-service"

const UNITES = ["g", "kg", "mg", "mL", "cL", "L", "unité", "pièce", "sachet", "boîte", "bouteille", "cuillère"]

const schema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  categorie: z.string().optional(),
  description: z.string().optional(),
  unite: z.string().min(1, "L'unité est requise"),
})
type FormValues = z.infer<typeof schema>

export default function ModifierMatierePremierePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nomIngredient, setNomIngredient] = useState("")

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nom: "", categorie: "", description: "", unite: "unité" },
  })

  const watchedUnite = watch("unite")

  useEffect(() => {
    const load = async () => {
      try {
        const matiere = await getMatierePremiereById(resolvedParams.id)
        const unite = (matiere as any).unite || "unité"
        setNomIngredient(matiere.nom)
        reset({ nom: matiere.nom, categorie: matiere.categorie || "", description: matiere.description || "", unite })
      } catch {
        toast({ title: "Erreur", description: "Impossible de charger l'ingrédient", variant: "destructive" })
        router.push("/magasinier/matieres-premieres")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [resolvedParams.id])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await updateMatierePremiere(resolvedParams.id, data)
      toast({ title: "Ingrédient modifié", description: "Les modifications ont été enregistrées avec succès" })
      router.push("/magasinier/matieres-premieres")
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
    return <div className="flex items-center justify-center h-48"><p>Chargement...</p></div>
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/magasinier/matieres-premieres"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Modifier l'ingrédient</h1>
          {nomIngredient && <p className="text-sm text-muted-foreground">{nomIngredient}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'ingrédient</CardTitle>
          <CardDescription>Modifiez les informations de l'ingrédient</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="matiere-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                <Input id="nom" placeholder="Ex: Tomate" {...register("nom")} />
                {errors.nom && <p className="text-sm text-red-500">{errors.nom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input id="categorie" placeholder="Ex: Légumes" {...register("categorie")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unite">Unité de mesure <span className="text-red-500">*</span></Label>
                <select
                  id="unite"
                  value={watchedUnite}
                  onChange={(e) => setValue("unite", e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {UNITES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {errors.unite && <p className="text-sm text-red-500">{errors.unite.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea id="description" placeholder="Description de l'ingrédient..." rows={4} {...register("description")} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" form="matiere-form" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
