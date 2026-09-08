"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { fournisseurSchema, type FournisseurFormValues } from "@/lib/validations"

export default function ModifierFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FournisseurFormValues>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: { nom: "", prenom: "", email: "", tel: "", adresse: "" },
  })

  useEffect(() => {
    const loadFournisseur = async () => {
      try {
        const response = await fournisseurService.getById(parseInt(resolvedParams.id))
        const data = response.data.data
        setFournisseur(data)
        reset({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email || "",
          tel: data.tel || "",
          adresse: data.adresse,
        })
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger le fournisseur", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadFournisseur()
  }, [resolvedParams.id, toast, reset])

  const onSubmit = async (data: FournisseurFormValues) => {
    setIsSubmitting(true)
    try {
      await fournisseurService.update(parseInt(resolvedParams.id), data)
      toast({
        title: "Fournisseur modifié",
        description: `Le fournisseur ${data.prenom} ${data.nom} a été modifié avec succès`,
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

  const handleDelete = async () => {
    try {
      await fournisseurService.delete(parseInt(resolvedParams.id))
      toast({ title: "Fournisseur supprimé", description: "Le fournisseur a été supprimé avec succès" })
      router.push("/magasinier/fournisseurs")
      router.refresh()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le fournisseur", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>
  }

  if (!fournisseur) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container py-8">
            <h1 className="text-2xl font-bold mb-4">Fournisseur non trouvé</h1>
            <Button asChild><Link href="/magasinier/fournisseurs">Retour à la liste</Link></Button>
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
                <Link href={`/magasinier/fournisseurs/${resolvedParams.id}`}><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Modifier le fournisseur</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permissions={["fournisseur.delete"]}>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                </Button>
              </PermissionGuard>
              <Button type="submit" form="fournisseur-form" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations du fournisseur</CardTitle>
              <CardDescription>Modifiez les informations du fournisseur</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="fournisseur-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                    <Input id="nom" placeholder="Nom du fournisseur" {...register("nom")} />
                    {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom <span className="text-red-500">*</span></Label>
                    <Input id="prenom" placeholder="Prénom du fournisseur" {...register("prenom")} />
                    {errors.prenom && <p className="text-sm text-red-500 mt-1">{errors.prenom.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-muted-foreground text-xs">(requis si pas de téléphone)</span>
                    </Label>
                    <Input id="email" type="email" placeholder="email@example.com" {...register("email")} />
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
                    <Textarea id="adresse" placeholder="Adresse complète" rows={3} {...register("adresse")} />
                    {errors.adresse && <p className="text-sm text-red-500 mt-1">{errors.adresse.message}</p>}
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
