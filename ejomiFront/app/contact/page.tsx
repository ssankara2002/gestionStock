"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { HomeHeader } from "@/components/layout/home-header"
import { Footer } from "@/components/layout/footer"
import { useToast } from "@/hooks/use-toast"
import { contactService } from "@/services/contact-service"
import { entrepriseService } from "@/services/entreprise-service"

interface EntrepriseConfig {
  id: number
  nom: string
  logo?: string
  email?: string
  tel?: string
  adresse?: string
  geolocalisation?: string
  jourouverture?: string[]
  heureouverture?: string[]
  jourfermeture?: string[]
  heurefermeture?: string[]
  facebook?: string
  instagram?: string
  twitter?: string
}

const DEFAULTS: EntrepriseConfig = {
  id: 0,
  nom: "Notre Entreprise",
}

export default function ContactPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<EntrepriseConfig>(DEFAULTS)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const entrepriseId =
      typeof window !== "undefined" ? localStorage.getItem("entrepriseId") : null
    if (!entrepriseId) return

    const load = async () => {
      try {
        const res = await entrepriseService.getById(Number(entrepriseId))
        if (res.data?.data) setConfig({ ...DEFAULTS, ...res.data.data })
      } catch {}
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await contactService.create({
        nom: formData.name,
        email: formData.email,
        sujet: formData.subject,
        message: formData.message,
      })
      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      })
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible d'envoyer le message",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasHoraires =
    config.jourouverture && config.jourouverture.length > 0

  const mapSrc = config.geolocalisation
    ? config.geolocalisation.startsWith("http")
      ? config.geolocalisation
      : `https://maps.google.com/maps?q=${encodeURIComponent(config.geolocalisation)}&output=embed`
    : null

  return (
    <div className="flex flex-col min-h-screen w-full">
      <HomeHeader logo={config.logo} nom={config.nom} />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Contactez-nous
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Une question, une demande spécifique ou besoin d&apos;assistance ? Notre équipe est
                là pour vous aider.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h2 className="font-playfair text-3xl font-bold mb-8">Nos coordonnées</h2>

                <div className="space-y-6">
                  {config.adresse && (
                    <Card className="border-primary/20 bg-card shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-2">Adresse</h3>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {config.adresse}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {config.tel && (
                    <Card className="border-primary/20 bg-card shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-2">Téléphone</h3>
                            <p className="text-muted-foreground whitespace-pre-line">{config.tel}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {config.email && (
                    <Card className="border-primary/20 bg-card shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-2">Email</h3>
                            <a
                              href={`mailto:${config.email}`}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              {config.email}
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Fallback si aucune coordonnée */}
                  {!config.adresse && !config.tel && !config.email && (
                    <p className="text-muted-foreground">
                      Utilisez le formulaire ci-contre pour nous contacter.
                    </p>
                  )}
                </div>

                {/* Horaires */}
                {hasHoraires && (
                  <div className="mt-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="font-playfair text-2xl font-bold">Horaires d&apos;ouverture</h3>
                    </div>
                    <ul className="space-y-2 text-muted-foreground">
                      {config.jourouverture!.map((jour, i) => (
                        <li key={i} className="flex justify-between border-b border-border pb-2">
                          <span>{jour}</span>
                          <span>{config.heureouverture?.[i] ?? ""}</span>
                        </li>
                      ))}
                      {config.jourfermeture?.map((jour, i) => (
                        <li key={`f-${i}`} className="flex justify-between border-b border-border pb-2">
                          <span>{jour}</span>
                          <span className="text-destructive">{config.heurefermeture?.[i] ?? "Fermé"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="font-playfair text-3xl font-bold mb-8">Envoyez-nous un message</h2>

                <Card className="border-primary/20 bg-card shadow-lg">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium">
                            Nom complet
                          </label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Votre nom"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium">
                            Email
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium">
                          Sujet
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="Sujet de votre message"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium">
                          Message
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Votre message..."
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Envoi en cours...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer le message
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        {mapSrc && (
          <section className="py-16 md:py-24 bg-muted">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">Nous trouver</h2>
                <p className="text-lg text-muted-foreground">
                  Venez nous rendre visite pour découvrir notre gamme complète de produits.
                </p>
              </div>

              <div className="aspect-[16/9] w-full bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Localisation ${config.nom}`}
                />
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-primary py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-black mb-6">
                Prêt à commencer ?
              </h2>
              <p className="mt-4 max-w-2xl text-lg md:text-xl text-black/80 mb-8">
                Découvrez notre sélection de produits et passez votre commande dès aujourd&apos;hui.
              </p>
              <Button asChild size="lg" className="bg-black text-white hover:bg-black/90">
                <Link href="/produits-public">Explorer nos produits</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer
        facebook={config.facebook}
        instagram={config.instagram}
        twitter={config.twitter}
        nom={config.nom}
      />
    </div>
  )
}
