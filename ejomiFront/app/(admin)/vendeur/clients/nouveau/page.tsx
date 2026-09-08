"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/layout/footer"
import { clientService } from "@/services"
import { clientSchema, type ClientFormValues } from "@/lib/validations"

export default function NouveauClientPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { nom: "", prenom: "", email: "", tel: "", adresse: "" },
  })

  const onSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true)
    try {
      await clientService.create(data)
      await queryClient.refetchQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({
        title: "Client ajouté",
        description: `Le client ${data.prenom} ${data.nom} a été ajouté avec succès`,
      })
      router.push("/vendeur/clients")
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
