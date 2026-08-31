"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { produitService } from "@/services"

export default function AddProduitPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    libelle: "",
    description: "",
    prixDeVenteUnitaire: "",
    seuilAlerteMagasin: "",
    seuilAlerteBoutique: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
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

    // Validation côté client avant l'envoi
    if (!imageFile) {
      toast({
        title: "Image manquante",
        description: "Veuillez sélectionner une image pour le produit.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const dataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        dataToSend.append(key, String(value))
      })
      dataToSend.append("image", imageFile)

      await produitService.create(dataToSend)
      toast({
        title: "Produit ajouté",
        description: `Le produit ${formData.libelle} a été ajouté avec succès.`,
      })
      router.push("/produits")
      router.refresh()
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
          <Link href="/produits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Ajouter un produit</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau produit</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour créer un produit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="libelle">Nom</Label>
                <Input id="libelle" name="libelle" value={formData.libelle} onChange={handleChange} required />
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
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du produit"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seuilAlerteMagasin">
                  Seuil d'alerte Magasin <span className="text-muted-foreground text-xs">(optionnel, défaut : 10)</span>
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
                  Seuil d'alerte Boutique <span className="text-muted-foreground text-xs">(optionnel, défaut : 5)</span>
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
                    Téléverser une image
                  </div>
                  <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" required />
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
