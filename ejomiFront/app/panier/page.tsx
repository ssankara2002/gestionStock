"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/components/layout/footer"
import { HomeHeader } from "@/components/layout/home-header"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-provider"

export default function CartPage() {
  const { items: cart, updateQuantity, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Calculate totals (without VAT)
  const subtotal = cart.reduce((total, item) => total + item.product.prixDeVenteUnitaire * item.quantity, 0)
  const shipping = subtotal > 0 ? 9.99 : 0
  const total = subtotal + shipping

  // Handle checkout
  const handleCheckout = () => {
    setIsCheckingOut(true)
    // Simulate checkout process
    setTimeout(() => {
      clearCart()
      setIsCheckingOut(false)
      // In a real app, redirect to success page or handle payment
    }, 2000)
  }

  return (
      <div className="flex flex-col min-h-screen w-full">
         <HomeHeader />
         <main className="flex-1 w-full">
        <div className="container py-8">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/produits" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuer mes achats
            </Link>
          </Button>

          <h1 className="font-playfair text-3xl font-bold md:text-4xl">Votre Panier</h1>

          {cart.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-medium">Votre panier est vide</h2>
              <p className="mt-2 text-muted-foreground">
                Ajoutez des produits à votre panier pour commencer vos achats
              </p>
              <Button asChild className="mt-6 btn-gold">
                <Link href="/produits">Découvrir nos produits</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Articles ({cart.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={
                              (item.product as any)?.image
                                ? ((item.product as any).image.startsWith("http")
                                    ? (item.product as any).image
                                    : `${process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost'}/uploads/${(item.product as any).image}`)
                                : "/placeholder.svg?height=96&width=96"
                            }
                            alt={(item.product as any)?.libelle || 'Produit'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{(item.product as any)?.libelle || 'Produit'}</h3>
                              <p className="text-sm text-muted-foreground">Réf: {(item.product as any)?.id || ''}</p>
                            </div>
                            <p className="font-medium">{(((item.product as any)?.prixDeVenteUnitaire || 0) * item.quantity).toFixed(2)} FCFA</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <div className="flex h-8 w-10 items-center justify-center border-y border-input bg-background">
                                {item.quantity}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeItem(item.product.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={clearCart}>
                      Vider le panier
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/produits">Continuer mes achats</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{subtotal.toFixed(2)} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span>{shipping.toFixed(2)} FCFA</span>
                    </div>
                    {/* TVA retirée - non applicable */}
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{total.toFixed(2)} FCFA</span>
                    </div>

                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm">
                        {user
                          ? `Vous êtes connecté en tant que ${user.prenom} ${user.nom}`
                          : "Connectez-vous pour accéder à vos avantages client"}
                      </p>
                      {!user && (
                        <div className="mt-2 flex gap-2">
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <Link href="/auth/login">Se connecter</Link>
                          </Button>
                          <Button asChild size="sm" className="w-full">
                            <Link href="/auth/register">S'inscrire</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full btn-gold" size="lg" onClick={handleCheckout} disabled={isCheckingOut}>
                      {isCheckingOut ? "Traitement en cours..." : "Procéder au paiement"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
