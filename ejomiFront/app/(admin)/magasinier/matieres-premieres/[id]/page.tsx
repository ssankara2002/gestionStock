"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Package, DollarSign, Hash, AlertTriangle, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getMatierePremiereById } from "@/services/matiere-premiere-service"
import type { MatierePremiere } from "@/types/matierePremiere"
import { PermissionGuard } from "@/components/permissions"

export default function MatierePremiereDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [matiere, setMatiere] = useState<MatierePremiere | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMatiere = async () => {
      if (!params.id) return

      try {
        const data = await getMatierePremiereById(params.id as string)
        setMatiere(data)
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.response?.data?.message || "Impossible de charger les détails de la matière première",
          variant: "destructive",
        })
        router.push("/magasinier/matieres-premieres")
      } finally {
        setLoading(false)
      }
    }

    loadMatiere()
  }, [params.id, toast, router])

  const getStockBadge = (quantite: number) => {
    if (quantite === 0) {
      return <Badge variant="destructive">Rupture de stock</Badge>
    } else if (quantite <= 10) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Stock faible</Badge>
    }
    return <Badge variant="default" className="bg-green-600">En stock</Badge>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!matiere) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Matière première non trouvée</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/magasinier/matieres-premieres">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">{matiere.nom}</h1>
            </div>
            <PermissionGuard permissions={["matiere_premiere.update"]} >
              <Button asChild>
                <Link href={`/magasinier/matieres-premieres/${matiere.id}/modifier`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            </PermissionGuard>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nom</p>
                      <p className="font-semibold">{matiere.nom}</p>
                    </div>
                  </div>

                  {matiere.categorie && (
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Catégorie</p>
                        <Badge variant="secondary">{matiere.categorie}</Badge>
                      </div>
                    </div>
                  )}

                  
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Stock disponible</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{matiere.quantiteStock}</p>
                        {getStockBadge(matiere.quantiteStock)}
                      </div>
                    </div>
                  </div>

                  {matiere.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{matiere.description}</p>
                    </div>
                  )}
                </div>

                {matiere.quantiteStock <= 10 && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">Alerte stock faible</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Le stock de cette matière première est faible. Pensez à réapprovisionner.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {matiere.lignesApprovisionnement && matiere.lignesApprovisionnement.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique des approvisionnements</CardTitle>
                  <CardDescription>
                    Liste des derniers approvisionnements pour cette matière première.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead className="text-right">Quantité reçue</TableHead>
                          <TableHead className="text-right">Coût</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matiere.lignesApprovisionnement.map((ligne) => (
                          <TableRow key={ligne.id}>
                            <TableCell className="font-medium">
                              {new Date(ligne.approvisionnement.dateApprovisionnement).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell>
                              {ligne.approvisionnement.fournisseur.prenom} {ligne.approvisionnement.fournisseur.nom}
                            </TableCell>
                            <TableCell className="text-right"><Badge variant="outline">+{ligne.quantite}</Badge></TableCell>
                            <TableCell className="text-right">{ligne.montant.toFixed(2)} FCFA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {matiere.consommations && matiere.consommations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique d'utilisation</CardTitle>
                  <CardDescription>
                    Dernières productions ayant utilisé cette matière première
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Produit fabriqué</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead className="text-right">Quantité utilisée</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matiere.consommations.map((consommation) => (
                          <TableRow key={consommation.id}>
                            <TableCell>
                              {new Date(consommation.production.dateProduction).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {consommation.production.produit?.libelle || "N/A"}
                            </TableCell>
                            <TableCell>
                              {consommation.production.employe?.user
                                ? `${consommation.production.employe.user.prenom} ${consommation.production.employe.user.nom}`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{consommation.quantite}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
