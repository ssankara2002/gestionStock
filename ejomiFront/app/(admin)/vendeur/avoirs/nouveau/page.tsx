"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { avoirService, commandesService } from "@/services"
import Link from "next/link"

interface LigneAvoir {
  produitId?: number
  platId?: number
  libelle: string
  quantite: number
  prixUnitaire: number
}

export default function NouvelAvoirPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [commandeId, setCommandeId] = useState("")
  const [type, setType] = useState<"REMBOURSEMENT" | "CREDIT">("CREDIT")
  const [motif, setMotif] = useState("")
  const [lignes, setLignes] = useState<LigneAvoir[]>([])
  const [creditDispo, setCreditDispo] = useState<number | null>(null)

  // Charger toutes les commandes
  const { data: commandesData } = useQuery({
    queryKey: ["commandes-select"],
    queryFn: async () => {
      const res = await commandesService.getAll(1, 500)
      return res.data.data as any[]
    },
  })
  const commandes = commandesData || []

  // Commande sélectionnée
  const commandeSelectionnee = commandes.find((c: any) => String(c.id) === commandeId)

  // Lignes de la commande sélectionnée
  const { data: commandeDetail } = useQuery({
    queryKey: ["commande-detail", commandeId],
    queryFn: async () => {
      const res = await commandesService.getById(commandeId)
      return res.data.data as any
    },
    enabled: !!commandeId,
  })

  // Crédit disponible du client
  useEffect(() => {
    if (commandeSelectionnee?.clientId) {
      avoirService.getClientCredit(String(commandeSelectionnee.clientId))
        .then(res => setCreditDispo(res.data.data?.creditDisponible ?? 0))
        .catch(() => setCreditDispo(null))
    } else {
      setCreditDispo(null)
    }
  }, [commandeSelectionnee?.clientId])

  const ajouterLigneDepuisCommande = (ligne: any) => {
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

  const updateLigne = (i: number, field: "quantite" | "prixUnitaire", val: number) => {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  const montantTotal = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0)

  const createMutation = useMutation({
    mutationFn: () => avoirService.create({
      commandeId: Number(commandeId),
      clientId: commandeSelectionnee?.clientId,
      type,
      motif: motif || undefined,
      lignes: lignes.map(l => ({
        produitId: l.produitId,
        platId: l.platId,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
    }),
    onSuccess: () => {
      toast({ title: "Avoir créé avec succès" })
      router.push("/vendeur/avoirs")
    },
    onError: (e: any) => toast({
      title: "Erreur",
      description: e?.response?.data?.message || "Impossible de créer l'avoir",
      variant: "destructive",
    }),
  })

  const handleSubmit = () => {
    if (!commandeId) return toast({ title: "Erreur", description: "Sélectionnez une commande", variant: "destructive" })
    if (lignes.length === 0) return toast({ title: "Erreur", description: "Ajoutez au moins un article", variant: "destructive" })
    createMutation.mutate()
  }

  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/vendeur/avoirs"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Nouvel avoir</h1>
      </div>

      {/* Sélection commande */}
      <Card>
        <CardHeader><CardTitle>Commande concernée</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Commande *</Label>
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

          {commandeSelectionnee && creditDispo !== null && creditDispo > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 text-blue-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Ce client a <strong className="mx-1">{Number(creditDispo).toLocaleString("fr-FR")} FCFA</strong> de crédit disponible.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Articles de la commande à sélectionner */}
      {commandeDetail && (
        <Card>
          <CardHeader><CardTitle>Articles de la commande — cliquez pour ajouter à l'avoir</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(commandeDetail.lignes || []).map((ligne: any) => {
                const lib = ligne.produit?.libelle || ligne.plat?.libelle || "Article"
                const deja = lignes.find(l =>
                  (ligne.produitId && l.produitId === ligne.produitId) ||
                  (ligne.platId && l.platId === ligne.platId)
                )
                return (
                  <div
                    key={ligne.id}
                    onClick={() => !deja && ajouterLigneDepuisCommande(ligne)}
                    className={`flex justify-between items-center p-3 rounded-md border cursor-pointer transition-colors ${deja ? "bg-green-50 border-green-300 cursor-default opacity-60" : "hover:bg-muted"}`}
                  >
                    <span className="font-medium">{lib}</span>
                    <span className="text-sm text-muted-foreground">
                      {ligne.quantiteCommande} × {Number(ligne.prixUnitaire).toLocaleString("fr-FR")} FCFA
                      {deja && <span className="ml-2 text-green-600 font-semibold">✓ ajouté</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lignes de l'avoir */}
      {lignes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Articles retournés</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {lignes.map((ligne, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                <span className="flex-1 font-medium">{ligne.libelle}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Qté</Label>
                  <Input
                    type="number" min={1}
                    value={ligne.quantite}
                    onChange={e => updateLigne(i, "quantite", Number(e.target.value))}
                    className="w-20 text-center"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Prix unit.</Label>
                  <Input
                    type="number" min={0}
                    value={ligne.prixUnitaire}
                    onChange={e => updateLigne(i, "prixUnitaire", Number(e.target.value))}
                    className="w-28 text-right"
                  />
                </div>
                <span className="w-28 text-right font-semibold text-sm">
                  {(ligne.quantite * ligne.prixUnitaire).toLocaleString("fr-FR")} FCFA
                </span>
                <Button variant="ghost" size="icon" onClick={() => supprimerLigne(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="text-right font-bold text-lg pt-2 border-t">
              Total avoir : {montantTotal.toLocaleString("fr-FR")} FCFA
            </div>
          </CardContent>
        </Card>
      )}

      {/* Type et motif */}
      <Card>
        <CardHeader><CardTitle>Type d'avoir</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={type} onValueChange={v => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDIT">Crédit client (gardé pour prochaine commande)</SelectItem>
                <SelectItem value="REMBOURSEMENT">Remboursement en espèces (caisse)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {type === "CREDIT"
                ? "Le montant sera crédité sur le compte du client et utilisable à la prochaine commande."
                : "Le montant sera remboursé en espèces — la caisse diminuera du montant de l'avoir."}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Motif (optionnel)</Label>
            <Textarea
              placeholder="Ex: Poulet non consommé, boisson non servie..."
              value={motif}
              onChange={e => setMotif(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild><Link href="/vendeur/avoirs">Annuler</Link></Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending || lignes.length === 0 || !commandeId}>
          {createMutation.isPending ? "Création..." : "Créer l'avoir"}
        </Button>
      </div>
    </div>
  )
}
