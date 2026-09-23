"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/layout/footer"
import { HomeHeader } from "@/components/layout/home-header"
import type { Produit } from "@/types/produit"
import apiClient from "@/services/api-client"

export default function ProduitsPublicPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const res = await apiClient.get("/produits/public")
        setProduits(res.data.data || [])
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduits()
  }, [])

  // Filtrage
  const filteredProducts = produits.filter((product) => {
    const matchesSearch =
      product.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    return matchesSearch
  })

  return (
    <div className="flex flex-col min-h-screen w-full">
      <HomeHeader />
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="font-playfair text-2xl sm:text-3xl font-bold md:text-4xl">Nos Produits</h1>
              <p className="mt-1 text-muted-foreground">
                Découvrez notre catalogue de produits
              </p>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-9 md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Loader */}
          {loading ? (
            <div className="mt-16 text-center text-muted-foreground">Chargement des produits...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center border border-dashed rounded-lg p-8">
              <h3 className="text-lg font-medium">Aucun produit trouvé</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Essayez de modifier votre recherche
              </p>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-12">
              {filteredProducts.map((product) => {
                const baseUrl = process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost"
                const imageUrl = product.image
                  ? (product.image.startsWith("http") ? product.image : `${baseUrl}/uploads/${product.image}`)
                  : "/placeholder.svg?height=300&width=400"

                return (
                  <Card key={product.id} className="card-product overflow-hidden">
                    <div className="aspect-square w-full relative">
                      <Image
                        src={imageUrl}
                        alt={product.libelle}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <h3 className="font-playfair text-xl font-bold line-clamp-2">{product.libelle}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
