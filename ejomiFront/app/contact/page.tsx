"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { HomeHeader } from "@/components/layout/home-header"
import { Footer } from "@/components/layout/footer"
import { useToast } from "@/hooks/use-toast"
import { contactService } from "@/services/contact-service"

export default function ContactPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      })
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

  return (
          <div className="flex flex-col min-h-screen w-full">
      <HomeHeader />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Contactez-nous</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Une question, une demande spécifique ou besoin d'assistance ? Notre équipe est là pour vous aider.
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

                <div className="space-y-8">
                  <Card className="border-primary/20 bg-card shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">Adresse</h3>
                          <p className="text-muted-foreground">
                            Ouagadougou, BURKINA FASO
                            <br />
                            Quartier OUIDI
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-card shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">Téléphone</h3>
                          <p className="text-muted-foreground">
                           +226 65194975
                            <br />
                           +226 70312482
                            <br />
                           +226 79340293
                            <br />
                            Lun-Ven: 8h-17h
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-card shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">Email</h3>
                          <p className="text-muted-foreground">
                           ouedraogo01@gmail.com
                            <br />
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-12">
                  <h3 className="font-playfair text-2xl font-bold mb-4">Horaires d'ouverture</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Lundi - Vendredi:</span>
                      <span>9h00 - 18h00</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Samedi:</span>
                      <span>10h00 - 16h00</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Dimanche:</span>
                      <span>Fermé</span>
                    </li>
                  </ul>
                </div>
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
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
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
        <section className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">Nous trouver</h2>
              <p className="text-lg text-muted-foreground">
                Venez nous rendre visite dans notre showroom pour découvrir notre gamme complète d'équipements.
              </p>
            </div>

            <div className="aspect-[16/9] w-full bg-gray-200 rounded-lg overflow-hidden shadow-lg">
              {/* Google Maps iframe pour Ouagadougou, BURKINA FASO */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3900.8!2d-1.5394567!3d12.3786183!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTLCsDIyJzQzLjAiTiAxwrAzMicyMi4wIlc!5e0!3m2!1sfr!2sfr!4v1234567890!5m2!1sfr!2sfr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation Ejomi - Ouagadougou, BURKINA FASO"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {/* <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">Questions fréquentes</h2>
              <p className="text-lg text-muted-foreground">
                Vous avez des questions ? Consultez nos réponses aux questions les plus fréquemment posées.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  question: "Quels sont les délais de livraison ?",
                  answer:
                    "Nous expédions tous les produits en stock sous 24h. Les délais de livraison varient ensuite selon votre localisation, généralement entre 2 et 5 jours ouvrés.",
                },
                {
                  question: "Proposez-vous des formations pour l'utilisation des détecteurs ?",
                  answer:
                    "Oui, nous organisons régulièrement des sessions de formation pour nos clients. Contactez-nous pour connaître les prochaines dates disponibles.",
                },
                {
                  question: "Quelle est la durée de la garantie sur vos produits ?",
                  answer:
                    "Tous nos produits sont garantis minimum 2 ans. Certains modèles premium bénéficient d'une garantie étendue jusqu'à 5 ans.",
                },
                {
                  question: "Puis-je tester les équipements avant achat ?",
                  answer:
                    "Absolument ! Vous pouvez venir dans notre showroom pour tester nos équipements. Nous vous recommandons de prendre rendez-vous au préalable.",
                },
              ].map((faq, index) => (
                <Card key={index} className="border-primary/20 bg-card shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">Vous ne trouvez pas la réponse à votre question ?</p>
              <Button asChild className="btn-gold">
                <Link href="#contact-form">Contactez-nous directement</Link>
              </Button>
            </div>
          </div>
        </section> */}

        {/* CTA Section */}
        <section className="bg-primary py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-black mb-6">
                Prêt à commencer votre aventure ?
              </h2>
              <p className="mt-4 max-w-2xl text-lg md:text-xl text-black/80 mb-8">
                Découvrez notre sélection d'équipements premium pour la détection d'or et de métaux précieux.
              </p>
              <Button asChild size="lg" className="bg-black text-white hover:bg-black/90">
                <Link href="/produits">Explorer nos produits</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
