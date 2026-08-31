"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/layout/footer"
import { clientService } from "@/services"

export default function NouveauClientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    tel: "",
    adresse: "",
  })

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

      await clientService.create(formData)

      toast({
        title: "Client ajouté",
        description: `Le client ${formData.prenom} ${formData.nom} a été ajouté avec succès`,
      })

      router.push("/vendeur/clients")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || error.message || "Une erreur est survenue lors de l'ajout du client",
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
                <Link href="/vendeur/clients">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Nouveau Client</h1>
            </div>
            <Button type="submit" form="client-form" disabled={isSubmitting} className="hidden sm:flex">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations du client</CardTitle>
              <CardDescription>Ajoutez un nouveau client à votre base de données</CardDescription>
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

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <Button variant="outline" type="button" asChild className="mt-2 sm:mt-0">
                    <Link href="/vendeur/clients">Annuler</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
