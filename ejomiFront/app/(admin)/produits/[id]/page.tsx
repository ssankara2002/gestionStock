"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Edit, Trash2, Package, ShoppingBag, AlertTriangle, TrendingUp, Calendar } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/components/layout/footer"
import { produitService } from "@/services"
import type { Produit } from "@/types/produit"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/permissions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { toast } = useToast()
  const router = useRouter()
  const [product, setProduct] = useState<Produit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await produitService.getById(resolvedParams.id)
        setProduct(res.data.data)
      } catch {
        toast({ title: "Erreur", description: "Impossible de charger le produit.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [resolvedParams.id, toast])

  const handleDelete = async () => {
    try {
      await produitService.delete(resolvedParams.id)
      toast({ title: "Succès", description: "Produit supprimé avec succès." })
      router.push("/produits")
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer le produit.", variant: "destructive" })
    }
  }

  if (loading || !product) {
    return (
      <div className="container py-8 text-center">
        {loading ? "Chargement..." : "Produit introuvable."}
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:3000"
  const imageUrl = product.image ? `${baseUrl}/uploads/${product.image}` : "/placeholder.svg?height=400&width=400"

  const stockMagasinQte = product.stockMagasin?.quantite ?? 0
  const stockMagasinSeuil = product.stockMagasin?.seuilAlerte ?? 0
  const stockBoutiqueQte = product.stockBoutique?.quantite ?? 0
  const stockBoutiqueSeuil = product.stockBoutique?.seuilAlerte ?? 0

  const marge = product.prixDeVenteUnitaire - product.prixAchatUnitaire
  const margePct = product.prixAchatUnitaire > 0
    ? ((marge / product.prixAchatUnitaire) * 100).toFixed(1)
    : "—"

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">

          {/* En-tête */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" asChild>
                <Link href="/produits">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{product.libelle}</h1>
                <p className="text-sm text-muted-foreground">Référence #{product.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <PermissionGuard permission="produit.update">
                <Button asChild variant="outline">
                  <Link href={`/produits/${product.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="produit.delete">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le produit sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Confirmer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </PermissionGuard>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Colonne gauche : image + infos de base */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-square rounded-t-lg overflow-hidden bg-muted">
                    <Image src={imageUrl} alt={product.libelle} fill className="object-cover" />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                    <p className="text-sm">{product.description || "Aucune description"}</p>
                  </div>
                </CardContent>
              </Card>

              {product.createdAt && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Créé le</span>
                      <span>{format(new Date(product.createdAt), "dd MMM yyyy", { locale: fr })}</span>
                    </div>
                    {product.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Modifié le</span>
                        <span>{format(new Date(product.updatedAt), "dd MMM yyyy", { locale: fr })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Colonne droite : prix + stocks */}
            <div className="lg:col-span-2 space-y-6">

              {/* Prix */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tarification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prix d'achat</p>
                      <p className="text-lg font-bold">{Number(product.prixAchatUnitaire).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prix de vente</p>
                      <p className="text-lg font-bold text-primary">{Number(product.prixDeVenteUnitaire).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Marge</p>
                      <p className="text-lg font-bold text-green-700">{Number(marge).toLocaleString()}</p>
                      <p className="text-xs text-green-600">{margePct}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Magasin */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Stock Magasin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-3xl font-bold">{stockMagasinQte}</p>
                      <p className="text-sm text-muted-foreground">unités disponibles</p>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={stockMagasinQte > stockMagasinSeuil ? "outline" : "destructive"}>
                        {stockMagasinQte > stockMagasinSeuil ? "Niveau normal" : "Stock bas"}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <AlertTriangle className="h-3 w-3" />
                        Seuil d'alerte : {stockMagasinSeuil}
                      </div>
                    </div>
                  </div>
                  {stockMagasinQte <= stockMagasinSeuil && (
                    <div className="mt-4 p-3 bg-destructive/10 border-l-4 border-destructive rounded text-sm text-destructive font-medium">
                      ⚠️ Stock en dessous du seuil d'alerte — réapprovisionnement recommandé
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock Boutique */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Stock Boutique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-3xl font-bold">{stockBoutiqueQte}</p>
                      <p className="text-sm text-muted-foreground">unités disponibles</p>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={stockBoutiqueQte > stockBoutiqueSeuil ? "outline" : "destructive"}>
                        {stockBoutiqueQte > stockBoutiqueSeuil ? "Niveau normal" : "Stock bas"}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <AlertTriangle className="h-3 w-3" />
                        Seuil d'alerte : {stockBoutiqueSeuil}
                      </div>
                    </div>
                  </div>
                  {stockBoutiqueQte <= stockBoutiqueSeuil && (
                    <div className="mt-4 p-3 bg-destructive/10 border-l-4 border-destructive rounded text-sm text-destructive font-medium">
                      ⚠️ Stock en dessous du seuil d'alerte — transfert depuis le magasin recommandé
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
