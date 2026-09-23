"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Users, History, Target, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HomeHeader } from "@/components/layout/home-header"
import { Footer } from "@/components/layout/footer"
import { EquipeSection } from "@/components/shared/equipe-section"
import { entrepriseService } from "@/services/entreprise-service"

interface EntrepriseConfig {
  id: number
  nom: string
  logo?: string
  histoire?: string
  mission?: string
  vision?: string
  valeur?: string
  facebook?: string
  instagram?: string
  twitter?: string
  heroImage?: string
}

const DEFAULTS: EntrepriseConfig = {
  id: 0,
  nom: "Notre Entreprise",
  histoire:
    "Depuis plusieurs années, notre entreprise s'engage à offrir des produits et services de qualité. Notre passion et notre expertise nous ont conduits à développer une relation de confiance avec nos clients.",
  mission:
    "Fournir des produits et services de la plus haute qualité, accompagnés d'un service client exceptionnel, pour permettre à nos clients de satisfaire leurs besoins.",
  vision:
    "Devenir la référence dans notre domaine, en innovant constamment et en partageant notre passion avec une communauté grandissante de clients fidèles.",
  valeur:
    "Excellence, intégrité, innovation et service client sont les valeurs qui guident chacune de nos actions au quotidien.",
}

export default function AboutPage() {
  const [config, setConfig] = useState<EntrepriseConfig>(DEFAULTS)

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

  const baseUrl =
    process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost"

  const heroImageUrl = config.heroImage
    ? `${baseUrl}/uploads/${config.heroImage}`
    : "/placeholder.svg?height=800&width=600"

  return (
    <div className="flex flex-col min-h-screen w-full">
      <HomeHeader logo={config.logo} nom={config.nom} />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Notre Histoire
                </h1>
                <p className="text-lg text-muted-foreground mb-8 whitespace-pre-line">
                  {config.histoire || DEFAULTS.histoire}
                </p>
                <Button asChild className="btn-gold">
                  <Link href="/contact">Contactez-nous</Link>
                </Button>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <Image
                  src={heroImageUrl}
                  alt={`L'équipe ${config.nom}`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">
                Notre Mission & Vision
              </h2>
              <p className="text-lg text-muted-foreground">
                Nous nous engageons à fournir le meilleur à nos clients chaque jour.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-primary/20 bg-card shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-6">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-playfair text-2xl font-bold mb-4">Notre Mission</h3>
                    <p className="text-muted-foreground flex-grow whitespace-pre-line">
                      {config.mission || DEFAULTS.mission}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-6">
                      <History className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-playfair text-2xl font-bold mb-4">Notre Vision</h3>
                    <p className="text-muted-foreground flex-grow whitespace-pre-line">
                      {config.vision || DEFAULTS.vision}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">Notre Équipe</h2>
              <p className="text-lg text-muted-foreground">
                Découvrez les experts passionnés qui composent l&apos;équipe {config.nom} et qui
                travaillent chaque jour pour vous offrir le meilleur service.
              </p>
            </div>
            <EquipeSection />
          </div>
        </section>

        {/* Values */}
        {config.valeur && (
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">Nos Valeurs</h2>
                <p className="text-lg text-muted-foreground whitespace-pre-line">{config.valeur}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-primary/20 bg-card shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-playfair text-xl font-bold mb-3">Excellence</h3>
                    <p className="text-muted-foreground">
                      Nous nous efforçons d&apos;offrir les meilleurs produits et services, sans
                      compromis sur la qualité.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-playfair text-xl font-bold mb-3">Communauté</h3>
                    <p className="text-muted-foreground">
                      Nous créons des liens durables avec nos clients et partageons notre passion
                      commune.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-playfair text-xl font-bold mb-3">Innovation</h3>
                    <p className="text-muted-foreground">
                      Nous recherchons constamment de nouvelles façons d&apos;améliorer l&apos;expérience de
                      nos clients.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-primary py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-black mb-6">
                Rejoignez l&apos;aventure {config.nom}
              </h2>
              <p className="mt-4 max-w-2xl text-lg md:text-xl text-black/80 mb-8">
                Découvrez notre sélection de produits et commencez votre expérience avec nous.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-black text-white hover:bg-black/90">
                  <Link href="/produits-public">Voir nos produits</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-black text-black hover:bg-black/10"
                >
                  <Link href="/contact">Contactez-nous</Link>
                </Button>
              </div>
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
