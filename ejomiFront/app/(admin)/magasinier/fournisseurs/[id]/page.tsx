"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, FileText, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { Footer } from "@/components/layout/footer"
import { fournisseurService, approvisionnementService } from "@/services"
import type { Fournisseur } from "@/types/fournisseur"
import type { Approvisionnement } from "@/types/approvisionnement"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function FournisseurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const { hasPermission } = usePermissions()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [approvisionnements, setApprovisionnements] = useState<Approvisionnement[]>([])
  const [totalApprovisionnements, setTotalApprovisionnements] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null)
  const itemsPerPage = 10

  // Charger le fournisseur et ses approvisionnements
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const fournisseurId = parseInt(resolvedParams.id)
        const [fournisseurRes, approvisionnementsRes] = await Promise.all([
          fournisseurService.getById(fournisseurId),
          approvisionnementService.getApprovisionnementsByFournisseur(fournisseurId, currentPage, itemsPerPage),
        ])

        // Le backend renvoie { success: true, data: {...} }
        const fournisseurData = fournisseurRes.data.data || fournisseurRes.data
        setFournisseur(fournisseurData)

        // Le backend renvoie { success: true, data: [...], total: X, page: Y, totalPages: Z }
        const approsResponse = approvisionnementsRes.data
        console.log("Response approvisionnements:", approsResponse)

        // S'assurer que c'est un tableau
        const approsArray = Array.isArray(approsResponse?.data)
          ? approsResponse.data
          : []

        const total = approsResponse?.total || 0
        setApprovisionnements(approsArray)
        setTotalApprovisionnements(total)
        setPaginationInfo({
          page: approsResponse?.page || currentPage,
          totalPages: approsResponse?.totalPages || Math.ceil(total / itemsPerPage) || 1,
          total,
          limit: itemsPerPage,
          hasNext: (approsResponse?.page || currentPage) < (approsResponse?.totalPages || 1),
          hasPrev: (approsResponse?.page || currentPage) > 1,
        })
      } catch (error: any) {
        console.error("Erreur lors du chargement du fournisseur:", error)
        toast({
          title: "Erreur",
          description: error.response?.data?.message || error.message || "Impossible de charger les données du fournisseur",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.id, toast, currentPage])

  // Statistiques
  const totalAchats = Array.isArray(approvisionnements)
    ? approvisionnements.reduce((sum, app) => sum + (app.montant || 0), 0)
    : 0
  const nombreAppros = Array.isArray(approvisionnements) ? approvisionnements.length : 0

  // Supprimer le fournisseur
  const handleDelete = async () => {
    try {
      await fournisseurService.delete(parseInt(resolvedParams.id))
      toast({
        title: "Fournisseur supprimé",
        description: "Le fournisseur a été supprimé avec succès",
      })
      router.push("/magasinier/fournisseurs")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fournisseur",
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

  if (!fournisseur) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h1 className="text-2xl font-bold">Fournisseur non trouvé</h1>
              <p className="text-muted-foreground">Le fournisseur que vous recherchez n'existe pas.</p>
              <Button asChild>
                <Link href="/magasinier/fournisseurs">Retour à la liste</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <PermissionGuard permissions={["fournisseur.read"]} redirectTo="/magasinier/fournisseurs">
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/magasinier/fournisseurs">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">
                {fournisseur.prenom} {fournisseur.nom}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasPermission("fournisseur.delete") && (
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              )}
              {hasPermission("fournisseur.update") && (
                <Button asChild>
                  <Link href={`/magasinier/fournisseurs/${resolvedParams.id}/modifier`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fournisseur.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{fournisseur.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{fournisseur.tel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{fournisseur.adresse}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total des achats:</span>
                  <span className="font-medium">{totalAchats.toFixed(2)} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre d'approvisionnements:</span>
                  <span className="font-medium">{nombreAppros}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernier approvisionnement:</span>
                  <span className="font-medium">
                    {approvisionnements.length > 0
                      ? new Date(approvisionnements[0].dateApprovisionnement).toLocaleDateString()
                      : "Aucun"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/magasinier/approvisionnements/nouveau">
                    <Package className="mr-2 h-4 w-4" />
                    Nouvel approvisionnement
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="#">
                    <FileText className="mr-2 h-4 w-4" />
                    Générer un rapport
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des approvisionnements</CardTitle>
              <CardDescription>Liste des approvisionnements effectués avec ce fournisseur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Lignes</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvisionnements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Aucun approvisionnement trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      approvisionnements.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">#{app.id}</TableCell>
                          <TableCell>
                            {new Date(app.dateApprovisionnement).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {app.lignes?.length || 0}
                          </TableCell>
                          <TableCell className="text-right">{app.montant.toFixed(2)} FCFA</TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/magasinier/approvisionnements/${app.id}`}>Voir</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {paginationInfo && (
                <DataPagination
                  pagination={paginationInfo}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/magasinier/approvisionnements">Voir tous les approvisionnements</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le fournisseur"
        description={`Êtes-vous sûr de vouloir supprimer le fournisseur "${fournisseur.prenom} ${fournisseur.nom}" ? Cette action est irréversible.`}
        entityName="Le fournisseur"
      />
      <Footer />
    </div>
    </PermissionGuard>
  )
}
