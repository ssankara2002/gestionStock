"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { Footer } from "@/components/layout/footer"
import { clientService, commandesService } from "@/services"
import type { Client } from "@/services/client-service"
import type { Commande } from "@/types"
import { PermissionGuard } from "@/components/permissions"

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [ventes, setVentes] = useState<Commande[]>([])

  // Charger le client et ses ventes
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientRes, ventesRes] = await Promise.all([
          clientService.getById(parseInt(resolvedParams.id)),
          commandesService.getByClient(resolvedParams.id),
        ])
        setClient(clientRes.data.data)
        const ventesData = ventesRes.data
        setVentes(Array.isArray(ventesData) ? ventesData : (ventesData?.data ?? []))
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du client",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.id, toast])

  // Supprimer le client
  const handleDelete = async () => {
    try {
      await clientService.delete(parseInt(resolvedParams.id))
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès",
      })
      router.push("/vendeur/clients")
      router.refresh()
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Impossible de supprimer le client."
      toast({
        title: "Suppression impossible",
        description: message,
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

  if (!client) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h1 className="text-2xl font-bold">Client non trouvé</h1>
              <p className="text-muted-foreground">Le client que vous recherchez n'existe pas.</p>
              <Button asChild>
                <Link href="/vendeur/clients">Retour à la liste</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/vendeur/clients">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">
                {client.prenom} {client.nom}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
                <PermissionGuard permission="user.delete">
              
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
              </PermissionGuard>
                        <PermissionGuard permission="user.update">

              <Button asChild>
                <Link href={`/vendeur/clients/${resolvedParams.id}/modifier`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
              </PermissionGuard>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.tel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{client.adresse}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PermissionGuard permission="commande.create">

                  <Button asChild className="w-full">
                    <Link href="/vendeur/commandes/nouvelle">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Nouvelle vente
                    </Link>
                  </Button>
                </PermissionGuard>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des ventes</CardTitle>
              <CardDescription>
                {ventes.length} vente{ventes.length !== 1 ? "s" : ""} effectuée{ventes.length !== 1 ? "s" : ""} par ce client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Aucune vente trouvée pour ce client.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ventes.map((vente) => (
                        <TableRow key={vente.id}>
                          <TableCell className="font-mono text-sm">#{vente.id}</TableCell>
                          <TableCell>
                            {new Date(vente.dateCommande).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(vente.montant).toLocaleString("fr-FR")} FCFA
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              vente.statut === "LIVREE" ? "default" :
                              vente.statut === "EN_ATTENTE" ? "secondary" :
                              vente.statut === "ANNULEE" ? "destructive" : "outline"
                            }>
                              {vente.statut?.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/vendeur/commandes/${vente.id}`}>
                                Voir
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        description={`Êtes-vous sûr de vouloir supprimer le client "${client.prenom} ${client.nom}" ? Cette action est irréversible.`}
        entityName="Le client"
      />
      <Footer />
    </div>
  )
}
