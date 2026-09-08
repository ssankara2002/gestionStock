"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { employesService, rolesService } from "@/services"
import type { Employe } from "@/types"
import type { Role } from "@/types/role"
import { employeSchema, type EmployeFormValues } from "@/lib/validations"

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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EmployeFormValues>({
    resolver: zodResolver(employeSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      adresse: "",
      tel: "",
      roleId: undefined,
      salaire: 0,
      dateEmbauche: "",
      password: "",
    },
  })

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
        const filteredRoles = rolesRes.data.data.filter((role: any) =>
          role.name === "ADMIN" || role.name === "SECRETAIRE"
        )
        setRoles(filteredRoles)

        reset({
          nom: employeData.user.nom || "",
          prenom: employeData.user.prenom || "",
          email: employeData.user.email || "",
          adresse: employeData.user.adresse || "",
          tel: employeData.user.tel || "",
          roleId: employeData.user.roleId?.toString(),
          salaire: employeData.salaire || 0,
          dateEmbauche: employeData.dateEmbauche?.split("T")[0] || "",
          password: employeData.user.password || "",
        })
      } catch (err) {
        toast({ title: "Erreur", description: "Impossible de charger les données de l'employé", variant: "destructive" })
      } finally {
        setLoading(false)
        setLoadingRoles(false)
      }
    }
    fetchData()
  }, [resolvedParams.id, reset, toast])

  const onSubmit = async (data: EmployeFormValues) => {
    setIsSubmitting(true)
    try {
      await employesService.updateWithUser(resolvedParams.id, data)
      toast({ title: "Employé modifié", description: "Les informations de l'employé ont été mises à jour avec succès" })
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

  const handleDelete = async () => {
    try {
      await employesService.delete(resolvedParams.id)
      toast({ title: "Employé supprimé", description: "L'employé a été supprimé avec succès" })
      router.push("/gerant/employes")
      router.refresh()
    } catch {
      toast({ title: "Erreur", description: "Erreur lors de la suppression de l'employé", variant: "destructive" })
    }
  }

  if (loading) return <div className="flex justify-center p-8">Chargement...</div>

  if (!employe) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Employé non trouvé</h1>
        <Button asChild><Link href="/gerant/employes">Retour à la liste</Link></Button>
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
                <Link href="/gerant/employes"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-2xl font-bold">Modifier l'employé</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />Supprimer
              </Button>
              <Button type="submit" form="employe-form" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de l'employé</CardTitle>
              <CardDescription>Modifiez les informations de l'employé</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="employe-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                        <Input id="nom" {...register("nom")} />
                        {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom <span className="text-red-500">*</span></Label>
                        <Input id="prenom" {...register("prenom")} />
                        {errors.prenom && <p className="text-sm text-red-500 mt-1">{errors.prenom.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-muted-foreground text-xs">(requis si pas de téléphone)</span>
                        </Label>
                        <Input id="email" type="email" {...register("email")} />
                        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tel">
                          Téléphone <span className="text-muted-foreground text-xs">(requis si pas d'email)</span>
                        </Label>
                        <Input id="tel" placeholder="Ex: +226 70 00 00 00" {...register("tel")} />
                        {errors.tel && <p className="text-sm text-red-500 mt-1">{errors.tel.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                        <Input id="password" type="text" {...register("password")} />
                        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="adresse">Adresse <span className="text-red-500">*</span></Label>
                        <Input id="adresse" {...register("adresse")} />
                        {errors.adresse && <p className="text-sm text-red-500 mt-1">{errors.adresse.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roleId">Rôle <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                        <Controller
                          name="roleId"
                          control={control}
                          render={({ field }) => (
                            <AppSelect
                              placeholder={loadingRoles ? "Chargement..." : "Sélectionner un rôle"}
                              isDisabled={loadingRoles}
                              isClearable
                              value={field.value
                                ? { value: field.value, label: roles.find(r => r.id.toString() === field.value)?.name ?? field.value }
                                : null}
                              onChange={(opt: any) => field.onChange(opt?.value ?? undefined)}
                              options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations d'employé</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="salaire">Salaire (FCFA) <span className="text-red-500">*</span></Label>
                        <Input
                          id="salaire"
                          type="number"
                          min="0"
                          {...register("salaire")}
                        />
                        {errors.salaire && <p className="text-sm text-red-500 mt-1">{errors.salaire.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateEmbauche">Date d'embauche <span className="text-red-500">*</span></Label>
                        <Input id="dateEmbauche" type="date" {...register("dateEmbauche")} />
                        {errors.dateEmbauche && <p className="text-sm text-red-500 mt-1">{errors.dateEmbauche.message}</p>}
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
