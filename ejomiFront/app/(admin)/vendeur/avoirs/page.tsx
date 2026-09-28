"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileOutput, Plus, Trash2, FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { avoirService } from "@/services"

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  REMBOURSEMENT: { label: "Remboursement", color: "bg-red-100 text-red-700" },
  CREDIT: { label: "Crédit client", color: "bg-blue-100 text-blue-700" },
}

const STATUT_LABEL: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  VALIDE: { label: "Validé", color: "bg-green-100 text-green-700" },
  ANNULE: { label: "Annulé", color: "bg-gray-100 text-gray-700" },
}

export default function AvoirsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["avoirs"],
    queryFn: async () => {
      const res = await avoirService.getAll()
      return res.data.data as any[]
    },
  })
  const avoirs = data || []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => avoirService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avoirs"] })
      toast({ title: "Avoir supprimé" })
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.response?.data?.message || "Impossible de supprimer", variant: "destructive" }),
  })

  const handleDownloadPdf = async (id: number) => {
    try {
      const res = await avoirService.downloadPdf(id)
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `avoir-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger le PDF", variant: "destructive" })
    }
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileOutput className="h-7 w-7" /> Avoirs
          </h1>
          <p className="text-muted-foreground">Retours partiels de commandes — remboursement ou crédit client.</p>
        </div>
        <PermissionGuard permission="avoir.create">
          <Button asChild>
            <Link href="/vendeur/avoirs/nouveau"><Plus className="mr-2 h-4 w-4" />Nouvel avoir</Link>
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des avoirs</CardTitle>
          <CardDescription>{avoirs.length} avoir(s) enregistré(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : avoirs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Aucun avoir enregistré.</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avoirs.map((avoir: any) => {
                    const type = TYPE_LABEL[avoir.type] || { label: avoir.type, color: "bg-gray-100 text-gray-700" }
                    const statut = STATUT_LABEL[avoir.statut] || { label: avoir.statut, color: "bg-gray-100 text-gray-700" }
                    return (
                      <TableRow key={avoir.id}>
                        <TableCell className="font-mono font-medium">AV-{String(avoir.id).padStart(5, "0")}</TableCell>
                        <TableCell>{new Date(avoir.dateAvoir).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>{avoir.client?.prenom} {avoir.client?.nom}</TableCell>
                        <TableCell className="font-mono">CMD-{String(avoir.commande?.id || avoir.commandeId).padStart(5, "0")}</TableCell>
                        <TableCell className="font-semibold">{Number(avoir.montant).toLocaleString("fr-FR")} FCFA</TableCell>
                        <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${type.color}`}>{type.label}</span></TableCell>
                        <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statut.color}`}>{statut.label}</span></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{avoir.motif || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <PermissionGuard permission="avoir.export">
                              <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(avoir.id)}>
                                <FileText className="h-4 w-4 mr-1" />PDF
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="avoir.delete">
                              {avoir.statut !== "VALIDE" && (
                                <Button variant="destructive" size="sm" onClick={() => { if (confirm("Supprimer cet avoir ?")) deleteMutation.mutate(String(avoir.id)) }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
