"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, ChefHat, Eye, Edit, Trash2, Warehouse } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { DataPagination } from "@/components/shared/data-pagination"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/services/api-client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function ProductionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: historique = [], isLoading } = useQuery({
    queryKey: ["preparations-historique"],
    queryFn: async () => {
      const res = await apiClient.get("/plats/preparations/all?limit=500")
      return (res.data as any).data || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/plats/preparations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preparations-historique"] })
      toast({ title: "Préparation supprimée", description: "Le stock des ingrédients a été restauré." })
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.response?.data?.message || e.message, variant: "destructive" }),
  })

  const confirmerSupprimer = (id: number, platLibelle: string) => {
    if (confirm(`Supprimer la préparation de "${platLibelle}" ? Le stock des ingrédients sera restauré.`)) {
      deleteMutation.mutate(id)
    }
  }

  const liste = historique as any[]
  const filtered = liste.filter((h: any) =>
    h.plat?.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.note || "").toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = filtered.length > 0
    ? { page: currentPage, totalPages, total: filtered.length, limit: itemsPerPage, hasNext: currentPage < totalPages, hasPrev: currentPage > 1 }
    : null

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Préparations
          </h1>
          <p className="text-muted-foreground text-sm">Historique des préparations — ingrédients consommés par plat</p>
        </div>
        <PermissionGuard permission="plat.update">
          <Button asChild>
            <Link href="/magasinier/productions/nouveau">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle préparation
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>{filtered.length} préparation{filtered.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par plat ou note..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <ChefHat className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Aucune préparation enregistrée.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plat</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Plats préparés</TableHead>
                      <TableHead className="text-right">Stock restant</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.plat?.libelle || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(h.datePreparation), "dd MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{h.nombrePortions} plat{h.nombrePortions !== 1 ? "s" : ""}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {h.stockPlatRestant != null ? (
                            h.stockPlatRestant > 0
                              ? <Badge variant="outline" className="text-orange-700 border-orange-300">
                                  <Warehouse className="h-3 w-3 mr-1" />{h.stockPlatRestant} restant{h.stockPlatRestant !== 1 ? "s" : ""}
                                </Badge>
                              : <Badge variant="outline" className="text-green-700 border-green-300">Tout vendu</Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{h.note || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/magasinier/productions/${h.id}`}>
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                Voir
                              </Link>
                            </Button>
                            {hasPermission("plat.update") && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/magasinier/productions/${h.id}/modifier`}>
                                  <Edit className="mr-1 h-3.5 w-3.5" />
                                  Modifier
                                </Link>
                              </Button>
                            )}
                            {hasPermission("plat.update") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmerSupprimer(h.id, h.plat?.libelle || "")}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataPagination pagination={pagination} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
