"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft, Plus, PackageCheck } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AppSelect } from "@/components/ui/app-select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { transfertService } from "@/services/transfert-service"
import { produitService } from "@/services/produit-service"
import type { SensTransfert } from "@/types/transfert"
import { DataPagination } from "@/components/shared/data-pagination"

export default function TransfertsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [form, setForm] = useState({
    produitId: "",
    quantite: "",
    sens: "MAGASIN_VERS_BOUTIQUE" as SensTransfert,
    motif: "",
  })

  // Charger les transferts
  const { data: transfertsData, isLoading } = useQuery({
    queryKey: ["transferts"],
    queryFn: async () => {
      const res = await transfertService.getAll()
      return res.data.data
    },
  })

  // Charger les produits
  const { data: produits = [] } = useQuery({
    queryKey: ["produits"],
    queryFn: async () => {
      const res = await produitService.getAll()
      return res.data.data
    },
  })

  const produitSelectionne = produits.find((p: any) => p.id === parseInt(form.produitId))

  // Mutation création
  const mutation = useMutation({
    mutationFn: () =>
      transfertService.create({
        produitId: parseInt(form.produitId),
        quantite: parseInt(form.quantite),
        sens: form.sens,
        motif: form.motif || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transferts"] })
      queryClient.invalidateQueries({ queryKey: ["produits"] })
      toast({ title: "Transfert effectué", description: "Le stock a été transféré avec succès." })
      setOpen(false)
      setForm({ produitId: "", quantite: "", sens: "MAGASIN_VERS_BOUTIQUE", motif: "" })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = () => {
    if (!form.produitId || !form.quantite) {
      toast({ title: "Champs requis", description: "Sélectionnez un produit et une quantité.", variant: "destructive" })
      return
    }
    if (parseInt(form.quantite) <= 0) {
      toast({ title: "Quantité invalide", description: "La quantité doit être supérieure à 0.", variant: "destructive" })
      return
    }
    mutation.mutate()
  }

  const allTransferts: any[] = Array.isArray(transfertsData) ? transfertsData : (transfertsData as any)?.data || []
  const totalTransferts = allTransferts.length
  const totalPages = Math.ceil(totalTransferts / itemsPerPage)
  const transferts = allTransferts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = totalTransferts > 0 ? {
    page: currentPage,
    totalPages,
    total: totalTransferts,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transferts de stock</h1>
          <p className="text-muted-foreground text-sm mt-1">Déplacer du stock entre le magasin et la boutique</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau transfert
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouveau transfert de stock</DialogTitle>
              <DialogDescription>
                Transférez un produit entre le magasin et la boutique.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Sens */}
              <div className="space-y-2">
                <Label>Direction du transfert</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, sens: "MAGASIN_VERS_BOUTIQUE" }))}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                      form.sens === "MAGASIN_VERS_BOUTIQUE"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-medium">
                      <span>Magasin</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>Boutique</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Alimenter la boutique</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, sens: "BOUTIQUE_VERS_MAGASIN" }))}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                      form.sens === "BOUTIQUE_VERS_MAGASIN"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-medium">
                      <span>Boutique</span>
                      <ArrowLeft className="h-3 w-3" />
                      <span>Magasin</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Retour au magasin</span>
                  </button>
                </div>
              </div>

              {/* Produit */}
              <div className="space-y-2">
                <Label>Produit</Label>
                <AppSelect
                  placeholder="Sélectionner un produit..."
                  value={form.produitId ? { value: form.produitId, label: (produits as any[]).find((p: any) => String(p.id) === form.produitId)?.libelle ?? "" } : null}
                  onChange={(opt: any) => setForm(f => ({ ...f, produitId: opt?.value ?? "" }))}
                  options={(produits as any[]).map((p: any) => ({ value: String(p.id), label: p.libelle }))}
                />

                {/* Aperçu du stock disponible */}
                {produitSelectionne && (
                  <div className="flex gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                    <span>
                      Magasin :{" "}
                      <strong>{produitSelectionne.stockMagasin?.quantite ?? 0}</strong>
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span>
                      Boutique :{" "}
                      <strong>{produitSelectionne.stockBoutique?.quantite ?? 0}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Quantité */}
              <div className="space-y-2">
                <Label>Quantité à transférer</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ex: 10"
                  value={form.quantite}
                  onChange={(e) => setForm(f => ({ ...f, quantite: e.target.value }))}
                />
              </div>

              {/* Motif */}
              <div className="space-y-2">
                <Label>Motif (optionnel)</Label>
                <Textarea
                  placeholder="Raison du transfert..."
                  value={form.motif}
                  onChange={(e) => setForm(f => ({ ...f, motif: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? "Transfert en cours..." : "Confirmer le transfert"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Historique */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Historique des transferts</CardTitle>
          <CardDescription>Tous les mouvements de stock entre magasin et boutique</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : transferts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <PackageCheck className="h-10 w-10 opacity-30" />
              <p>Aucun transfert effectué</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferts.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(t.dateTransfert).toLocaleString("fr-FR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{t.produit?.libelle}</TableCell>
                      <TableCell>
                        {t.sens === "MAGASIN_VERS_BOUTIQUE" ? (
                          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                            <ArrowRight className="h-3 w-3" />
                            Magasin → Boutique
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
                            <ArrowLeft className="h-3 w-3" />
                            Boutique → Magasin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold">{t.quantite}</TableCell>
                      <TableCell className="text-sm">
                        {t.employe?.user ? `${t.employe.user.prenom} ${t.employe.user.nom}` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.motif || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
  )
}
