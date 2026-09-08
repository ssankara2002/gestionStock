"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Award, Shield, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Footer } from "@/components/layout/footer"
import { HomeHeader } from "@/components/layout/home-header"
import { produitService } from "@/services"
import { entrepriseService } from "@/services/entreprise-service"
import type { Produit } from "@/types/produit"
import { useAuth } from "@/context/auth-provider"

interface EntrepriseConfig {
  id: number
  nom: string
  heroTitre: string
  heroSousTitre: string
  heroImage?: string
  feature1Titre: string
  feature1Desc: string
  feature2Titre: string
  feature2Desc: string
  feature3Titre: string
  feature3Desc: string
  ctaTitre: string
  ctaSousTitre: string
  facebook?: string
  instagram?: string
  twitter?: string
  logo?: string
}

const DEFAULTS: EntrepriseConfig = {
  id: 0,
  nom: "StockManager",
  heroTitre: "Gérez votre stock efficacement",
  heroSousTitre: "La solution complète pour les entreprises qui veulent garder le contrôle de leur inventaire",
  feature1Titre: "Qualité Premium",
  feature1Desc: "Une application fiable, testée et approuvée par des professionnels.",
  feature2Titre: "Sécurité",
  feature2Desc: "Vos données sont protégées avec les meilleures pratiques de sécurité.",
  feature3Titre: "Rapidité",
  feature3Desc: "Interface rapide et intuitive pour gérer votre stock au quotidien.",
  ctaTitre: "Prêt à commencer ?",
  ctaSousTitre: "Créez votre espace entreprise et gérez votre stock dès aujourd'hui.",
}

const CLIENT_ROLES = ["CLIENT"]

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<EntrepriseConfig>(DEFAULTS)

  const showDashboardBtn =
    isAuthenticated && user?.role?.name && !CLIENT_ROLES.includes(user.role.name)

  useEffect(() => {
    const entrepriseId = typeof window !== "undefined" ? localStorage.getItem("entrepriseId") : null

    const fetchEntreprise = async () => {
      if (!entrepriseId) return
      try {
        const res = await entrepriseService.getById(Number(entrepriseId))
        if (res.data?.data) setConfig({ ...DEFAULTS, ...res.data.data })
      } catch {}
    }

    const fetchProducts = async () => {
      try {
        const res = await produitService.getAll()
        const allProducts = res.data.data || []
        setFeaturedProducts(allProducts.slice(0, 6))
      } catch {}
      finally { setLoading(false) }
    }

    fetchEntreprise()
    fetchProducts()
  }, [])

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3002"

  return (
    <div className="flex flex-col min-h-screen w-full">
      <HomeHeader logo={config.logo} nom={config.nom} />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative w-full">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div
            className="relative h-[500px] md:h-[600px] w-full bg-cover bg-center"
            style={{ backgroundImage: config.heroImage ? `url(${baseUrl}/uploads/${config.heroImage})` : "url('/placeholder.svg?height=600&width=1200')" }}
          >
            <div className="container relative z-20 flex h-full flex-col items-center justify-center text-center">
              <h1 className="font-playfair text-4xl font-bold text-primary md:text-6xl">{config.heroTitre}</h1>
              <p className="mt-4 max-w-2xl text-lg text-white md:text-xl">{config.heroSousTitre}</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="btn-gold">
                  <Link href="/produits-public">Découvrir nos produits</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  <Link href="/contact">Nous contacter</Link>
                </Button>
                {showDashboardBtn && (
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/gerant/dashboard">Tableau de bord</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24">
          <div className="container">
            <h2 className="text-center font-playfair text-3xl font-bold md:text-4xl">Pourquoi nous choisir ?</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                { icon: Award, titre: config.feature1Titre, desc: config.feature1Desc },
                { icon: Shield, titre: config.feature2Titre, desc: config.feature2Desc },
                { icon: Truck, titre: config.feature3Titre, desc: config.feature3Desc },
              ].map(({ icon: Icon, titre, desc }) => (
                <Card key={titre} className="border-primary/20 bg-card">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 font-playfair text-xl font-bold">{titre}</h3>
                    <p className="mt-2 text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <h2 className="font-playfair text-3xl font-bold md:text-4xl">Produits Populaires</h2>
              <Button asChild variant="link" className="text-primary">
                <Link href="/produits-public" className="flex items-center">
                  Voir tous les produits <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-12">Chargement des produits...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucun produit disponible pour le moment.</div>
            ) : (
              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product) => {
                  const imageUrl = product.image
                    ? (product.image.startsWith("http") ? product.image : `${baseUrl}/uploads/${product.image}`)
                    : "/placeholder.svg?height=300&width=400"
                  return (
                    <Card key={product.id} className="card-product overflow-hidden">
                      <div className="aspect-[4/3] w-full relative">
                        <Image src={imageUrl} alt={product.libelle} fill className="object-cover" />
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-playfair text-xl font-bold">{product.libelle}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        {/* <section className="bg-primary py-16 md:py-24">
          <div className="container flex flex-col items-center text-center">
            <h2 className="font-playfair text-3xl font-bold text-black md:text-4xl">{config.ctaTitre}</h2>
            <p className="mt-4 max-w-2xl text-lg text-black/80">{config.ctaSousTitre}</p>
            <Button asChild size="lg" className="mt-8 bg-black text-white hover:bg-black/90">
              <Link href="/auth/register">Créer mon espace entreprise</Link>
            </Button>
          </div>
        </section> */}
      </main>

      <Footer facebook={config.facebook} instagram={config.instagram} twitter={config.twitter} nom={config.nom} />
    </div>
  )
}
