import Link from "next/link"
import Image from "next/image"
import { Users, History, Target, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HomeHeader } from "@/components/layout/home-header"
import { Footer } from "@/components/layout/footer"
import { EquipeSection } from "@/components/shared/equipe-section"

export default function AboutPage() {
  return (
          <div className="flex flex-col min-h-screen w-full">
      <HomeHeader />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Notre Histoire</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Depuis plus de 15 ans, GoldTech est le leader dans la fourniture d'équipements de détection d'or et de
                  métaux précieux. Notre passion pour la prospection nous a conduits à sélectionner les meilleurs outils
                  pour les chercheurs d'or professionnels et amateurs.
                </p>
                <Button asChild className="btn-gold">
                  <Link href="/contact">Contactez-nous</Link>
                </Button>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=800&width=600"
                  alt="L'équipe GoldTech"
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
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">Notre Mission & Vision</h2>
              <p className="text-lg text-muted-foreground">
                Nous nous engageons à fournir des équipements de la plus haute qualité pour permettre à nos clients de
                vivre pleinement leur passion pour la prospection.
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
                    <p className="text-muted-foreground flex-grow">
                      Fournir des équipements de détection d'or et de métaux précieux de la plus haute qualité,
                      accompagnés d'un service client exceptionnel, pour permettre à nos clients de maximiser leurs
                      chances de découvertes.
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
                    <p className="text-muted-foreground flex-grow">
                      Devenir la référence mondiale dans le domaine des équipements de prospection, en innovant
                      constamment et en partageant notre passion avec une communauté grandissante de chercheurs d'or.
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
                Découvrez les experts passionnés qui composent l'équipe GoldTech et qui travaillent chaque jour pour
                vous offrir le meilleur service.
              </p>
            </div>

            <EquipeSection />
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">Nos Valeurs</h2>
              <p className="text-lg text-muted-foreground">
                Les principes qui guident nos actions et nos décisions au quotidien.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-primary/20 bg-card shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-playfair text-xl font-bold mb-3">Excellence</h3>
                  <p className="text-muted-foreground">
                    Nous nous efforçons d'offrir les meilleurs produits et services, sans compromis sur la qualité.
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
                    Nous créons des liens durables avec nos clients et partageons notre passion commune.
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
                    Nous recherchons constamment de nouvelles technologies pour améliorer l'expérience de prospection.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-black mb-6">
                Rejoignez l'aventure GoldTech
              </h2>
              <p className="mt-4 max-w-2xl text-lg md:text-xl text-black/80 mb-8">
                Découvrez notre sélection d'équipements premium et commencez votre propre aventure de prospection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-black text-white hover:bg-black/90">
                  <Link href="/produits-public">Voir nos produits</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-black text-black hover:bg-black/10">
                  <Link href="/contact">Contactez-nous</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
