"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Mail, Calendar, User, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { contactService } from "@/services/contact-service"
import type { Contact } from "@/types/contact"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [reponse, setReponse] = useState("")
  const [sending, setSending] = useState(false)

  const contactId = parseInt(params.id as string)

  // Charger le contact
  useEffect(() => {
    const loadContact = async () => {
      setLoading(true)
      try {
        const response = await contactService.getById(contactId)
        const contactData = response.data?.data || response.data
        setContact(contactData)
        setReponse(contactData.reponse || "")
      } catch (error: any) {
        console.error("Erreur chargement contact:", error)
        toast({
          title: "Erreur de chargement",
          description: error.response?.data?.message || "Impossible de charger le message",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadContact()
  }, [contactId, toast])

  // Envoyer une réponse
  const handleEnvoyerReponse = async () => {
    if (!reponse.trim()) {
      toast({
        title: "Réponse vide",
        description: "Veuillez saisir une réponse",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      await contactService.update(contactId, { reponse })
      toast({
        title: "Réponse enregistrée",
        description: "La réponse a été enregistrée et le message marqué comme traité",
      })

      // Recharger le contact
      const response = await contactService.getById(contactId)
      setContact(response.data?.data || response.data)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible d'enregistrer la réponse",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Message non trouvé</p>
          <Link href="/gerant/contacts">
            <Button>Retour aux messages</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center gap-4">
          <Link href="/gerant/contacts">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Détails du message</h1>
            <p className="text-muted-foreground">Message #{contact.id}</p>
          </div>
          <Badge
            variant={
              contact.statut === "NON_LU"
                ? "destructive"
                : contact.statut === "TRAITE"
                ? "default"
                : "secondary"
            }
          >
            {contact.statut.replace("_", " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations du contact */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Nom</p>
                  <p className="text-sm text-muted-foreground">{contact.nom}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{contact.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date d'envoi</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(contact.dateEnvoi), "PPPp", { locale: fr })}
                  </p>
                </div>
              </div>
              {contact.dateReponse && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date de réponse</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(contact.dateReponse), "PPPp", { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message et réponse */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message du client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message du client
                </CardTitle>
                <CardDescription>{contact.sujet}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{contact.message}</p>
                </div>
              </CardContent>
            </Card>

            {/* Réponse */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Votre réponse
                </CardTitle>
                <CardDescription>
                  {contact.reponse
                    ? "Réponse déjà envoyée - Vous pouvez la modifier"
                    : "Rédigez une réponse à ce message"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reponse">Réponse</Label>
                  <Textarea
                    id="reponse"
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                    rows={8}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEnvoyerReponse} disabled={sending}>
                    <Send className="mr-2 h-4 w-4" />
                    {contact.reponse ? "Modifier la réponse" : "Enregistrer la réponse"}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`mailto:${contact.email}?subject=Re: ${contact.sujet}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer par email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
