"use client"

import type React from "react"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { Footer } from "@/components/layout/footer"
import { fournisseurService } from "@/services"
import type { Fournisseur } from "@/types/fournisseur"
import { PermissionGuard } from "@/components/permissions"

export default function ModifierFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)

  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    tel: "",
    adresse: "",
  })

  // Charger le fournisseur
  useEffect(() => {
    const loadFournisseur = async () => {
      try {
        const response = await fournisseurService.getById(parseInt(resolvedParams.id))
        const data = response.data.data
        setFournisseur(data)
        setFormData({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email || "",
          tel: data.tel,
          adresse: data.adresse,
        })
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger le fournisseur",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadFournisseur()
  }, [resolvedParams.id, toast])

  // Mettre à jour les données du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.nom || !formData.prenom || !formData.tel || !formData.adresse) {
        throw new Error("Le nom, prénom, téléphone et adresse sont obligatoires")
      }

      // Validation de l'email si fourni
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          throw new Error("L'adresse email n'est pas valide")
        }
      }

      await fournisseurService.update(parseInt(resolvedParams.id), formData)

      toast({
        title: "Fournisseur modifié",
        description: `Le fournisseur ${formData.prenom} ${formData.nom} a été modifié avec succès`,
      })

      router.push(`/magasinier/fournisseurs/${resolvedParams.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || error.message || "Une erreur est survenue lors de la modification du fournisseur",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Supprimer le fournisseur
  const handleDelete = async () => {
    try {
      await fournisseurService.delete(parseInt(resolvedParams.id))
      toast({
        title: "Fournisseur supprimé",
        description: "Le fournisseur a été supprimé avec succès",
      })
      router.push("/magasinier/fournisseurs")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fournisseur",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!fournisseur) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container py-8">
            <h1 className="text-2xl font-bold mb-4">Fournisseur non trouvé</h1>
            <Button asChild>
              <Link href="/magasinier/fournisseurs">Retour à la liste</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/magasinier/fournisseurs/${resolvedParams.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Modifier le fournisseur</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permissions={["fournisseur.delete"]} >
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
              </PermissionGuard>
              <Button type="submit" form="fournisseur-form" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations du fournisseur</CardTitle>
              <CardDescription>Modifiez les informations du fournisseur</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="fournisseur-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="required">
                      Nom
                    </Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Nom du fournisseur"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="required">
                      Prénom
                    </Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      placeholder="Prénom du fournisseur"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tel" className="required">
                      Téléphone
                    </Label>
                    <Input
                      id="tel"
                      name="tel"
                      value={formData.tel}
                      onChange={handleChange}
                      placeholder="Numéro de téléphone"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="adresse" className="required">
                      Adresse
                    </Label>
                    <Textarea
                      id="adresse"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      placeholder="Adresse complète"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le fournisseur"
        description={`Êtes-vous sûr de vouloir supprimer le fournisseur "${fournisseur.prenom} ${fournisseur.nom}" ? Cette action est irréversible.`}
        entityName="Le fournisseur"
      />
      <Footer />
    </div>
  )
}
