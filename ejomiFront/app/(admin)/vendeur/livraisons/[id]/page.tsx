"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, MapPin, User, Calendar, Truck, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AppSelect } from "@/components/ui/app-select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { livraisonService } from "@/services/livraison-service"
import { employesService } from "@/services/employe-service"
import type { Livraison, LivraisonStatut } from "@/types/livraison"
import type { Employe } from "@/types/employe"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function LivraisonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [livraison, setLivraison] = useState<Livraison | null>(null)
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const livraisonId = parseInt(params.id as string)

  // Charger la livraison et les employés
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [livraisonRes, employesRes] = await Promise.all([
          livraisonService.getById(livraisonId),
          employesService.getAll(),
        ])

        setLivraison(livraisonRes.data?.data || livraisonRes.data)
        setEmployes(employesRes.data?.data || employesRes.data || [])
      } catch (error: any) {
        console.error("Erreur chargement:", error)
        toast({
          title: "Erreur de chargement",
          description: error.response?.data?.message || "Impossible de charger les données",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [livraisonId, toast])

  // Assigner un livreur
  const handleAssignLivreur = async (livreurId: string) => {
    setUpdating(true)
    try {
      await livraisonService.assignLivreur(livraisonId, parseInt(livreurId))
      toast({
        title: "Livreur assigné",
        description: "Le livreur a été assigné avec succès",
      })

      // Recharger la livraison
      const response = await livraisonService.getById(livraisonId)
      setLivraison(response.data?.data || response.data)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible d'assigner le livreur",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Mettre à jour le statut
  const handleUpdateStatut = async (statut: LivraisonStatut) => {
    setUpdating(true)
    try {
      await livraisonService.updateStatut(livraisonId, statut)
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la livraison a été modifié",
      })

      // Recharger la livraison
      const response = await livraisonService.getById(livraisonId)
      setLivraison(response.data?.data || response.data)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Obtenir le badge de statut
  const getStatutBadge = (statut: LivraisonStatut) => {
    switch (statut) {
      case "EN_ATTENTE":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        )
      case "EN_COURS":
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <Truck className="h-3 w-3" />
            En cours
          </Badge>
        )
      case "LIVREE":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Livrée
          </Badge>
        )
      case "ECHEC":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Échec
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!livraison) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Livraison non trouvée</p>
          <Link href="/vendeur/livraisons">
            <Button>Retour aux livraisons</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center gap-4">
          <Link href="/vendeur/livraisons">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Détails de la livraison</h1>
            <p className="text-muted-foreground">Livraison #{livraison.id}</p>
          </div>
          {getStatutBadge(livraison.statut)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations commande */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informations de vente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Numéro de vente</p>
                    <p className="text-sm text-muted-foreground">
                      #{livraison.commande?.id || livraison.commandeId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Montant</p>
                    <p className="text-sm text-muted-foreground">
                      {livraison.commande?.montant || 0} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Client</p>
                    <p className="text-sm text-muted-foreground">
                      {livraison.commande?.client
                        ? `${livraison.commande.client.prenom} ${livraison.commande.client.nom}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Date de vente</p>
                    <p className="text-sm text-muted-foreground">
                      {livraison.commande?.dateCommande
                        ? format(new Date(livraison.commande.dateCommande), "Pp", { locale: fr })
                        : "—"}
                    </p>
                  </div>
                </div>

                {livraison.commande?.lignes && livraison.commande.lignes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Produits commandés</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {livraison.commande.lignes.map((ligne: any) => (
                          <TableRow key={ligne.id}>
                            <TableCell>{ligne.produit?.libelle || "—"}</TableCell>
                            <TableCell className="text-right">{ligne.quantiteCommande}</TableCell>
                            <TableCell className="text-right">{ligne.montant} FCFA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Adresse de livraison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{livraison.adresse}</p>
              </CardContent>
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Informations livraison */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date de livraison</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(livraison.dateLivraison), "PPPp", { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Livreur</p>
                    <AppSelect
                      placeholder="Assigner un livreur"
                      isDisabled={updating}
                      value={livraison.livreurId ? { value: livraison.livreurId.toString(), label: employes.find(e => e.id === livraison.livreurId) ? `${employes.find(e => e.id === livraison.livreurId)!.user?.prenom} ${employes.find(e => e.id === livraison.livreurId)!.user?.nom}` : "" } : null}
                      onChange={(opt: any) => handleAssignLivreur(opt?.value ?? "")}
                      options={employes.map(e => ({ value: e.id.toString(), label: `${e.user?.prenom} ${e.user?.nom}` }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {livraison.statut === "EN_ATTENTE" && (
                  <Button
                    className="w-full"
                    onClick={() => handleUpdateStatut("EN_COURS")}
                    disabled={updating}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Marquer en cours
                  </Button>
                )}
                {livraison.statut === "EN_COURS" && (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatut("LIVREE")}
                      disabled={updating}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marquer comme livrée
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={() => handleUpdateStatut("ECHEC")}
                      disabled={updating}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Marquer comme échec
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
