"use client"

import { useState } from "react"
import Link from "next/link"
import { Edit, Plus, Search, Trash2, Utensils } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"
import { platService } from "@/services"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import type { Plat } from "@/types/plat"

const imageUrl = (image?: string | null) => {
  if (!image) return "/placeholder.svg?height=80&width=80"
  if (image.startsWith("http") || image.startsWith("/")) return image
  const base = process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost"
  return `${base}/uploads/${image}`
}

export default function PlatsPage() {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const { data, isLoading } = useQuery({
    queryKey: ["plats"],
    queryFn: async () => (await platService.getAll(1, 1000)).data.data,
  })

  const allPlats = data?.data ?? []
  const filteredPlats = allPlats.filter((plat: Plat) =>
    `${plat.libelle} ${plat.description || ""}`.toLowerCase().includes(search.toLowerCase()),
  )
  const totalPages = Math.max(1, Math.ceil(filteredPlats.length / itemsPerPage))
  const safePage = Math.min(page, totalPages)
  const plats = filteredPlats.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage)
  const pagination: PaginationInfo | null = filteredPlats.length > 0 ? {
    page: safePage,
    limit: itemsPerPage,
    total: filteredPlats.length,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  } : null

  const deleteMutation = useMutation({
    mutationFn: (id: number) => platService.delete(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plats"] })
      toast({ title: "Plat supprimé", description: "Le plat a été supprimé avec succès." })
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.response?.data?.message || "Suppression impossible", variant: "destructive" }),
  })

  const filtered = plats.filter((plat: Plat) =>
    `${plat.libelle} ${plat.description || ""}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><Utensils className="h-7 w-7" />Plats</h1>
          <p className="text-muted-foreground">Gérez les plats vendus par votre entreprise. Les plats ne sont pas stockés.</p>
        </div>
        <PermissionGuard permission="plat.create">
          <Button asChild><Link href="/plats/nouveau"><Plus className="mr-2 h-4 w-4" />Nouveau plat</Link></Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue des plats</CardTitle>
          <CardDescription>{data?.total ?? 0} plat(s) enregistré(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-sm"><Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher un plat..." /></div>
          {isLoading ? <div className="py-12 text-center text-muted-foreground">Chargement...</div> : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Plat</TableHead><TableHead>Description</TableHead><TableHead>Prix de vente</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {plats.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun plat trouvé.</TableCell></TableRow> : plats.map((plat: Plat) => (
                      <TableRow key={plat.id}>
                        <TableCell><img src={imageUrl(plat.image)} alt={plat.libelle} className="h-14 w-14 rounded object-cover" /></TableCell>
                        <TableCell className="font-medium">{plat.libelle}</TableCell>
                        <TableCell className="max-w-xs text-muted-foreground">{plat.description || "-"}</TableCell>
                        <TableCell>{plat.prixVenteUnitaire} FCFA</TableCell>
                        <TableCell className="text-right"><div className="flex justify-end gap-2">
                          {hasPermission("plat.update") && <Button variant="outline" size="sm" asChild><Link href={`/plats/${plat.id}/modifier`}><Edit className="mr-1 h-4 w-4" />Modifier</Link></Button>}
                          {hasPermission("plat.delete") && <Button variant="destructive" size="sm" onClick={() => { if (confirm(`Supprimer le plat « ${plat.libelle} » ?`)) deleteMutation.mutate(plat.id) }}><Trash2 className="mr-1 h-4 w-4" />Supprimer</Button>}
                        </div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataPagination pagination={pagination} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
