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
import { clientService } from "@/services"
import type { Client } from "@/services/client-service"
import { clientSchema, type ClientFormValues } from "@/lib/validations"

export default function ModifierClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { nom: "", prenom: "", email: "", tel: "", adresse: "" },
  })

  useEffect(() => {
    const loadClient = async () => {
      try {
        const response = await clientService.getById(parseInt(resolvedParams.id))
        const data = response.data.data
        setClient(data)
        reset({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email || "",
          tel: data.tel || "",
          adresse: data.adresse,
        })
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger le client", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadClient()
  }, [resolvedParams.id, toast, reset])

  const onSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true)
    try {
      await clientService.update(parseInt(resolvedParams.id), data)
      toast({
        title: "Client modifié",
        description: `Le client ${data.prenom} ${data.nom} a été modifié avec succès`,
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

  const handleDelete = async () => {
    try {
      await clientService.delete(parseInt(resolvedParams.id))
      toast({ title: "Client supprimé", description: "Le client a été supprimé avec succès" })
      router.push("/vendeur/clients")
      router.refresh()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le client", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>
  }

  if (!client) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Client non trouvé</h1>
        <Button asChild><Link href="/vendeur/clients">Retour à la liste</Link></Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/vendeur/clients/${resolvedParams.id}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifier le client</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />Supprimer
          </Button>
          <Button type="submit" form="client-form" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>Modifiez les informations du client</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                <Input id="nom" placeholder="Nom du client" {...register("nom")} />
                {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom <span className="text-red-500">*</span></Label>
                <Input id="prenom" placeholder="Prénom du client" {...register("prenom")} />
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
