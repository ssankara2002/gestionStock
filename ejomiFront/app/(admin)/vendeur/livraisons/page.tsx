"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, User, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { AppSelect } from "@/components/ui/app-select"
import { useToast } from "@/hooks/use-toast"
import { livraisonService } from "@/services/livraison-service"
import type { Livraison, LivraisonStatut } from "@/types/livraison"
import { DataPagination } from "@/components/shared/data-pagination"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function LivraisonsPage() {
  const { toast } = useToast()
  const [livraisons, setLivraisons] = useState<Livraison[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<LivraisonStatut | "TOUS">("TOUS")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { hasPermission } = usePermissions()

  // Charger les livraisons
  const loadLivraisons = async () => {
    setLoading(true)
    try {
      if (filterStatut === "TOUS") {
        const response = await livraisonService.getAll()
        setLivraisons(response.data?.data || response.data || [])
      } else {
        const response = await livraisonService.getByStatut(filterStatut)
        setLivraisons(response.data?.data || response.data || [])
      }
    } catch (error: any) {
      console.error("Erreur chargement livraisons:", error)
      toast({
        title: "Erreur de chargement",
        description: error.response?.data?.message || "Impossible de charger les livraisons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    loadLivraisons()
  }, [filterStatut])

  const totalItems = livraisons.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedLivraisons = livraisons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = totalItems > 0 ? {
    page: currentPage,
    totalPages,
    total: totalItems,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  // Mettre à jour le statut
  const handleUpdateStatut = async (id: number, statut: LivraisonStatut) => {
    try {
      await livraisonService.updateStatut(id, statut)
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la livraison a été modifié",
      })
      loadLivraisons()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des livraisons</h1>
            <p className="text-muted-foreground">
              Suivez et gérez toutes les livraisons
            </p>
          </div>
          <div className="flex gap-2">
            <AppSelect
              className="w-[180px]"
              placeholder="Filtrer par statut"
              value={{ value: filterStatut, label: { TOUS: "Tous", EN_ATTENTE: "En attente", EN_COURS: "En cours", LIVREE: "Livrées", ECHEC: "Échec" }[filterStatut] ?? filterStatut }}
              onChange={(opt: any) => setFilterStatut(opt?.value ?? "TOUS")}
              options={[
                { value: "TOUS", label: "Tous" },
                { value: "EN_ATTENTE", label: "En attente" },
                { value: "EN_COURS", label: "En cours" },
                { value: "LIVREE", label: "Livrées" },
                { value: "ECHEC", label: "Échec" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {livraisons.filter((l) => l.statut === "EN_ATTENTE").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {livraisons.filter((l) => l.statut === "EN_COURS").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Livrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {livraisons.filter((l) => l.statut === "LIVREE").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Échecs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {livraisons.filter((l) => l.statut === "ECHEC").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des livraisons</CardTitle>
            <CardDescription>
              {livraisons.length} livraison(s) {filterStatut !== "TOUS" && `(${filterStatut})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {livraisons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune livraison trouvée
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Vente</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Livreur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLivraisons.map((livraison) => (
                    <TableRow key={livraison.id}>
                      <TableCell>{getStatutBadge(livraison.statut)}</TableCell>
                      <TableCell className="font-medium">
                        Vente #{livraison.commandeId}
                      </TableCell>
                      <TableCell>
                        {livraison.commande?.client
                          ? `${livraison.commande.client.prenom} ${livraison.commande.client.nom}`
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {livraison.adresse}
                      </TableCell>
                      <TableCell>
                        {livraison.livreur?.user
                          ? `${livraison.livreur.user.prenom} ${livraison.livreur.user.nom}`
                          : <Badge variant="outline">Non assigné</Badge>}
                      </TableCell>
                      <TableCell>
                        {format(new Date(livraison.dateLivraison), "Pp", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission("livraison.read") && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/vendeur/livraisons/${livraison.id}`}>
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                Voir
                              </Link>
                            </Button>
                          )}
                          {hasPermission("livraison.update") && livraison.statut === "EN_ATTENTE" && (
                            <Button variant="outline" size="sm" onClick={() => handleUpdateStatut(livraison.id, "EN_COURS")}>
                              <Truck className="mr-1 h-3.5 w-3.5" />
                              En cours
                            </Button>
                          )}
                          {hasPermission("livraison.update") && livraison.statut === "EN_COURS" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatut(livraison.id, "LIVREE")}>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Livrée
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleUpdateStatut(livraison.id, "ECHEC")}>
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                Échec
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {pagination && (
              <DataPagination
                pagination={pagination}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
