"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileOutput, Plus, Trash2, FileText, Banknote, AlertCircle, PackageCheck, ShoppingBag, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { avoirService, commandesService } from "@/services"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  PRODUITS:      { label: "Produits gardés",  color: "bg-orange-100 text-orange-700" },
  MONNAIE:       { label: "Monnaie restante", color: "bg-blue-100 text-blue-700" },
  CREDIT:        { label: "Crédit client",    color: "bg-blue-100 text-blue-700" },
  REMBOURSEMENT: { label: "Remboursement",    color: "bg-red-100 text-red-700" },
  GARDE:         { label: "Produits gardés",  color: "bg-orange-100 text-orange-700" },
}

const STATUT_LABEL: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  VALIDE:     { label: "En cours",   color: "bg-green-100 text-green-700" },
  ANNULE:     { label: "Annulé",     color: "bg-gray-100 text-gray-700" },
  REMBOURSE:  { label: "Remboursé",  color: "bg-purple-100 text-purple-700" },
  CONSOMME:   { label: "Consommé",   color: "bg-teal-100 text-teal-700" },
}

interface LigneAvoir {
  produitId?: number
  platId?: number
  libelle: string
  quantite: number
  prixUnitaire: number
}

// ─── Modal création avoir ────────────────────────────────────────────────────

function NouvelAvoirModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [etape, setEtape] = useState<1 | 2>(1)
  const [type, setType] = useState<"MONNAIE" | "PRODUITS" | "">("")
  const [commandeId, setCommandeId] = useState("")
  const [montantMonnaie, setMontantMonnaie] = useState("")  // pour MONNAIE : saisie directe
  const [lignes, setLignes] = useState<LigneAvoir[]>([])   // pour PRODUITS : articles sélectionnés
  const [motif, setMotif] = useState("")

  const reset = () => {
    setEtape(1); setType(""); setCommandeId("")
    setMontantMonnaie(""); setLignes([]); setMotif("")
  }
  const handleClose = () => { reset(); onClose() }

  // Liste commandes
  const { data: commandesData } = useQuery({
    queryKey: ["commandes-select"],
    queryFn: async () => {
      const res = await commandesService.getAll()
      const payload = (res as any).data
      return (payload?.data ?? payload) as any[]
    },
    enabled: open,
  })
  const commandes = commandesData || []
  const commandeSelectionnee = commandes.find((c: any) => String(c.id) === commandeId)

  // Détail commande (articles) — seulement pour PRODUITS
  const { data: commandeDetail } = useQuery({
    queryKey: ["commande-detail", commandeId],
    queryFn: async () => {
      const res = await commandesService.getById(commandeId)
      const payload = (res as any).data
      return (payload?.data ?? payload) as any
    },
    enabled: !!commandeId && type === "PRODUITS",
  })

  const ajouterLigne = (ligne: any) => {
    const existe = lignes.find(l =>
      (ligne.produitId && l.produitId === ligne.produitId) ||
      (ligne.platId && l.platId === ligne.platId)
    )
    if (existe) return
    setLignes(prev => [...prev, {
      produitId: ligne.produitId || undefined,
      platId: ligne.platId || undefined,
      libelle: ligne.produit?.libelle || ligne.plat?.libelle || "Article",
      quantite: ligne.quantiteCommande,
      prixUnitaire: Number(ligne.prixUnitaire),
    }])
  }
  const supprimerLigne = (i: number) => setLignes(prev => prev.filter((_, idx) => idx !== i))
  const updateLigne = (i: number, field: "quantite" | "prixUnitaire", val: number) =>
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const montantTotal = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0)

  const telechargerPdf = async (avoirId: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const response = await fetch(`${API_URL}/avoirs/recu?id=${avoirId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const blob = await response.blob()
      window.open(window.URL.createObjectURL(blob), "_blank")
    } catch {}
  }

  const createMutation = useMutation({
    mutationFn: () => {
      // MONNAIE : on envoie une ligne fictive avec le montant saisi
      const lignesPayload = type === "MONNAIE"
        ? [{ quantite: 1, prixUnitaire: Number(montantMonnaie) }]
        : lignes.map(l => ({ produitId: l.produitId, platId: l.platId, quantite: l.quantite, prixUnitaire: l.prixUnitaire }))

      return avoirService.create({
        commandeId: Number(commandeId),
        clientId: commandeSelectionnee?.clientId,
        type,
        motif: motif || undefined,
        lignes: lignesPayload,
      })
    },
    onSuccess: async (res: any) => {
      const avoirId = res?.data?.data?.id || res?.data?.id
      await queryClient.invalidateQueries({ queryKey: ["avoirs"] })
      toast({ title: "Avoir créé", description: "Téléchargement du reçu en cours..." })
      if (avoirId) await telechargerPdf(avoirId)
      handleClose()
    },
    onError: (e: any) => toast({
      title: "Erreur",
      description: e?.response?.data?.message || "Impossible de créer l'avoir",
      variant: "destructive",
    }),
  })

  const handleSubmit = () => {
    if (!commandeId) return toast({ title: "Erreur", description: "Sélectionnez une commande", variant: "destructive" })
    if (type === "MONNAIE") {
      const m = Number(montantMonnaie)
      if (!m || m <= 0) return toast({ title: "Erreur", description: "Saisissez le montant qui reste", variant: "destructive" })
    }
    if (type === "PRODUITS" && lignes.length === 0)
      return toast({ title: "Erreur", description: "Sélectionnez les produits qui restent", variant: "destructive" })
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel avoir</DialogTitle>
        </DialogHeader>

        {/* ── ÉTAPE 1 : Choisir le type ── */}
        {etape === 1 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Qu'est-ce qui reste pour le client ?</p>
            <div className="grid grid-cols-1 gap-3">

              <button
                onClick={() => { setType("MONNAIE"); setEtape(2) }}
                className="flex items-center gap-4 p-4 border-2 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Banknote className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-base">Sa monnaie reste</p>
                  <p className="text-sm text-muted-foreground">
                    Le client n'a pas récupéré son argent. Quand il revient, il choisira : prendre l'argent en espèces ou consommer.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto shrink-0" />
              </button>

              <button
                onClick={() => { setType("PRODUITS"); setEtape(2) }}
                className="flex items-center gap-4 p-4 border-2 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <PackageCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-base">Ses produits restent</p>
                  <p className="text-sm text-muted-foreground">
                    Le client n'a pas tout consommé. Les produits sont gardés ici. Il reviendra les récupérer.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto shrink-0" />
              </button>

            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : Détails ── */}
        {etape === 2 && (
          <div className="space-y-5 py-2">

            {/* Rappel type */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${type === "MONNAIE" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}>
              {type === "MONNAIE" ? <Banknote className="h-5 w-5 shrink-0" /> : <PackageCheck className="h-5 w-5 shrink-0" />}
              <span className="font-medium text-sm">
                {type === "MONNAIE"
                  ? "Monnaie restante — il reviendra prendre l'argent ou consommer"
                  : "Produits gardés — il reviendra les récupérer"}
              </span>
              <button
                onClick={() => { setEtape(1); setCommandeId(""); setLignes([]); setMontantMonnaie("") }}
                className="ml-auto text-xs underline opacity-70 hover:opacity-100 shrink-0"
              >
                Changer
              </button>
            </div>

            {/* Commande */}
            <div className="space-y-2">
              <Label>Commande concernée <span className="text-destructive">*</span></Label>
              <Select value={commandeId} onValueChange={v => { setCommandeId(v); setLignes([]) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une commande..." />
                </SelectTrigger>
                <SelectContent>
                  {commandes.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      CMD-{String(c.id).padStart(5, "0")} — {c.client?.prenom} {c.client?.nom} — {Number(c.montant).toLocaleString("fr-FR")} FCFA ({new Date(c.dateCommande).toLocaleDateString("fr-FR")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── CAS MONNAIE : montant qui reste ── */}
            {type === "MONNAIE" && (
              <div className="space-y-2">
                <Label>Montant qui reste <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ex: 500"
                    value={montantMonnaie}
                    onChange={e => setMontantMonnaie(e.target.value)}
                    className="text-right"
                  />
                  <span className="text-muted-foreground font-medium shrink-0">FCFA</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  C'est la monnaie que le client n'a pas prise. Quand il revient, vous choisirez : lui rendre en espèces ou créditer pour qu'il consomme.
                </p>
              </div>
            )}

            {/* ── CAS PRODUITS : sélection des articles qui restent ── */}
            {type === "PRODUITS" && commandeDetail && (
              <div className="space-y-2">
                <Label>Produits qui restent <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Cliquez sur les articles que le client laisse ici.</p>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {(commandeDetail.lignes || []).map((ligne: any) => {
                    const lib = ligne.produit?.libelle || ligne.plat?.libelle || "Article"
                    const deja = lignes.find(l =>
                      (ligne.produitId && l.produitId === ligne.produitId) ||
                      (ligne.platId && l.platId === ligne.platId)
                    )
                    return (
                      <div
                        key={ligne.id}
                        onClick={() => !deja && ajouterLigne(ligne)}
                        className={`flex justify-between items-center p-2 rounded-md border cursor-pointer transition-colors text-sm ${deja ? "bg-green-50 border-green-300 opacity-70 cursor-default" : "hover:bg-muted"}`}
                      >
                        <span className="font-medium">{lib}</span>
                        <span className="text-muted-foreground">
                          {ligne.quantiteCommande} × {Number(ligne.prixUnitaire).toLocaleString("fr-FR")} FCFA
                          {deja && <span className="ml-2 text-green-600 font-semibold">✓</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Résumé articles sélectionnés (PRODUITS) */}
            {type === "PRODUITS" && lignes.length > 0 && (
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                <p className="text-sm font-medium">Articles gardés :</p>
                {lignes.map((ligne, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-medium">{ligne.libelle}</span>
                    <Input type="number" min={1} value={ligne.quantite}
                      onChange={e => updateLigne(i, "quantite", Number(e.target.value))}
                      className="w-16 h-7 text-center" />
                    <span className="text-muted-foreground">×</span>
                    <Input type="number" min={0} value={ligne.prixUnitaire}
                      onChange={e => updateLigne(i, "prixUnitaire", Number(e.target.value))}
                      className="w-24 h-7 text-right" />
                    <span className="text-muted-foreground w-6">F</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => supprimerLigne(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="text-right font-bold pt-1 border-t text-sm">
                  Total : {montantTotal.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
            )}

            {/* Motif */}
            <div className="space-y-2">
              <Label>Motif (optionnel)</Label>
              <Textarea
                placeholder={type === "MONNAIE" ? "Ex: Le client est parti sans sa monnaie..." : "Ex: Poulet non consommé, bière non ouverte..."}
                value={motif}
                onChange={e => setMotif(e.target.value)}
                rows={2}
              />
            </div>

          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Annuler</Button>
          {etape === 2 && (
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                !commandeId ||
                (type === "MONNAIE" && (!montantMonnaie || Number(montantMonnaie) <= 0)) ||
                (type === "PRODUITS" && lignes.length === 0)
              }
            >
              {createMutation.isPending ? "Création..." : "Créer l'avoir"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function AvoirsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showNouvelAvoir, setShowNouvelAvoir] = useState(false)
  const [avoirToDelete, setAvoirToDelete] = useState<any>(null)
  const [avoirToRembourser, setAvoirToRembourser] = useState<any>(null)
  const [avoirToConsommer, setAvoirToConsommer] = useState<any>(null)
  const [avoirToRecuperer, setAvoirToRecuperer] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["avoirs"],
    queryFn: async () => {
      const res = await avoirService.getAll()
      const payload = (res as any).data
      return (payload?.data ?? payload) as any[]
    },
  })
  const avoirs = data || []

  const rembourserMutation = useMutation({
    mutationFn: (id: number) => avoirService.rembourserCredit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avoirs"] })
      setAvoirToRembourser(null)
      toast({ title: "Remboursé", description: "Le montant a été sorti de la caisse." })
    },
    onError: (e: any) => { setAvoirToRembourser(null); toast({ title: "Erreur", description: e?.response?.data?.message, variant: "destructive" }) },
  })

  const consommerMutation = useMutation({
    mutationFn: (id: number) => avoirService.consommerMonnaie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avoirs"] })
      setAvoirToConsommer(null)
      toast({ title: "Crédit ajouté", description: "La monnaie a été créditée sur le compte client." })
    },
    onError: (e: any) => { setAvoirToConsommer(null); toast({ title: "Erreur", description: e?.response?.data?.message, variant: "destructive" }) },
  })

  const recupererMutation = useMutation({
    mutationFn: (id: number) => avoirService.recupererGarde(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avoirs"] })
      setAvoirToRecuperer(null)
      toast({ title: "Produits récupérés", description: "Le client a récupéré ses produits." })
    },
    onError: (e: any) => { setAvoirToRecuperer(null); toast({ title: "Erreur", description: e?.response?.data?.message, variant: "destructive" }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => avoirService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avoirs"] })
      setAvoirToDelete(null)
      toast({ title: "Avoir supprimé" })
    },
    onError: (e: any) => { setAvoirToDelete(null); toast({ title: "Erreur", description: e?.response?.data?.message, variant: "destructive" }) },
  })

  const handleDownloadPdf = async (id: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/avoirs/recu?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      window.open(window.URL.createObjectURL(blob), "_blank")
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger le PDF", variant: "destructive" })
    }
  }

  const isMonnaie = (avoir: any) => ['MONNAIE', 'CREDIT'].includes(avoir.type)
  const isProduits = (avoir: any) => ['PRODUITS', 'GARDE'].includes(avoir.type)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileOutput className="h-7 w-7" /> Avoirs
          </h1>
          <p className="text-muted-foreground">Suivi des restes clients — produits gardés ou monnaie restante.</p>
        </div>
        <PermissionGuard permission="avoir.create">
          <Button onClick={() => setShowNouvelAvoir(true)}>
            <Plus className="mr-2 h-4 w-4" />Nouvel avoir
          </Button>
        </PermissionGuard>
      </div>

      <NouvelAvoirModal open={showNouvelAvoir} onClose={() => setShowNouvelAvoir(false)} />

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
                    const estValide = avoir.statut === "VALIDE"
                    return (
                      <TableRow key={avoir.id}>
                        <TableCell className="font-mono font-medium">AV-{String(avoir.id).padStart(5, "0")}</TableCell>
                        <TableCell>
                          <div>{new Date(avoir.dateAvoir).toLocaleDateString("fr-FR")}</div>
                          {avoir.dateRemboursement && (
                            <div className="text-xs text-purple-600">
                              {isProduits(avoir) ? "Récupéré" : avoir.statut === "CONSOMME" ? "Consommé" : "Remb."} le {new Date(avoir.dateRemboursement).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{avoir.client?.prenom} {avoir.client?.nom}</TableCell>
                        <TableCell className="font-mono">CMD-{String(avoir.commande?.id || avoir.commandeId).padStart(5, "0")}</TableCell>
                        <TableCell className="font-semibold">{Number(avoir.montant).toLocaleString("fr-FR")} FCFA</TableCell>
                        <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${type.color}`}>{type.label}</span></TableCell>
                        <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statut.color}`}>{statut.label}</span></TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">{avoir.motif || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            <PermissionGuard permission="avoir.export">
                              <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(avoir.id)}>
                                <FileText className="h-4 w-4 mr-1" />PDF
                              </Button>
                            </PermissionGuard>

                            {/* Produits gardés : Récupéré */}
                            {isProduits(avoir) && estValide && (
                              <PermissionGuard permission="avoir.create">
                                <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  onClick={() => setAvoirToRecuperer(avoir)}>
                                  <PackageCheck className="h-4 w-4 mr-1" />Récupéré
                                </Button>
                              </PermissionGuard>
                            )}

                            {/* Monnaie restante : Prendre argent OU Consommer */}
                            {isMonnaie(avoir) && estValide && (
                              <PermissionGuard permission="avoir.create">
                                <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                  onClick={() => setAvoirToRembourser(avoir)}>
                                  <Banknote className="h-4 w-4 mr-1" />Prendre argent
                                </Button>
                                <Button variant="outline" size="sm" className="border-teal-300 text-teal-700 hover:bg-teal-50"
                                  onClick={() => setAvoirToConsommer(avoir)}>
                                  <ShoppingBag className="h-4 w-4 mr-1" />Consommer
                                </Button>
                              </PermissionGuard>
                            )}

                            <PermissionGuard permission="avoir.delete">
                              {!["VALIDE", "REMBOURSE", "CONSOMME"].includes(avoir.statut) && (
                                <Button variant="destructive" size="sm" onClick={() => setAvoirToDelete(avoir)}>
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

      {/* Dialog récupération produits */}
      <AlertDialog open={!!avoirToRecuperer} onOpenChange={() => setAvoirToRecuperer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-orange-600" />Produits récupérés
            </AlertDialogTitle>
            <AlertDialogDescription>
              Confirmer que <strong>{avoirToRecuperer?.client?.prenom} {avoirToRecuperer?.client?.nom}</strong> est venu récupérer ses produits gardés ?
              <br /><br />La date de récupération sera enregistrée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={recupererMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-orange-600 hover:bg-orange-700 text-white" disabled={recupererMutation.isPending}
              onClick={(e) => { e.preventDefault(); recupererMutation.mutate(avoirToRecuperer.id) }}>
              {recupererMutation.isPending ? "En cours..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog prendre argent */}
      <AlertDialog open={!!avoirToRembourser} onOpenChange={() => setAvoirToRembourser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-purple-600" />Prendre l'argent en espèces
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{avoirToRembourser?.client?.prenom} {avoirToRembourser?.client?.nom}</strong> vient récupérer{" "}
              <strong>{Number(avoirToRembourser?.montant).toLocaleString("fr-FR")} FCFA</strong> en espèces.
              <br /><br />Ce montant sortira de la caisse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rembourserMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-purple-600 hover:bg-purple-700 text-white" disabled={rembourserMutation.isPending}
              onClick={(e) => { e.preventDefault(); rembourserMutation.mutate(avoirToRembourser.id) }}>
              {rembourserMutation.isPending ? "En cours..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog consommer */}
      <AlertDialog open={!!avoirToConsommer} onOpenChange={() => setAvoirToConsommer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-teal-600" />Consommer la monnaie
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{avoirToConsommer?.client?.prenom} {avoirToConsommer?.client?.nom}</strong> veut utiliser{" "}
              <strong>{Number(avoirToConsommer?.montant).toLocaleString("fr-FR")} FCFA</strong> pour consommer.
              <br /><br />Ce montant sera crédité sur son compte et déduit automatiquement à sa prochaine commande.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={consommerMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-teal-600 hover:bg-teal-700 text-white" disabled={consommerMutation.isPending}
              onClick={(e) => { e.preventDefault(); consommerMutation.mutate(avoirToConsommer.id) }}>
              {consommerMutation.isPending ? "En cours..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog suppression */}
      <AlertDialog open={!!avoirToDelete} onOpenChange={() => setAvoirToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />Supprimer l'avoir
            </AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer l'avoir <strong>AV-{String(avoirToDelete?.id).padStart(5, "0")}</strong> de{" "}
              <strong>{Number(avoirToDelete?.montant).toLocaleString("fr-FR")} FCFA</strong> ?
              <br />Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={deleteMutation.isPending}
              onClick={(e) => { e.preventDefault(); deleteMutation.mutate(String(avoirToDelete.id)) }}>
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
