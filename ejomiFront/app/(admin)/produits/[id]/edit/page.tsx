"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Upload, Link2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import type { Produit } from "@/types/produit"
import { produitService } from "@/services"
import { PermissionGuard } from "@/components/permissions"
import { produitSchema, type ProduitFormValues } from "@/lib/validations"

export default function ModifierProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [produit, setProduit] = useState<Produit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [imageMode, setImageMode] = useState<"file" | "url">("file")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProduitFormValues>({
    resolver: zodResolver(produitSchema),
    defaultValues: { libelle: "", description: "", prixDeVenteUnitaire: 0, seuilAlerteMagasin: undefined, seuilAlerteBoutique: undefined },
  })

  useEffect(() => {
    const fetchProduit = async () => {
      try {
        const res = await produitService.getById(resolvedParams.id)
        const produitData = (res as any).data?.data || res.data
        setProduit(produitData)
        reset({
          libelle: produitData.libelle || "",
          description: produitData.description || "",
          prixDeVenteUnitaire: produitData.prixDeVenteUnitaire ?? 0,
          seuilAlerteMagasin: produitData.stockMagasin?.seuilAlerte ?? undefined,
          seuilAlerteBoutique: produitData.stockBoutique?.seuilAlerte ?? undefined,
        })
        if (produitData.image) {
          const img = produitData.image
          if (img.startsWith("http")) {
            setImagePreview(img)
          } else {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace("/api", "")
            setImagePreview(`${apiUrl}/uploads/${img}`)
          }
        }
      } catch {
        toast({ title: "Erreur", description: "Impossible de charger le produit", variant: "destructive" })
      }
    }
    fetchProduit()
  }, [resolvedParams.id, toast, reset])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImageUrl("")
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImageFile(null)
    if (url) setImagePreview(url)
  }

  const onSubmit = async (data: ProduitFormValues) => {
    setIsSubmitting(true)
    try {
      const dataToUpdate = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") dataToUpdate.append(key, String(value))
      })
      if (imageFile) dataToUpdate.append("image", imageFile)
      if (imageUrl) dataToUpdate.append("imageUrl", imageUrl)

      const res = await produitService.update(resolvedParams.id, dataToUpdate)
      const updatedProduit = (res as any).data?.data || (res as any).data

      toast({ title: "Succès", description: "Produit mis à jour avec succès" })

      if (!imageFile && updatedProduit?.image) {
        const img = updatedProduit.image
        if (img.startsWith("http")) {
          setImagePreview(img)
        } else {
          const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace("/api", "")
          setImagePreview(`${apiUrl}/uploads/${img}`)
        }
      }

      if (updatedProduit) {
        setProduit(updatedProduit)
        reset({
          libelle: updatedProduit.libelle || "",
          description: updatedProduit.description || "",
          prixDeVenteUnitaire: updatedProduit.prixDeVenteUnitaire ?? 0,
          seuilAlerteMagasin: updatedProduit.stockMagasin?.seuilAlerte ?? undefined,
          seuilAlerteBoutique: updatedProduit.stockBoutique?.seuilAlerte ?? undefined,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      router.push("/produits")
    } catch (error: any) {
      toast({ title: "Erreur", description: error.response?.data?.error || error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await produitService.delete(resolvedParams.id)
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: "Produit supprimé", description: "Le produit a été supprimé avec succès" })
      router.push("/produits")
    } catch (error: any) {
      toast({ title: "Erreur", description: error.response?.data?.error || error.message, variant: "destructive" })
    }
  }

  if (!produit) return <p className="p-8 text-center">Chargement du produit...</p>

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/produits"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Modifier le produit</h1>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permissions={["produit.delete"]}>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />Supprimer
            </Button>
          </PermissionGuard>
          <Button type="submit" form="produit-form" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>Modifiez les informations du produit</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="produit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <Textarea id="description" rows={4} {...register("description")} />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seuilAlerteMagasin">
                  Seuil d'alerte Magasin <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input id="seuilAlerteMagasin" type="number" min="0" placeholder="10" {...register("seuilAlerteMagasin")} />
                {errors.seuilAlerteMagasin && <p className="text-sm text-red-500 mt-1">{errors.seuilAlerteMagasin.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seuilAlerteBoutique">
                  Seuil d'alerte Boutique <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input id="seuilAlerteBoutique" type="number" min="0" placeholder="5" {...register("seuilAlerteBoutique")} />
                {errors.seuilAlerteBoutique && <p className="text-sm text-red-500 mt-1">{errors.seuilAlerteBoutique.message}</p>}
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label>Image du produit <span className="text-muted-foreground text-xs">(optionnel)</span></Label>

                {/* Mode toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={imageMode === "file" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageMode("file")}
                  >
                    <Upload className="h-4 w-4 mr-2" />Fichier
                  </Button>
                  <Button
                    type="button"
                    variant={imageMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageMode("url")}
                  >
                    <Link2 className="h-4 w-4 mr-2" />URL
                  </Button>
                </div>

                {/* Preview */}
                {imagePreview && (
                  <div className="w-32 h-32 relative">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover rounded-md border" />
                  </div>
                )}

                {imageMode === "file" ? (
                  <Label htmlFor="image-upload" className="w-full">
                    <div className="flex items-center justify-center w-full cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground">
                      <Upload className="h-4 w-4 mr-2" />Changer l'image
                    </div>
                    <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </Label>
                ) : (
                  <div className="space-y-1">
                    <Input
                      placeholder="https://exemple.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Collez l'URL directe d'une image</p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le produit"
        description="Êtes-vous sûr de vouloir supprimer ce produit ?"
        entityName="le produit"
      />
    </div>
  )
}
