"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Package, User, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Footer } from "@/components/layout/footer"
import { approvisionnementService, produitService, fournisseurService } from "@/services"
import type { Approvisionnement } from "@/types/approvisionnement"
import type { Produit } from "@/types/produit"
import type { Fournisseur } from "@/types/fournisseur"
import { PermissionGuard } from "@/components/permissions"

export default function ApprovisionnementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [approvisionnement, setApprovisionnement] = useState<Approvisionnement | null>(null)
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const approRes = await approvisionnementService.getById(parseInt(resolvedParams.id))
        const approData = (approRes.data as any).data || approRes.data
        setApprovisionnement(approData)

        // Charger le fournisseur
        if (approData.fournisseurId) {
          const fournRes = await fournisseurService.getById(approData.fournisseurId)
          setFournisseur(fournRes.data)
        }

        // Charger tous les produits
        const produitsRes = await produitService.getAll()
        setProduits(Array.isArray(produitsRes.data) ? produitsRes.data : (produitsRes.data as any).data || [])
      } catch (error) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger l'approvisionnement",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [resolvedParams.id, toast])

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cet approvisionnement ?")) return

    try {
      await approvisionnementService.delete(parseInt(resolvedParams.id))
      toast({
        title: "Approvisionnement supprimé",
        description: "L'approvisionnement a été supprimé avec succès",
      })
      router.push("/magasinier/approvisionnements")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'approvisionnement",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!approvisionnement) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h1 className="text-2xl font-bold">Approvisionnement non trouvé</h1>
              <p className="text-muted-foreground">L'approvisionnement que vous recherchez n'existe pas.</p>
              <Button asChild>
                <Link href="/magasinier/approvisionnements">Retour à la liste</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getProduitById = (id: number) => produits.find((p) => p.id === id)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/magasinier/approvisionnements">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Détails de l'approvisionnement #{approvisionnement.id}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
            <PermissionGuard permissions={["approvisionnement.update"]} >
              <Button variant="outline" asChild>
                <Link href={`/magasinier/approvisionnements/${resolvedParams.id}/modifier`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
           </PermissionGuard>
            <PermissionGuard permissions={["approvisionnement.delete"]} >
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
              </PermissionGuard>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Référence:</span>
                  <span className="font-medium">#{approvisionnement.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {new Date(approvisionnement.dateApprovisionnement).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge variant="default">Reçu</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {fournisseur ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="font-medium">{fournisseur.prenom} {fournisseur.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Téléphone:</span>
                      <span className="font-medium">{fournisseur.tel}</span>
                    </div>
                    {fournisseur.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{fournisseur.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adresse:</span>
                      <span className="font-medium">{fournisseur.adresse}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun fournisseur</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Résumé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produits:</span>
                  <span className="font-medium">{approvisionnement.lignes?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantité totale:</span>
                  <span className="font-medium">
                    {approvisionnement.lignes?.reduce((sum, l) => sum + l.quantite, 0) || 0}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Montant total:</span>
                  <span>{(approvisionnement.montant || 0).toFixed(2)} FCFA</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Produits approvisionnés</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Date fabrication</TableHead>
                    <TableHead>Date péremption</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Prix achat/u</TableHead>
                    <TableHead className="text-right">Prix vente/u</TableHead>
                    <TableHead className="text-right">Marge/u</TableHead>
                    <TableHead className="text-right">Total achat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvisionnement.lignes?.map((ligne) => {
                    const produit = getProduitById(Number(ligne.produitId)) || (ligne as any).produit
                    const prixAchat = ligne.montant / (ligne.quantite || 1)
                    const prixVente = produit?.prixDeVenteUnitaire ?? 0
                    const marge = prixVente - prixAchat
                    const margePct = prixAchat > 0 ? ((marge / prixAchat) * 100).toFixed(1) : null
                    return (
                      <TableRow key={ligne.id}>
                        <TableCell className="font-medium">
                          {produit?.libelle || 'Produit inconnu'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(ligne as any).dateFabrication ? new Date((ligne as any).dateFabrication).toLocaleDateString('fr-FR') : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(ligne as any).datePeremption ? new Date((ligne as any).datePeremption).toLocaleDateString('fr-FR') : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">{prixAchat.toLocaleString()} FCFA</TableCell>
                        <TableCell className="text-right">{prixVente > 0 ? `${prixVente.toLocaleString()} FCFA` : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className={`text-right font-semibold ${marge >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {prixVente > 0 ? (
                            <span title={`${margePct}%`}>{marge.toLocaleString()} FCFA {margePct ? `(${margePct}%)` : ""}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {ligne.montant.toLocaleString()} FCFA
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
