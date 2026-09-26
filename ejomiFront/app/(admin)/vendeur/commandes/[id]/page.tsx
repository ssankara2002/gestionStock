"use client"
import { useState, useEffect, use } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ArrowLeft,
  FileText,
  Printer,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  TruckIcon,
  Clock,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { commandesService } from "@/services/commande-service"
import { useToast } from "@/hooks/use-toast"
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
import type { Commande } from "@/types"
import { RecuCommande } from "@/components/commandes/recu-commande"
import { paiementsService } from "@/services/paiement-service"
import { FormulairePaiement } from "@/components/paiements/formulaire-paiement"
import { ListePaiements } from "@/components/paiements/liste-paiements"
import type { SoldePaiement } from "@/types/paiement"
import { PermissionGuard } from "@/components/permissions"

export default function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const [commande, setCommande] = useState<Commande | null>(null)
  const [loading, setLoading] = useState(true)
  const [solde, setSolde] = useState<SoldePaiement | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const loadPaiementData = async () => {
    try {
      // Fetch payments list for the commande and compute totals client-side
      const res = await fetch(`/api/paiements/commande/${unwrappedParams.id}`)
      if (!res.ok) {
        setSolde(null)
        return
      }
      const body = await res.json()
      const paiementsList = body?.data || []

      // Compute total paid from payments with statut === 'REUSSI'
      const totalPaye = paiementsList
        .filter((p: any) => String(p.statut).toUpperCase() === 'REUSSI')
        .reduce((acc: number, p: any) => acc + Number(p.montant || 0), 0)

      const totalAPayer = (commande.lignes || []).reduce((sum, ligne) => sum + ligne.montant, 0) - ((commande as any).reduction || 0)
      const creance = Math.max(0, totalAPayer - totalPaye)

      setSolde({ total: totalAPayer, totalPaye, creance, paiements: paiementsList })
    } catch (err) {
      console.error("Impossible de charger le solde", err)
    }
  }

  useEffect(() => {
    const loadCommande = async () => {
      try {
        setLoading(true)
        const response = await commandesService.getById(unwrappedParams.id)
        // @ts-ignore - API response structure
        const payload = response.data?.data || response.data
        setCommande(payload)

        // If the API already included paymentSummary, use it to set solde
        if (payload && payload.paymentSummary) {
          setSolde({
            total: Number(payload.paymentSummary.total || 0),
            totalPaye: Number(payload.paymentSummary.totalPaye || 0),
            creance: Number(payload.paymentSummary.creance || 0),
            paiements: payload.paiements || [],
          })
        } else {
          // fallback to fetching payments separately
          await loadPaiementData()
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement de la commande:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger la commande",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadCommande()
  }, [unwrappedParams.id, toast])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <main className="flex-1 w-full">
          <div className="container py-8">
            <p className="text-center">Chargement de la commande...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!commande) {
    return notFound()
  }

  // Calculer les totaux (sans TVA)
  const sousTotal = commande.lignes?.reduce((total, ligne) => total + ligne.montant, 0) || 0
  const total = sousTotal - (commande.reduction || 0)

  // Marge FIFO depuis margeSummary (retourné par l'API) ou calcul local
  const margeSummary = (commande as any).margeSummary
  const coutRevientTotal = margeSummary?.coutRevient ?? (commande.lignes || []).reduce((s, l) => s + (Number((l as any).coutRevient ?? 0) * Number((l as any).quantiteCommande ?? (l as any).quantite ?? 0)), 0)
  const margeTotal = margeSummary?.marge ?? (total - coutRevientTotal)
  const margePct = coutRevientTotal > 0 ? ((margeTotal / coutRevientTotal) * 100).toFixed(1) : null

  // Fonction pour supprimer la commande
  const handleDelete = async () => {
    try {
      await commandesService.delete(commande!.id.toString())
      toast({
        title: "Succès",
        description: "La commande a été supprimée avec succès.",
      })
      router.push("/vendeur/commandes")
      router.refresh()
    } catch (error) {
      console.error("Erreur lors de la suppression de la commande:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la commande.",
        variant: "destructive",
      })
    }
  }

  const telechargerPdf = async (type: 'recu' | 'facture') => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/commandes/${type}?id=${commande.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error(`Erreur lors de la génération du ${type}`)

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      console.error("Erreur:", error)
      toast({ title: "Erreur", description: `Impossible de télécharger le ${type}`, variant: "destructive" })
    }
  }

  const estPayee = ['LIVREE', 'payée'].includes(commande?.statut || '')

  return (
    <div className="container mx-auto py-6">
      {solde && solde.creance > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-orange-800">Paiement incomplet</p>
              <p className="text-sm text-orange-700">
                Cette commande a une créance de <span className="font-bold">{solde.creance.toLocaleString()} FCFA</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vendeur/commandes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Détails de la vente #{commande.id}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {estPayee && (
            <Button variant="outline" onClick={() => telechargerPdf('recu')}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger reçu
            </Button>
          )}
          <Button variant="outline" onClick={() => telechargerPdf('facture')}>
            <FileText className="h-4 w-4 mr-2" />
            Facture
          </Button>
          <PermissionGuard permission="commande.update">
              
              <Button asChild variant="default">
                <Link href={`/vendeur/commandes/${commande.id}/modifier`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Link>
              </Button>
          </PermissionGuard>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <PermissionGuard permission="commande.delete">
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </PermissionGuard>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette commande ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le stock des produits sera restauré.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Confirmer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Détails de la vente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Référence</span>
              <span className="font-medium">#{commande.id}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Date</span>
              <span className="font-medium">{format(new Date(commande.dateCommande), "PPP", { locale: fr })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
            <CardDescription>Informations du client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Nom</span>
              <span className="font-medium">
                {commande.client?.prenom || ""} {commande.client?.nom || ""}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Email</span>
              <span className="font-medium break-all">{commande.client?.email || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Téléphone</span>
              <span className="font-medium">{commande.client?.tel || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Adresse</span>
              <span className="font-medium">{commande.client?.adresse || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
            <CardDescription>État des paiements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produits:</span>
              <span className="font-medium">{(commande.lignes || []).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total:</span>
              <span className="font-medium">{sousTotal.toLocaleString()} FCFA</span>
            </div>
            {commande.reduction > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Réduction:</span>
                <span className="font-medium text-red-600">-{(commande.reduction || 0).toLocaleString()} FCFA</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total à payer:</span>
              <span className="text-blue-600">{total.toLocaleString()} FCFA</span>
            </div>
            {solde && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between text-green-600">
                  <span className="font-semibold">Total payé:</span>
                  <span className="font-bold">{Number(solde.totalPaye).toLocaleString()} FCFA</span>
                </div>
                <div className={`flex justify-between ${solde.creance > 0 ? "text-orange-600" : "text-green-600"}`}>
                  <span className="font-semibold">Reste à payer:</span>
                  <span className="font-bold">{Number(solde.creance).toLocaleString()} FCFA</span>
                </div>
                {solde.creance > 0 && (
                  <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-800 font-medium">
                    ⚠️ Paiement incomplet
                  </div>
                )}
                {solde.creance === 0 && solde.totalPaye > 0 && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800 font-medium">
                    ✓ Vente entièrement payée
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Analyse de marge (FIFO)</CardTitle>
            <CardDescription>Coût réel basé sur l'ordre d'entrée en stock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coût de revient:</span>
              <span className="font-medium">{coutRevientTotal.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chiffre d'affaires:</span>
              <span className="font-medium">{total.toLocaleString()} FCFA</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Marge brute:</span>
              <span className={margeTotal >= 0 ? "text-green-600" : "text-red-600"}>
                {margeTotal.toLocaleString()} FCFA
              </span>
            </div>
            {margePct !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taux de marge:</span>
                <span className={`font-bold ${Number(margePct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {margePct}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Produits vendus</CardTitle>
          <CardDescription>Liste des produits dans cette vente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Produit</th>
                  <th className="text-center py-3 px-4">Prix vente</th>
                  <th className="text-center py-3 px-4">Coût revient</th>
                  <th className="text-center py-3 px-4">Qté</th>
                  <th className="text-center py-3 px-4">Marge/u</th>
                  <th className="text-right py-3 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {(commande.lignes || []).map((ligne) => {
                  const qte = Number((ligne as any).quantiteCommande ?? (ligne as any).quantite ?? 0)
                  const coutU = Number((ligne as any).coutRevient ?? 0)
                  const prixU = Number((ligne as any).prixUnitaire ?? ligne.produit?.prixDeVenteUnitaire ?? 0)
                  const margeU = prixU - coutU
                  const hasCout = coutU > 0
                  return (
                    <tr key={ligne.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="font-medium">{ligne.produit ? ligne.produit.libelle : "Produit inconnu"}</div>
                      </td>
                      <td className="text-center py-3 px-4">{prixU.toLocaleString()} FCFA</td>
                      <td className="text-center py-3 px-4 text-muted-foreground">
                        {hasCout ? `${coutU.toLocaleString()} FCFA` : "—"}
                      </td>
                      <td className="text-center py-3 px-4">{qte}</td>
                      <td className={`text-center py-3 px-4 font-semibold ${hasCout ? (margeU >= 0 ? "text-green-600" : "text-red-600") : "text-muted-foreground"}`}>
                        {hasCout ? `${margeU.toLocaleString()} FCFA` : "—"}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">{ligne.montant.toLocaleString()} FCFA</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {solde && solde.creance > 0 && (
        <div className="mb-6">
          <FormulairePaiement
            commandeId={commande.id}
            montantRestant={solde.creance}
            onPaiementEnregistre={loadPaiementData}
          />
        </div>
      )}

      {solde && solde.paiements && solde.paiements.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Historique des paiements</CardTitle>
            <CardDescription>Liste de tous les paiements effectués pour cette vente</CardDescription>
          </CardHeader>
          <CardContent>
            <ListePaiements paiements={solde.paiements} />
          </CardContent>
        </Card>
      )}

      {estPayee && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du reçu</CardTitle>
            <CardDescription>Prévisualisation du reçu de vente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-white">
              <RecuCommande
                commande={commande as any}
                client={commande.client || ({} as any)}
                lignesAvecProduits={commande.lignes || []}
                soldePaiement={solde || undefined}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => telechargerPdf('recu')}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger reçu
            </Button>
            <Button variant="outline" onClick={() => telechargerPdf('facture')}>
              <FileText className="h-4 w-4 mr-2" />
              Télécharger facture
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
