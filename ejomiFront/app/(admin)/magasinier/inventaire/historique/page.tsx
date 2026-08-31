"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { inventaireService } from "@/services/inventaire-service"
import type { HistoriqueInventaire } from "@/types/inventaire"
import { DataPagination } from "@/components/shared/data-pagination"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function HistoriqueInventairePage() {
  const { toast } = useToast()
  const [historique, setHistorique] = useState<HistoriqueInventaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [filters, setFilters] = useState({
    produitId: "",
    employeId: "",
    dateDebut: "",
    dateFin: "",
  })

  // Charger l'historique des inventaires
  const loadHistorique = async () => {
    setLoading(true)
    try {
      const params: any = {}

      if (filters.produitId) params.produitId = parseInt(filters.produitId)
      if (filters.employeId) params.employeId = parseInt(filters.employeId)
      if (filters.dateDebut) params.dateDebut = filters.dateDebut
      if (filters.dateFin) params.dateFin = filters.dateFin

      const response = await inventaireService.getHistorique(params)
      setHistorique(response.data?.data || response.data || [])
    } catch (error: any) {
      console.error('Erreur chargement historique:', error)
      toast({
        title: "Erreur de chargement",
        description: error.response?.data?.message || "Impossible de charger l'historique",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistorique()
  }, [])

  const handleApplyFilters = () => {
    loadHistorique()
  }

  const handleResetFilters = () => {
    setFilters({
      produitId: "",
      employeId: "",
      dateDebut: "",
      dateFin: "",
    })
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(historique.length / itemsPerPage)
  const paginatedHistorique = historique.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = historique.length > 0 ? {
    page: currentPage,
    totalPages,
    total: historique.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

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
            <h1 className="text-3xl font-bold">Historique des inventaires</h1>
            <p className="text-muted-foreground">
              Consultez l'historique des ajustements d'inventaire
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
            <Link href="/magasinier/inventaire">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'inventaire
              </Button>
            </Link>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produitId">ID Produit</Label>
                  <Input
                    id="produitId"
                    type="number"
                    placeholder="Ex: 1"
                    value={filters.produitId}
                    onChange={(e) => setFilters({ ...filters, produitId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeId">ID Employé</Label>
                  <Input
                    id="employeId"
                    type="number"
                    placeholder="Ex: 1"
                    value={filters.employeId}
                    onChange={(e) => setFilters({ ...filters, employeId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyFilters}>Appliquer</Button>
                <Button variant="outline" onClick={handleResetFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
            <CardDescription>
              {historique.length} enregistrement(s) trouvé(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historique.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun historique d'inventaire trouvé
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-right">Quantité théorique</TableHead>
                    <TableHead className="text-right">Quantité physique</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead>Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistorique.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.dateInventaire), "Pp", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.produit?.libelle || `Produit #${entry.produitId}`}
                      </TableCell>
                      <TableCell>
                        {entry.employe?.user
                          ? `${entry.employe.user.prenom} ${entry.employe.user.nom}`
                          : `Employé #${entry.employeId}`}
                      </TableCell>
                      <TableCell className="text-right">{entry.quantiteTheorique}</TableCell>
                      <TableCell className="text-right">{entry.quantitePhysique}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            entry.ecart > 0
                              ? "text-green-600 font-semibold"
                              : entry.ecart < 0
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {entry.ecart > 0 ? "+" : ""}
                          {entry.ecart}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.commentaire || "—"}
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
