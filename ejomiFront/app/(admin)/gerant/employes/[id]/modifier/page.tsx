"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { employesService, rolesService } from "@/services"
import type { Employe, EmployeWithUserUpdateData } from "@/types"
import type { Role } from "@/types/role"

export default function ModifierEmployePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [employe, setEmploye] = useState<Employe | null>(null)
  const [roles, setRoles] = useState<Role[]>([])

  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState<EmployeWithUserUpdateData>({
    nom: "",
    prenom: "",
    email: "",
    adresse: "",
    tel: "",
    roleId: undefined,
    salaire: 0,
    dateEmbauche: "",
    password: "", // mot de passe en clair
  })

  // Charger les données de l’employé et les rôles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [employeRes, rolesRes] = await Promise.all([
          employesService.getById(resolvedParams.id),
          rolesService.getAll(),
        ])

        const employeData = employeRes.data.data
        if (!employeData.user) {
          throw new Error("Les données de l'utilisateur associé à cet employé sont manquantes.")
        }

        setEmploye(employeData)
        // Filtrer pour ne garder que ADMIN et SECRETAIRE
        const filteredRoles = rolesRes.data.data.filter((role: any) =>
          role.name === 'ADMIN' || role.name === 'SECRETAIRE'
        )
        setRoles(filteredRoles)

        setFormData({
          nom: employeData.user.nom || "",
          prenom: employeData.user.prenom || "",
          email: employeData.user.email || "",
          adresse: employeData.user.adresse || "",
          tel: employeData.user.tel || "",
          roleId: employeData.user.roleId?.toString(),
          salaire: employeData.salaire || 0,
          dateEmbauche: employeData.dateEmbauche?.split("T")[0] || "",
          password: employeData.user.password || "", // pré-rempli en clair
        })
      } catch (err) {
        console.error("Erreur lors du chargement :", err)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de l'employé",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setLoadingRoles(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  // Gestion des changements dans les inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "salaire" ? Number(value) : value,
    })
  }

  // Soumettre la mise à jour
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.nom || !formData.prenom || !formData.tel || !formData.adresse || !formData.salaire || !formData.dateEmbauche) {
        throw new Error("Tous les champs obligatoires doivent être remplis")
      }

      if (formData.salaire <= 0) {
        throw new Error("Le salaire doit être supérieur à 0")
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("L'adresse email n'est pas valide")
      }

      await employesService.updateWithUser(resolvedParams.id, formData)

      toast({
        title: "Employé modifié",
        description: "Les informations de l'employé ont été mises à jour avec succès",
      })

      router.push("/gerant/employes")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Suppression de l’employé
  const handleDelete = async () => {
    try {
      await employesService.delete(resolvedParams.id)
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès",
      })
      router.push("/gerant/employes")
      router.refresh()
    } catch {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'employé",
        variant: "destructive",
      })
    }
  }

  if (loading) return <div className="flex justify-center p-8">Chargement...</div>

  if (!employe) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Employé non trouvé</h1>
        <Button asChild>
          <Link href="/gerant/employes">Retour à la liste</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/gerant/employes`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Modifier l'employé</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
              <Button type="submit" form="employe-form" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de l'employé</CardTitle>
              <CardDescription>Modifiez les informations de l'employé</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="employe-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom</Label>
                        <Input id="nom" name="nom" value={formData.nom} onChange={handleChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input id="prenom" name="prenom" value={formData.prenom} onChange={handleChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tel">Téléphone</Label>
                        <Input id="tel" name="tel" value={formData.tel} onChange={handleChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                          id="password"
                          name="password"
                          type="text" // mot de passe en clair
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="adresse">Adresse</Label>
                        <Input id="adresse" name="adresse" value={formData.adresse} onChange={handleChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roleId">Rôle</Label>
                        <AppSelect
                          placeholder={loadingRoles ? "Chargement..." : "Sélectionner un rôle"}
                          isDisabled={loadingRoles}
                          isClearable
                          value={formData.roleId ? { value: formData.roleId, label: roles.find(r => r.id.toString() === formData.roleId)?.name ?? formData.roleId } : null}
                          onChange={(opt: any) => setFormData({ ...formData, roleId: opt?.value ?? undefined })}
                          options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations d'employé</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="salaire">Salaire (FCFA)</Label>
                        <Input
                          id="salaire"
                          name="salaire"
                          type="number"
                          value={formData.salaire}
                          onChange={handleChange}
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateEmbauche">Date d'embauche</Label>
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

          <DeleteConfirmationDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDelete}
            title="Supprimer l'employé"
            description="Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible."
            entityName="L'employé"
          />
        </div>
      </main>
    </div>
  )
}
