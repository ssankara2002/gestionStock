"use client"

import { useState } from "react"
import Link from "next/link"
import { Edit, Plus, Trash2, Utensils, Warehouse, FileText, FileDown } from "lucide-react"
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
import type { Plat, CategoriePlat } from "@/types/plat"

const CATEGORIES: { value: CategoriePlat | "TOUS"; label: string }[] = [
  { value: "TOUS", label: "Tous" },
  { value: "REPAS", label: "Repas" },
  { value: "LIQUIDE", label: "Liquide" },
  { value: "SNACK", label: "Snack" },
]

const imageUrl = (image?: string | null) => {
  if (!image) return "/placeholder.svg?height=80&width=80"
  if (image.startsWith("http") || image.startsWith("/")) return image
  const base = process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost"
  return `${base}/uploads/${image}`
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function PlatsPage() {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [categorie, setCategorie] = useState<CategoriePlat | "TOUS">("TOUS")
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState<"pdf" | "word" | null>(null)
  const itemsPerPage = 10

  const handleExport = async (format: "pdf" | "word") => {
    try {
      setExporting(format)
      const res = format === "pdf" ? await platService.exportPdf() : await platService.exportWord()
      const ext = format === "pdf" ? "pdf" : "docx"
      downloadBlob(res.data as Blob, `plats.${ext}`)
      toast({ title: "Export réussi", description: `Liste des plats exportée en ${format.toUpperCase()}.` })
    } catch {
      toast({ title: "Erreur", description: "Impossible d'exporter.", variant: "destructive" })
    } finally {
      setExporting(null)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["plats"],
    queryFn: async () => (await platService.getAll(1, 1000)).data.data,
  })

  const allPlats = data?.data ?? []
  const filteredPlats = allPlats.filter((plat: Plat) =>
    `${plat.libelle} ${plat.description || ""}`.toLowerCase().includes(search.toLowerCase()) &&
    (categorie === "TOUS" || plat.categorie === categorie)
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

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><Utensils className="h-7 w-7" />Plats</h1>
          <p className="text-muted-foreground">Gérez les plats vendus. Le stock disponible reflète les portions prêtes à servir.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PermissionGuard permission="plat.export">
            <Button variant="outline" onClick={() => handleExport("pdf")} disabled={exporting === "pdf"}>
              <FileText className="mr-2 h-4 w-4" />{exporting === "pdf" ? "Export..." : "PDF"}
            </Button>
            <Button variant="outline" onClick={() => handleExport("word")} disabled={exporting === "word"}>
              <FileDown className="mr-2 h-4 w-4" />{exporting === "word" ? "Export..." : "Word"}
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="plat.create">
            <Button asChild><Link href="/plats/nouveau"><Plus className="mr-2 h-4 w-4" />Nouveau plat</Link></Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue des plats</CardTitle>
          <CardDescription>{data?.total ?? 0} plat(s) enregistré(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <Input className="max-w-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher un plat..." />
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategorie(cat.value); setPage(1) }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    categorie === cat.value
                      ? cat.value === "LIQUIDE" ? "bg-blue-600 text-white border-blue-600"
                        : cat.value === "SNACK" ? "bg-yellow-500 text-white border-yellow-500"
                        : cat.value === "REPAS" ? "bg-green-600 text-white border-green-600"
                        : "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? <div className="py-12 text-center text-muted-foreground">Chargement...</div> : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Plat</TableHead><TableHead>Catégorie</TableHead><TableHead>Description</TableHead><TableHead>Prix de vente</TableHead><TableHead className="text-right">Stock disponible</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {plats.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Aucun plat trouvé.</TableCell></TableRow> : plats.map((plat: Plat) => (
                      <TableRow key={plat.id}>
                        <TableCell><img src={imageUrl(plat.image)} alt={plat.libelle} className="h-14 w-14 rounded object-cover" /></TableCell>
                        <TableCell className="font-medium">{plat.libelle}</TableCell>
                        <TableCell>
                          {plat.categorie ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              plat.categorie === 'LIQUIDE' ? 'bg-blue-100 text-blue-700' :
                              plat.categorie === 'SNACK' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {plat.categorie === 'LIQUIDE' ? 'Liquide' : plat.categorie === 'SNACK' ? 'Snack' : 'Repas'}
                            </span>
                          ) : <span className="text-muted-foreground text-sm">-</span>}
                        </TableCell>
                        <TableCell className="max-w-xs text-muted-foreground">{plat.description || "-"}</TableCell>
                        <TableCell>{plat.prixVenteUnitaire} FCFA</TableCell>
                        <TableCell className="text-right">
                          {(plat.stockPlat ?? 0) > 0
                            ? <span className="inline-flex items-center gap-1 font-semibold text-orange-600"><Warehouse className="h-4 w-4" />{plat.stockPlat}</span>
                            : <span className="text-muted-foreground text-sm">0</span>}
                        </TableCell>
                        <TableCell className="text-right"><div className="flex justify-end gap-2">
                          {/* <Button variant="outline" size="sm" asChild><Link href={`/plats/${plat.id}/recette`}><ChefHat className="mr-1 h-4 w-4" />Recette</Link></Button> */}
                          {/* <Button variant="outline" size="sm" asChild><Link href={`/plats/${plat.id}/preparations`}><PlayCircle className="mr-1 h-4 w-4" />Préparer</Link></Button> */}
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
