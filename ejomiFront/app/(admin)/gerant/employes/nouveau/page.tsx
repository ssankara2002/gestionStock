"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { useToast } from "@/hooks/use-toast"
import { employesService, rolesService } from "@/services"
import { Role } from "@/types"
import { employeSchema, type EmployeFormValues } from "@/lib/validations"

export default function NouvelEmployePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EmployeFormValues>({
    resolver: zodResolver(employeSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      adresse: "",
      tel: "",
      password: "",
      roleId: "",
      salaire: 0,
      dateEmbauche: new Date().toISOString().split("T")[0],
    },
  })

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true)
        const response = await rolesService.getAll()
        const filteredRoles = response.data.data.filter((role: Role) =>
          role.name === "ADMIN" || role.name === "SECRETAIRE"
        )
        setRoles(filteredRoles)
      } catch (err) {
        toast({ title: "Erreur", description: "Erreur lors du chargement des rôles", variant: "destructive" })
      } finally {
        setLoadingRoles(false)
      }
    }
    fetchRoles()
  }, [toast])

  const onSubmit = async (data: EmployeFormValues) => {
    setIsSubmitting(true)
    try {
      await employesService.createWithUser(data)
      await queryClient.refetchQueries({ queryKey: ['employes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: "Employé ajouté", description: "L'employé a été ajouté avec succès" })
      router.push("/gerant/employes")
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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/gerant/employes"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-2xl font-bold">Nouvel employé</h1>
            </div>
            <Button type="submit" form="employe-form" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de l'employé</CardTitle>
              <CardDescription>Ajoutez un nouvel employé à votre entreprise</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="employe-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                        <Input id="nom" placeholder="Nom de famille" {...register("nom")} />
                        {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom <span className="text-red-500">*</span></Label>
                        <Input id="prenom" placeholder="Prénom" {...register("prenom")} />
                        {errors.prenom && <p className="text-sm text-red-500 mt-1">{errors.prenom.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-muted-foreground text-xs">(requis si pas de téléphone)</span>
                        </Label>
                        <Input id="email" type="email" placeholder="email@exemple.com" {...register("email")} />
                        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tel">
                          Téléphone <span className="text-muted-foreground text-xs">(requis si pas d'email)</span>
                        </Label>
                        <Input id="tel" placeholder="Ex: +226 70 00 00 00" {...register("tel")} />
                        {errors.tel && <p className="text-sm text-red-500 mt-1">{errors.tel.message}</p>}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="adresse">Adresse <span className="text-red-500">*</span></Label>
                        <Input id="adresse" placeholder="Adresse complète" {...register("adresse")} />
                        {errors.adresse && <p className="text-sm text-red-500 mt-1">{errors.adresse.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                        <Input id="password" type="password" placeholder="Mot de passe (optionnel)" {...register("password")} />
                        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roleId">Rôle <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                        <Controller
                          name="roleId"
                          control={control}
                          render={({ field }) => (
                            <AppSelect
                              placeholder={loadingRoles ? "Chargement..." : "Sélectionner un rôle (optionnel)"}
                              isClearable
                              value={field.value && field.value !== "none"
                                ? { value: field.value, label: roles.find(r => r.id.toString() === field.value)?.name ?? field.value }
                                : null}
                              onChange={(opt: any) => field.onChange(opt?.value ?? "")}
                              options={roles.map(r => ({ value: r.id.toString(), label: r.description ? `${r.name} - ${r.description}` : r.name }))}
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
                          placeholder="Salaire en FCFA"
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
        </div>
      </main>
    </div>
  )
}
