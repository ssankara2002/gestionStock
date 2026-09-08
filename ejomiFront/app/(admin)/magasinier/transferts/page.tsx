"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft, Plus, PackageCheck, Trash2 } from "lucide-react"
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

type Ligne = { produitId: string; quantite: string }

const ligneVide = (): Ligne => ({ produitId: "", quantite: "" })

export default function TransfertsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [sens, setSens] = useState<SensTransfert>("MAGASIN_VERS_BOUTIQUE")
  const [motif, setMotif] = useState("")
  const [lignes, setLignes] = useState<Ligne[]>([ligneVide()])

  const ajouterLigne = () => setLignes(l => [...l, ligneVide()])
  const supprimerLigne = (i: number) => setLignes(l => l.filter((_, idx) => idx !== i))
  const modifierLigne = (i: number, champ: keyof Ligne, valeur: string) =>
    setLignes(l => l.map((ligne, idx) => idx === i ? { ...ligne, [champ]: valeur } : ligne))

  const resetForm = () => {
    setSens("MAGASIN_VERS_BOUTIQUE")
    setMotif("")
    setLignes([ligneVide()])
  }

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
      const payload = res.data
      return Array.isArray(payload) ? payload : (payload as any)?.data || []
    },
  })

  // Ids déjà sélectionnés (pour éviter doublons)
  const idsSelectionnes = lignes.map(l => l.produitId).filter(Boolean)

  // Mutation création bulk
  const mutation = useMutation({
    mutationFn: () =>
      transfertService.createBulk({
        lignes: lignes.map(l => ({ produitId: parseInt(l.produitId), quantite: parseInt(l.quantite) })),
        sens,
        motif: motif || undefined,
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["transferts"] })
      queryClient.invalidateQueries({ queryKey: ["produits"] })
      const n = res.data?.data?.length ?? lignes.length
      toast({ title: "Transfert effectué", description: `${n} produit(s) transféré(s) avec succès.` })
      setOpen(false)
      resetForm()
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
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i]
      if (!l.produitId) {
        toast({ title: "Champ requis", description: `Sélectionnez un produit pour la ligne ${i + 1}.`, variant: "destructive" })
        return
      }
      if (!l.quantite || parseInt(l.quantite) <= 0) {
        toast({ title: "Quantité invalide", description: `La quantité de la ligne ${i + 1} doit être > 0.`, variant: "destructive" })
        return
      }
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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="btn-gold">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau transfert
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau transfert de stock</DialogTitle>
              <DialogDescription>
                Transférez un ou plusieurs produits entre le magasin et la boutique.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Sens */}
              <div className="space-y-2">
                <Label>Direction du transfert</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSens("MAGASIN_VERS_BOUTIQUE")}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                      sens === "MAGASIN_VERS_BOUTIQUE"
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
                    onClick={() => setSens("BOUTIQUE_VERS_MAGASIN")}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                      sens === "BOUTIQUE_VERS_MAGASIN"
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

              {/* Lignes de produits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Produits à transférer</Label>
                  <Button type="button" variant="outline" size="sm" onClick={ajouterLigne}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter un produit
                  </Button>
                </div>

                <div className="space-y-2">
                  {lignes.map((ligne, i) => {
                    const produitSelectionne = (produits as any[]).find((p: any) => String(p.id) === ligne.produitId)
                    const optionsDispo = (produits as any[])
                      .filter((p: any) => !idsSelectionnes.includes(String(p.id)) || String(p.id) === ligne.produitId)
                      .map((p: any) => ({ value: String(p.id), label: p.libelle }))

                    return (
                      <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Produit {i + 1}</span>
                          {lignes.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => supprimerLigne(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-[1fr_120px] gap-2">
                          <AppSelect
                            placeholder="Sélectionner un produit..."
                            value={ligne.produitId ? { value: ligne.produitId, label: produitSelectionne?.libelle ?? "" } : null}
                            onChange={(opt: any) => modifierLigne(i, "produitId", opt?.value ?? "")}
                            options={optionsDispo}
                          />
                          <Input
                            type="number"
                            min={1}
                            placeholder="Qté"
                            value={ligne.quantite}
                            onChange={(e) => modifierLigne(i, "quantite", e.target.value)}
                          />
                        </div>
                        {produitSelectionne && (
                          <div className="flex gap-3 rounded-md bg-background px-3 py-1.5 text-xs border">
                            <span>Magasin : <strong>{produitSelectionne.stockMagasin?.quantite ?? 0}</strong></span>
                            <span className="text-muted-foreground">|</span>
                            <span>Boutique : <strong>{produitSelectionne.stockBoutique?.quantite ?? 0}</strong></span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Motif */}
              <div className="space-y-2">
                <Label>Motif (optionnel)</Label>
                <Textarea
                  placeholder="Raison du transfert..."
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? "Transfert en cours..." : `Confirmer (${lignes.length} produit${lignes.length > 1 ? "s" : ""})`}
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
