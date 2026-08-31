"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { useToast } from "@/hooks/use-toast"
import { employesService, rolesService } from "@/services"
import { EmployeWithUserCreateData, Role } from "@/types"

export default function NouvelEmployePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState<EmployeWithUserCreateData>({
    nom: "",
    prenom: "",
    email: "",
    adresse: "",
    tel: "",
    password: "",
    roleId: "",
    salaire: 0,
    dateEmbauche: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true)
        const response = await rolesService.getAll()
        // Filtrer pour ne garder que ADMIN et SECRETAIRE
        const filteredRoles = response.data.data.filter((role: Role) =>
          role.name === 'ADMIN' || role.name === 'SECRETAIRE'
        )
        setRoles(filteredRoles)
      } catch (err) {
        console.error("Erreur lors du chargement des rôles:", err)
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des rôles",
          variant: "destructive",
        })
      } finally {
        setLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  // Mettre à jour les données du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "salaire" ? Number(value) : value,
    })
  }

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.nom || !formData.prenom || !formData.tel || !formData.adresse || !formData.salaire || !formData.dateEmbauche) {
        throw new Error("Les champs nom, prénom, téléphone, adresse, salaire et date d'embauche sont obligatoires")
      }

      if (formData.salaire <= 0) {
        throw new Error("Le salaire doit être supérieur à 0")
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("L'adresse email n'est pas valide")
      }

      // Appel à l'API
      await employesService.createWithUser(formData)

      toast({
        title: "Employé ajouté",
        description: "L'employé a été ajouté avec succès",
      })

      // Rediriger vers la liste des employés
      router.push("/gerant/employes")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de l'employé",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modifier la structure pour occuper tout l'espace disponible
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/gerant/employes">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Nouvel employé</h1>
            </div>
            <Button type="submit" form="employe-form" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de l'employé</CardTitle>
              <CardDescription>Ajoutez un nouvel employé à votre entreprise</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="employe-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
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
                          placeholder="Nom de famille"
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
                          placeholder="Prénom"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="email@exemple.com"
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
                        <Input
                          id="adresse"
                          name="adresse"
                          value={formData.adresse}
                          onChange={handleChange}
                          placeholder="Adresse complète"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">
                          Mot de passe
                        </Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Mot de passe (optionnel)"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roleId">
                          Rôle
                        </Label>
                        <AppSelect
                          placeholder={loadingRoles ? "Chargement..." : "Sélectionner un rôle (optionnel)"}
                          isClearable
                          value={formData.roleId && formData.roleId !== "none" ? { value: formData.roleId, label: roles.find(r => r.id.toString() === formData.roleId)?.name ?? formData.roleId } : null}
                          onChange={(opt: any) => setFormData({ ...formData, roleId: opt?.value ?? "" })}
                          options={roles.map(r => ({ value: r.id.toString(), label: r.description ? `${r.name} - ${r.description}` : r.name }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations d'employé</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="salaire" className="required">
                          Salaire (FCFA)
                        </Label>
                        <Input
                          id="salaire"
                          name="salaire"
                          type="number"
                          value={formData.salaire}
                          onChange={handleChange}
                          placeholder="Salaire en FCFA"
                          required
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateEmbauche" className="required">
                          Date d'embauche
                        </Label>
                        <Input
                          id="dateEmbauche"
                          name="dateEmbauche"
                          type="date"
                          value={formData.dateEmbauche}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
