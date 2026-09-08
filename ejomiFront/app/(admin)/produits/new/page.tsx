"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, Save, Upload } from "lucide-react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { produitService } from "@/services"
import { produitSchema, type ProduitFormValues } from "@/lib/validations"

export default function AddProduitPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProduitFormValues>({
    resolver: zodResolver(produitSchema),
    defaultValues: { libelle: "", description: "", prixDeVenteUnitaire: 0, seuilAlerteMagasin: undefined, seuilAlerteBoutique: undefined },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit: SubmitHandler<ProduitFormValues> = async (data) => {
    setIsSubmitting(true)
    try {
      const dataToSend = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") dataToSend.append(key, String(value))
      })
      dataToSend.append("image", imageFile)

      await produitService.create(dataToSend)
      await queryClient.refetchQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: "Produit ajouté", description: `Le produit ${data.libelle} a été ajouté avec succès.` })
      router.push("/produits")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild aria-label="Retour aux produits">
          <Link href="/produits"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Ajouter un produit</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau produit</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour créer un produit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="libelle">Nom <span className="text-red-500">*</span></Label>
                <Input id="libelle" {...register("libelle")} />
                {errors.libelle && <p className="text-sm text-red-500 mt-1">{errors.libelle.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prixDeVenteUnitaire">Prix de vente (FCFA) <span className="text-red-500">*</span></Label>
                <Input id="prixDeVenteUnitaire" type="number" min="0" {...register("prixDeVenteUnitaire")} />
                {errors.prixDeVenteUnitaire && <p className="text-sm text-red-500 mt-1">{errors.prixDeVenteUnitaire.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Textarea id="description" placeholder="Description du produit" rows={4} {...register("description")} />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seuilAlerteMagasin">
                  Seuil d'alerte Magasin <span className="text-muted-foreground text-xs">(optionnel, défaut : 10)</span>
                </Label>
                <Input id="seuilAlerteMagasin" type="number" min="0" placeholder="10" {...register("seuilAlerteMagasin")} />
                {errors.seuilAlerteMagasin && <p className="text-sm text-red-500 mt-1">{errors.seuilAlerteMagasin.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seuilAlerteBoutique">
                  Seuil d'alerte Boutique <span className="text-muted-foreground text-xs">(optionnel, défaut : 5)</span>
                </Label>
                <Input id="seuilAlerteBoutique" type="number" min="0" placeholder="5" {...register("seuilAlerteBoutique")} />
                {errors.seuilAlerteBoutique && <p className="text-sm text-red-500 mt-1">{errors.seuilAlerteBoutique.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Image du produit <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                {imagePreview && (
                  <div className="mt-2 w-32 h-32 relative">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover rounded-md" />
                  </div>
                )}
                <Label htmlFor="image-upload" className="w-full">
                  <div className="mt-2 flex items-center justify-center w-full cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground">
                    <Upload className="h-4 w-4 mr-2" />Téléverser une image
                  </div>
                  <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
