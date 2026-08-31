"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Calendar, User, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { productionService } from "@/services/production-service"
import type { Production } from "@/types/production"

export default function ProductionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [production, setProduction] = useState<Production | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduction = async () => {
      if (!params.id) return

      try {
        const data = await productionService.getById(params.id as string)
        setProduction(data)
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.response?.data?.message || "Impossible de charger les détails de la production",
          variant: "destructive",
        })
        router.push("/magasinier/productions")
      } finally {
        setLoading(false)
      }
    }

    loadProduction()
  }, [params.id, toast, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!production) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Production non trouvée</div>
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
                <Link href="/magasinier/productions">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Détails de la production</h1>
            </div>
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
                      <p className="text-sm text-muted-foreground">Produit fabriqué</p>
                      <p className="font-semibold">{production.produit?.libelle || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Quantité fabriquée</p>
                      <div className="font-semibold">
                        <Badge variant="secondary" className="text-base">
                          {production.quantiteFabriquee} unités
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date de production</p>
                      <p className="font-semibold">{formatDate(production.dateProduction)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Responsable</p>
                      <p className="font-semibold">
                        {production.employe?.user
                          ? `${production.employe.user.prenom} ${production.employe.user.nom}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {production.lot && (
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Numéro de lot</p>
                        <Badge variant="outline">{production.lot}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {production.consommations && production.consommations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Matières premières consommées</CardTitle>
                  <CardDescription>
                    Liste des matières premières utilisées pour cette production
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matière première</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead className="text-right">Quantité consommée</TableHead>
                          <TableHead className="text-right">Prix unitaire</TableHead>
                          <TableHead className="text-right">Coût total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {production.consommations.map((consommation) => (
                          <TableRow key={consommation.id}>
                            <TableCell className="font-medium">
                              {consommation.matierePremiere?.nom || "N/A"}
                            </TableCell>
                            <TableCell>
                              {consommation.matierePremiere?.categorie || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{consommation.quantite}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {consommation.matierePremiere?.prixAchat.toFixed(2)} FCFA
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {(
                                consommation.quantite *
                                (consommation.matierePremiere?.prixAchat || 0)
                              ).toFixed(2)}{" "}
                              FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-muted/50">
                          <TableCell colSpan={4} className="text-right">
                            Coût total de production
                          </TableCell>
                          <TableCell className="text-right">
                            {production.consommations
                              .reduce(
                                (sum, c) =>
                                  sum + c.quantite * (c.matierePremiere?.prixAchat || 0),
                                0
                              )
                              .toFixed(2)}{" "}
                            FCFA
                          </TableCell>
                        </TableRow>
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
