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
import { clientService } from "@/services"
import type { Client } from "@/services/client-service"

export default function ModifierClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)

  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    tel: "",
    adresse: "",
  })

  // Charger le client
  useEffect(() => {
    const loadClient = async () => {
      try {
        const response = await clientService.getById(parseInt(resolvedParams.id))
        const data = response.data.data
        setClient(data)
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
          description: "Impossible de charger le client",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadClient()
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

      await clientService.update(parseInt(resolvedParams.id), formData)

      toast({
        title: "Client modifié",
        description: `Le client ${formData.prenom} ${formData.nom} a été modifié avec succès`,
      })

      router.push(`/vendeur/clients/${resolvedParams.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || error.message || "Une erreur est survenue lors de la modification du client",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Supprimer le client
  const handleDelete = async () => {
    try {
      await clientService.delete(parseInt(resolvedParams.id))
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès",
      })
      router.push("/vendeur/clients")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client",
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

  if (!client) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Client non trouvé</h1>
        <Button asChild>
          <Link href="/vendeur/clients">Retour à la liste</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/vendeur/clients/${resolvedParams.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifier le client</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
          <Button type="submit" form="client-form" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>Modifiez les informations du client</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Nom du client"
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
                  placeholder="Prénom du client"
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

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        description="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible et supprimera également toutes les commandes associées."
        entityName="Le client"
      />
    </div>
  )
}
