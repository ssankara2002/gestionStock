"use client"

import { use, useState, useEffect } from "react"
import { formatDateHeure } from "@/lib/utils"
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
import { approvisionnementMatierePremiereService } from "@/services/approvisionnement-matiere-premiere-service"
import { matierePremiereService } from "@/services/matiere-premiere-service"
import { fournisseurService } from "@/services"
import type { Fournisseur } from "@/types/fournisseur"
import type { MatierePremiere } from "@/types/matierePremiere"

export default function ApprovisionnementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [approvisionnement, setApprovisionnement] = useState<any | null>(null)
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [matieres, setMatieres] = useState<MatierePremiere[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const approRes = await approvisionnementMatierePremiereService.getById(parseInt(resolvedParams.id))
        const approData = (approRes.data as any).data || approRes.data
        setApprovisionnement(approData)

        // Charger le fournisseur
        if (approData.fournisseurId) {
          const fournRes = await fournisseurService.getById(approData.fournisseurId)
          setFournisseur((fournRes.data as any).data || fournRes.data)
        }

        // Charger toutes les matières premières
        const mpRes = await matierePremiereService.getAllMatieresPremieres(1, 1000)
        setMatieres(mpRes.data || [])
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
      await approvisionnementMatierePremiereService.deleteById(parseInt(resolvedParams.id))
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
                <Link href="/magasinier/matieres-premieres/approvisionnements">Retour à la liste</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getMatiereById = (id: number) => matieres.find((m) => m.id === id)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/magasinier//matieres-premieres/approvisionnements">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Détails de l'approvisionnement #{approvisionnement.id}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/magasinier/approvisionnements/${resolvedParams.id}/modifier`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
             
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
                    {formatDateHeure(approvisionnement.dateApprovisionnement)}
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
                  <span className="text-muted-foreground">Matières:</span>
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
              <CardTitle>Matières premières approvisionnées</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière première</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvisionnement.lignes?.map((ligne: any) => {
                    const matiere = ligne.matierePremiere || getMatiereById(Number(ligne.matierePremiereId))
                    return (
                      <TableRow key={ligne.id}>
                        <TableCell className="font-medium">
                          {matiere?.nom || 'Matière inconnue'}
                        </TableCell>
                        <TableCell className="text-center">
                          {ligne.quantite} {matiere?.unite || ''}
                        </TableCell>
                        <TableCell className="text-right">
                          {(ligne.montant / ligne.quantite).toFixed(2)} FCFA
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {ligne.montant.toFixed(2)} FCFA
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
