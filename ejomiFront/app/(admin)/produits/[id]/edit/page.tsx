"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Upload } from "lucide-react"

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

export default function ModifierProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [produit, setProduit] = useState<Produit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    libelle: "",
    description: "",
    image: "",
    prixDeVenteUnitaire: "",
    seuilAlerteMagasin: "",
    seuilAlerteBoutique: "",
  })

  useEffect(() => {
    const fetchProduit = async () => {
      try {
        const res = await produitService.getById(resolvedParams.id)
        const produitData = res.data.data
        setProduit(produitData)
        setFormData({
          libelle: produitData.libelle || "",
          description: produitData.description || "",
          image: produitData.image || "",
          prixDeVenteUnitaire: produitData.prixDeVenteUnitaire?.toString() || "",
          seuilAlerteMagasin: produitData.stockMagasin?.seuilAlerte?.toString() ?? "",
          seuilAlerteBoutique: produitData.stockBoutique?.seuilAlerte?.toString() ?? "",
        })
        // Afficher l'image actuelle depuis le serveur
        if (produitData.image) {
          const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace("/api", "");
          setImagePreview(`${apiUrl}/uploads/${produitData.image}`)
        }
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger le produit",
          variant: "destructive",
        })
      }
    }
    fetchProduit()
  }, [resolvedParams.id, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const dataToUpdate = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "image") {
          dataToUpdate.append(key, String(value))
        }
      })
      if (imageFile) {
        dataToUpdate.append("image", imageFile)
      }

  const res = await produitService.update(resolvedParams.id, dataToUpdate)
  // Backend responses follow the shape { success: boolean, data: produit }
  const updatedProduit = (res as any).data?.data || (res as any).data
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès",
      })

      // Si aucune nouvelle image n'a été uploadée, s'assurer que l'aperçu affiche l'image enregistrée
      if (!imageFile && updatedProduit?.image) {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace("/api", "");
        setImagePreview(`${apiUrl}/uploads/${updatedProduit.image}`)
      }

      // Mettre à jour l'état local produit et formData
      if (updatedProduit) {
        setProduit(updatedProduit)
        setFormData({
          libelle: updatedProduit.libelle || "",
          description: updatedProduit.description || "",
          image: updatedProduit.image || "",
          prixDeVenteUnitaire: updatedProduit.prixDeVenteUnitaire?.toString() || "",
          seuilAlerteMagasin: updatedProduit.stockMagasin?.seuilAlerte?.toString() ?? "",
          seuilAlerteBoutique: updatedProduit.stockBoutique?.seuilAlerte?.toString() ?? "",
        })
      }

      router.push("/produits")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await produitService.delete(resolvedParams.id)
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      })
      router.push("/magasinier/produits")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      })
    }
  }

  if (!produit) return <p className="p-8 text-center">Chargement du produit...</p>

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/produits">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Modifier le produit</h1>
        </div>
        <div className="flex gap-2">
         <PermissionGuard permissions={["produit.delete"]} > 
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </PermissionGuard>
          <Button type="submit" form="produit-form" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>Modifiez les informations du produit</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="produit-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="libelle">Nom</Label>
                <Input id="libelle" name="libelle" value={formData.libelle} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prixDeVenteUnitaire">Prix de vente (FCFA)</Label>
                <Input
                  id="prixDeVenteUnitaire"
                  name="prixDeVenteUnitaire"
                  type="number"
                  min="0"
                  value={formData.prixDeVenteUnitaire}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seuilAlerteMagasin">
                  Seuil d'alerte Magasin <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input
                  id="seuilAlerteMagasin"
                  name="seuilAlerteMagasin"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={formData.seuilAlerteMagasin}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seuilAlerteBoutique">
                  Seuil d'alerte Boutique <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input
                  id="seuilAlerteBoutique"
                  name="seuilAlerteBoutique"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={formData.seuilAlerteBoutique}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Image du produit</Label>
                {imagePreview && (
                  <div className="mt-2 w-32 h-32 relative">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover rounded-md" />
                  </div>
                )}
                <Label htmlFor="image-upload" className="w-full">
                  <div className="mt-2 flex items-center justify-center w-full cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground">
                    <Upload className="h-4 w-4 mr-2" />
                    Changer l'image
                  </div>
                  <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                </Label>
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
