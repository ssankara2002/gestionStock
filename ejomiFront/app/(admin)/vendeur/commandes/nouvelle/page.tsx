"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Search, Save } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/components/layout/footer"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-provider"
import { produitService, userService, platService } from "@/services"
import type { User } from "@/types/user"
import type { CommandeCreateData, LigneCommandeInput } from "@/types/commande"
import type { Plat } from "@/types/plat"
import { ModePaiement } from "@/types/paiement"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Produit } from "@/types/produit"
import { commandesService } from "@/services/commande-service"
import { commandeSchema } from "@/lib/validations"

// Schema for the main form fields only (lignes validated manually)
const mainFormSchema = commandeSchema.pick({
  dateCommande: true,
  clientId: true,
  reductionGlobale: true,
})

type MainFormValues = z.infer<typeof mainFormSchema>

export default function NouvelleCommandePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [products, setProducts] = useState<Produit[]>([])
  const [plats, setPlats] = useState<Plat[]>([])
  const [clients, setClients] = useState<User[]>([])
  const [catalogueType, setCatalogueType] = useState<"PRODUIT" | "PLAT">("PRODUIT")

  // État local pour gérer les lignes de commande avant soumission
  interface LigneCommandeLocal extends LigneCommandeInput {
    id: string // ID temporaire pour gérer l'affichage
  }

  const [lignesCommande, setLignesCommande] = useState<LigneCommandeLocal[]>([])
  const [vendeurId, setVendeurId] = useState<number | undefined>(undefined)
  const [montantTotal, setMontantTotal] = useState(0)

  const [enregistrerPaiement, setEnregistrerPaiement] = useState(true)
  const [montantPaiement, setMontantPaiement] = useState<string>("")
  const [modePaiement, setModePaiement] = useState<string>(ModePaiement.ESPECES)

  // État pour la recherche de produits
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  // react-hook-form setup with Zod for main fields
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema),
    defaultValues: {
      dateCommande: new Date().toISOString().split("T")[0],
      clientId: undefined,
      reductionGlobale: 0,
    },
  })

  const reductionGlobale = watch("reductionGlobale") ?? 0

  // Mettre à jour le vendeurId lorsque l'utilisateur est chargé
  useEffect(() => {
    console.log("User from context:", user)
    console.log("User employe:", user?.employe)
    console.log("Employe ID:", user?.employe?.id)

    if (user?.employe?.id) {
      console.log("Setting vendeurId to:", user.employe.id)
      setVendeurId(user.employe.id)
    } else {
      console.warn("No employe ID found for user")
    }
  }, [user])

  // État pour le nouveau client
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    prenom: "",
    nom: "",
    email: "",
    tel: "",
    adresse: "",
  })

  // Charger les produits et les clients
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [productsRes, platsRes, usersRes] = await Promise.all([
          produitService.getAll(),
          platService.getAll(),
          userService.getAll(),
        ])
        // @ts-ignore - API retourne { success, data }
        setProducts(productsRes.data.data || productsRes.data || [])
        // @ts-ignore - API retourne { success, data }
        const platsData = platsRes.data.data?.data || platsRes.data.data || platsRes.data || []
        setPlats(platsData)
        // Filtrer pour ne garder que les clients
        const allClients = usersRes.data.data.filter((u: User) => u.role?.name === "CLIENT" || !u.role)
        setClients(allClients)
      } catch (error) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les produits, les plats ou les clients.",
          variant: "destructive",
        })
      }
    }
    loadInitialData()
  }, [toast])

  const filteredItems = (catalogueType === "PRODUIT" ? products : plats).filter((item: any) =>
    item.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Calculer le montant total
  useEffect(() => {
    // Les réductions produits sont maintenant des montants absolus en FCFA
    const total = lignesCommande.reduce((sum, ligne) => {
      const prixTotal = ligne.prixUnitaire * ligne.quantite
      const prixAvecReduction = Math.max(0, prixTotal - ligne.reduction)
      return sum + prixAvecReduction
    }, 0)

    // La réduction globale est aussi un montant absolu en FCFA
    const totalAvecReduction = Math.max(0, total - (Number(reductionGlobale) || 0))
    setMontantTotal(Number.parseFloat(totalAvecReduction.toFixed(2)))
  }, [lignesCommande, reductionGlobale])

  // Ajouter une ligne de commande
  const ajouterLigne = (selectedItemId: string) => {
    if (!selectedItemId) {
      toast({
        title: "Erreur",
        description: `Veuillez sélectionner un ${catalogueType === "PRODUIT" ? "produit" : "plat"}`,
        variant: "destructive",
      })
      return
    }

    if (catalogueType === "PLAT") {
      const plat = plats.find((p) => p.id.toString() === selectedItemId)
      if (!plat) return

      const ligneExistante = lignesCommande.find((ligne) => ligne.platId?.toString() === selectedItemId)
      if (ligneExistante) {
        setLignesCommande((prevLignes) =>
          prevLignes.map((ligne) =>
            ligne.platId?.toString() === selectedItemId
              ? { ...ligne, quantite: ligne.quantite + selectedQuantity }
              : ligne,
          ),
        )
      } else {
        const nouvelleLigne: LigneCommandeLocal = {
          id: Math.random().toString(36).substring(2, 15),
          platId: Number.parseInt(selectedItemId),
          quantite: selectedQuantity,
          prixUnitaire: Number(plat.prixVenteUnitaire),
          reduction: 0,
        }
        setLignesCommande((prevLignes) => [...prevLignes, nouvelleLigne])
      }

      setSelectedQuantity(1)
      setSearchTerm("")
      toast({ title: "Plat ajouté", description: `${plat.libelle} a été ajouté à la commande` })
      return
    }

    const product = products.find((p) => p.id.toString() === selectedItemId)
    if (!product) return

    const ligneExistante = lignesCommande.find((ligne) => ligne.produitId?.toString() === selectedItemId)
    const quantiteDejaDansCommande = ligneExistante ? ligneExistante.quantite : 0
    const nouvelleQuantiteTotale = quantiteDejaDansCommande + selectedQuantity

    if (nouvelleQuantiteTotale > (product.stockBoutique?.quantite ?? 0)) {
      toast({
        title: "Stock insuffisant",
        description: `Stock disponible pour "${product.libelle}": ${product.stockBoutique?.quantite ?? 0}. Quantité déjà dans la commande: ${quantiteDejaDansCommande}`,
        variant: "destructive",
      })
      return
    }

    if (ligneExistante) {
      setLignesCommande((prevLignes) =>
        prevLignes.map((ligne) =>
          ligne.produitId?.toString() === selectedItemId
            ? { ...ligne, quantite: ligne.quantite + selectedQuantity }
            : ligne,
        ),
      )
    } else {
      const nouvelleLigne: LigneCommandeLocal = {
        id: Math.random().toString(36).substring(2, 15),
        produitId: Number.parseInt(selectedItemId),
        quantite: selectedQuantity,
        prixUnitaire: Number(product.prixDeVenteUnitaire),
        reduction: 0,
      }

      setLignesCommande((prevLignes) => [...prevLignes, nouvelleLigne])
    }

    setSelectedQuantity(1)
    setSearchTerm("")

    toast({
      title: "Produit ajouté",
      description: `${product.libelle} a été ajouté à la commande`,
    })
  }

  // Supprimer une ligne de commande
  const supprimerLigne = (ligneId: string) => {
    setLignesCommande((prevLignes) => prevLignes.filter((ligne) => ligne.id !== ligneId))

    toast({
      title: "Produit retiré",
      description: "Le produit a été retiré de la commande",
    })
  }

  // Mettre à jour la quantité d'une ligne
  const updateQuantite = (ligneId: string, quantite: number) => {
    if (quantite <= 0) return

    // Trouver la ligne concernée
    const ligne = lignesCommande.find((l) => l.id === ligneId)
    if (!ligne) return

    // Trouver le produit
    const product = products.find((p) => p.id === ligne.produitId)
    if (!product) return

    // Vérifier le stock disponible
    if (quantite > (product.stockBoutique?.quantite ?? 0)) {
      toast({
        title: "Stock insuffisant",
        description: `Stock disponible pour "${product.libelle}": ${product.stockBoutique?.quantite ?? 0}`,
        variant: "destructive",
      })
      return
    }

    setLignesCommande((prevLignes) =>
      prevLignes.map((ligne) => (ligne.id === ligneId ? { ...ligne, quantite } : ligne)),
    )
  }

  // Mettre à jour la réduction d'une ligne
  const updateReduction = (ligneId: string, reduction: number) => {
    if (reduction < 0) return
    setLignesCommande((prevLignes) =>
      prevLignes.map((ligne) => (ligne.id === ligneId ? { ...ligne, reduction } : ligne)),
    )
  }

  const updatePrixUnitaire = (ligneId: string, prixUnitaire: number) => {
    if (prixUnitaire < 0) return
    setLignesCommande((prevLignes) =>
      prevLignes.map((ligne) => (ligne.id === ligneId ? { ...ligne, prixUnitaire } : ligne)),
    )
  }

  const remplirMontantTotal = () => {
    setMontantPaiement(montantTotal.toString())
  }

  // Enregistrer la vente — appelé par handleSubmit après validation Zod des champs principaux
  const onSubmit = async (data: MainFormValues) => {
    // Validation manuelle des lignes de commande
    if (!lignesCommande.length) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit ou plat à la commande",
        variant: "destructive",
      })
      return
    }

    if (!enregistrerPaiement) {
      toast({
        title: "Paiement requis",
        description: "Veuillez enregistrer un paiement pour valider la commande",
        variant: "destructive",
      })
      return
    }

    const montantNum = Number(montantPaiement)
    if (!montantNum || montantNum <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un montant de paiement valide",
        variant: "destructive",
      })
      return
    }

    if (montantNum > montantTotal) {
      toast({
        title: "Erreur",
        description: "Le montant du paiement ne peut pas dépasser le montant total de la commande",
        variant: "destructive",
      })
      return
    }

    try {
      // Préparer les données pour l'envoi au backend
      const commandeData: CommandeCreateData = {
        dateCommande: new Date(data.dateCommande),
        clientId: data.clientId,
        vendeurId,
        reduction: Number(data.reductionGlobale) || 0,
        statut: "EN_ATTENTE",
        lignes: lignesCommande.map(({ id, ...ligne }) => ligne),
      }

      // Ajouter les informations de paiement si nécessaire
      if (enregistrerPaiement && montantPaiement && Number(montantPaiement) > 0) {
        commandeData.montantPaye = Number(montantPaiement)
        commandeData.modePaiement = modePaiement
      }

      console.log("Sending commande data:", commandeData)
      console.log("VendeurId being sent:", vendeurId)

      await commandesService.create(commandeData)

      if (enregistrerPaiement && montantPaiement && Number(montantPaiement) > 0) {
        toast({
          title: "Commande et paiement enregistrés",
          description: `La commande et le paiement de ${Number(montantPaiement).toLocaleString()} FCFA ont été enregistrés avec succès`,
        })
      } else {
        toast({
          title: "Commande enregistrée",
          description: `La commande a été enregistrée avec succès`,
        })
      }

      router.push("/vendeur/commandes")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'enregistrement",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  // Ajouter un nouveau client
  const ajouterNouveauClient = async () => {
    if (!newClient.nom || !newClient.adresse) {
      toast({
        title: "Erreur",
        description: "Le nom et l'adresse du client sont requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await userService.create({ ...newClient, role: "CLIENT" })
      const createdClient = response.data.data

      // Mettre à jour la liste des clients et sélectionner le nouveau
      setClients((prevClients) => [...prevClients, createdClient])
      setValue("clientId", createdClient.id)

      // Fermer le dialogue et réinitialiser le formulaire
      setIsNewClientDialogOpen(false)
      setNewClient({ prenom: "", nom: "", email: "", tel: "", adresse: "" })

      toast({
        title: "Client ajouté",
        description: `${[createdClient.prenom, createdClient.nom].filter(Boolean).join(" ") || createdClient.nom} a été ajouté avec succès.`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'ajout du client",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  const clientIdValue = watch("clientId")
  const montantRestant = montantTotal - (enregistrerPaiement ? Number(montantPaiement) || 0 : 0)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center gap-2 mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/vendeur/commandes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux ventes
              </Link>
            </Button>
          </div>

          <h1 className="font-playfair text-3xl font-bold md:text-4xl mb-8">Nouvelle Vente</h1>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                {/* Informations de la vente */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de la vente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dateCommande">Date</Label>
                        <Input
                          id="dateCommande"
                          type="date"
                          {...register("dateCommande")}
                        />
                        {errors.dateCommande && (
                          <p className="text-sm text-red-500 mt-1">{errors.dateCommande.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientId">Client</Label>
                        <div className="flex gap-2">
                          <Controller
                            name="clientId"
                            control={control}
                            render={({ field }) => (
                              <AppSelect
                                placeholder="Sélectionner un client"
                                value={
                                  field.value
                                    ? {
                                        value: field.value.toString(),
                                        label: (() => {
                                          const c = clients.find((c) => c.id === field.value)
                                          return c ? [c.prenom, c.nom].filter(Boolean).join(" ") || c.nom : ""
                                        })(),
                                      }
                                    : null
                                }
                                onChange={(opt: any) => field.onChange(opt ? Number.parseInt(opt.value) : undefined)}
                                options={clients.map((c) => ({ value: c.id.toString(), label: [c.prenom, c.nom].filter(Boolean).join(" ") || c.nom }))}
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0 text-xs whitespace-nowrap"
                            title="Sélectionner un client anonyme (client de passage)"
                            onClick={async () => {
                              try {
                                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
                                const token = localStorage.getItem("token")
                                const res = await fetch(`${API_URL}/users/client-anonyme`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                })
                                const body = await res.json()
                                const anonyme = body.data
                                if (!clients.find((c) => c.id === anonyme.id)) {
                                  setClients((prev) => [...prev, anonyme])
                                }
                                setValue("clientId", anonyme.id)
                                toast({ title: "Client de passage sélectionné" })
                              } catch {
                                toast({
                                  title: "Erreur",
                                  description: "Impossible de charger le client anonyme",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            De passage
                          </Button>
                          <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Ajouter un client</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Ajouter un nouveau client</DialogTitle>
                                <DialogDescription>
                                  Créez un nouveau client pour l'ajouter à votre vente.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="nom" className="text-right">
                                    Nom <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="nom"
                                    value={newClient.nom}
                                    onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                                    className="col-span-3"
                                    required
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="prenom" className="text-right">
                                    Prénom
                                  </Label>
                                  <Input
                                    id="prenom"
                                    value={newClient.prenom}
                                    onChange={(e) => setNewClient({ ...newClient, prenom: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="tel" className="text-right">
                                    Téléphone
                                  </Label>
                                  <Input
                                    id="tel"
                                    value={newClient.tel}
                                    onChange={(e) => setNewClient({ ...newClient, tel: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="email" className="text-right">
                                    Email
                                  </Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={newClient.email}
                                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="adresse" className="text-right">
                                    Adresse <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="adresse"
                                    value={newClient.adresse}
                                    onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
                                    className="col-span-3"
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsNewClientDialogOpen(false)}>
                                  Annuler
                                </Button>
                                <Button type="button" onClick={ajouterNouveauClient}>
                                  Ajouter
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {errors.clientId && (
                          <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="reductionGlobale">Réduction globale (FCFA)</Label>
                        <Input
                          id="reductionGlobale"
                          type="number"
                          min="0"
                          {...register("reductionGlobale")}
                        />
                        {errors.reductionGlobale && (
                          <p className="text-sm text-red-500 mt-1">{errors.reductionGlobale.message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ajouter des produits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter des produits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex gap-2 rounded-md border p-1">
                        <Button
                          type="button"
                          variant={catalogueType === "PRODUIT" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCatalogueType("PRODUIT")}
                        >
                          Produits
                        </Button>
                        <Button
                          type="button"
                          variant={catalogueType === "PLAT" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCatalogueType("PLAT")}
                        >
                          Plats
                        </Button>
                      </div>

                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={catalogueType === "PRODUIT" ? "Rechercher un produit..." : "Rechercher un plat..."}
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredItems.length > 0 ? (
                              filteredItems.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="p-2 hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    setSearchTerm(item.libelle)
                                    ajouterLigne(item.id.toString())
                                  }}
                                >
                                  <p className="font-medium">{item.libelle}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.prixDeVenteUnitaire ?? item.prixVenteUnitaire} FCFA
                                    {catalogueType === "PRODUIT" ? ` - Stock boutique: ${item.stockBoutique?.quantite ?? 0}` : ""}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Aucun {catalogueType === "PRODUIT" ? "produit" : "plat"} trouvé
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qté"
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lignes de commande */}
                <Card>
                  <CardHeader>
                    <CardTitle>Détails de la vente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lignesCommande.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                        <h3 className="mt-2 text-lg font-medium">Aucun produit ajouté</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Recherchez et ajoutez des produits à votre vente
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead className="text-right">Prix unitaire</TableHead>
                              <TableHead className="text-center">Quantité</TableHead>
                              <TableHead className="text-right">Réduction (FCFA)</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lignesCommande.map((ligne) => {
                              const product = products.find((p) => p.id === ligne.produitId)
                              const plat = plats.find((p) => p.id === ligne.platId)
                              const itemLabel = product?.libelle ?? plat?.libelle ?? "Élément introuvable"
                              const prixTotal = ligne.prixUnitaire * ligne.quantite
                              const total = Math.max(0, prixTotal - ligne.reduction)

                              return (
                                <TableRow key={ligne.id}>
                                  <TableCell className="font-medium">
                                    {itemLabel}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {plat ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          className="w-24 h-7 text-right"
                                          value={ligne.prixUnitaire}
                                          onChange={(e) => updatePrixUnitaire(ligne.id, Number.parseFloat(e.target.value) || 0)}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">FCFA</span>
                                      </div>
                                    ) : (
                                      <span>{ligne.prixUnitaire.toFixed(2)} FCFA</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-r-none bg-transparent"
                                        onClick={() => updateQuantite(ligne.id, ligne.quantite - 1)}
                                      >
                                        -
                                      </Button>
                                      <div className="flex h-7 w-10 items-center justify-center border-y">
                                        {ligne.quantite}
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-l-none bg-transparent"
                                        onClick={() => updateQuantite(ligne.id, ligne.quantite + 1)}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      min="0"
                                      className="w-20 h-7 text-right ml-auto"
                                      value={ligne.reduction}
                                      onChange={(e) =>
                                        updateReduction(ligne.id, Number.parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{total.toFixed(2)} FCFA</TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => supprimerLigne(ligne.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Supprimer</span>
                                    </Button>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Paiement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enregistrerPaiement"
                        checked={enregistrerPaiement}
                        onCheckedChange={(checked) => setEnregistrerPaiement(checked as boolean)}
                      />
                      <Label htmlFor="enregistrerPaiement" className="cursor-pointer">
                        Enregistrer un paiement maintenant
                      </Label>
                    </div>

                    {enregistrerPaiement && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="montantPaiement">Montant du paiement (FCFA)</Label>
                            <div className="flex gap-2">
                              <Input
                                id="montantPaiement"
                                type="number"
                                step="0.01"
                                min="0"
                                max={montantTotal}
                                value={montantPaiement}
                                onChange={(e) => setMontantPaiement(e.target.value)}
                                placeholder="0.00"
                              />
                              <Button type="button" variant="outline" onClick={remplirMontantTotal}>
                                Tout
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Montant total: {montantTotal.toLocaleString()} FCFA
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="modePaiement">Mode de paiement</Label>
                            <AppSelect
                              value={{
                                value: modePaiement,
                                label:
                                  {
                                    ESPECES: "Espèces",
                                    ORANGE_MONEY: "Orange Money",
                                    MOOV_MONEY: "Moov Money",
                                    AUTRE: "Autre",
                                  }[modePaiement] ?? modePaiement,
                              }}
                              onChange={(opt: any) => setModePaiement(opt?.value ?? ModePaiement.ESPECES)}
                              options={[
                                { value: ModePaiement.ESPECES, label: "Espèces" },
                                { value: ModePaiement.ORANGE_MONEY, label: "Orange Money" },
                                { value: ModePaiement.MOOV_MONEY, label: "Moov Money" },
                                { value: ModePaiement.AUTRE, label: "Autre" },
                              ]}
                            />
                          </div>
                        </div>

                        {montantPaiement && Number(montantPaiement) < montantTotal && (
                          <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                            <p className="text-sm font-medium text-orange-800">
                              Créance restante: {montantRestant.toLocaleString()} FCFA
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                              Le client devra payer le montant restant ultérieurement
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Récapitulatif */}
              <div>
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>
                          {lignesCommande
                            .reduce((sum, ligne) => {
                              return sum + ligne.prixUnitaire * ligne.quantite
                            }, 0)
                            .toFixed(2)}{" "}
                          FCFA
                        </span>
                      </div>

                      {lignesCommande.some((ligne) => ligne.reduction > 0) && (
                        <div className="flex justify-between text-primary">
                          <span>Réductions produits</span>
                          <span>
                            -{lignesCommande.reduce((sum, ligne) => sum + ligne.reduction, 0).toFixed(2)} FCFA
                          </span>
                        </div>
                      )}

                      {Number(reductionGlobale) > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Réduction globale</span>
                          <span>-{Number(reductionGlobale).toFixed(2)} FCFA</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{montantTotal.toFixed(2)} FCFA</span>
                    </div>

                    {enregistrerPaiement && montantPaiement && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between text-green-600">
                            <span>Montant payé</span>
                            <span className="font-medium">{Number(montantPaiement).toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between text-orange-600">
                            <span>Créance restante</span>
                            <span className="font-medium">{montantRestant.toLocaleString()} FCFA</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="pt-4">
                      <div className="rounded-lg bg-muted p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <p className="font-medium">Client</p>
                            <p className="text-muted-foreground">
                              {clientIdValue
                                ? (() => {
                                    const client = clients.find((c) => c.id === clientIdValue)
                                    return client ? [client.prenom, client.nom].filter(Boolean).join(" ") || client.nom : "Client non sélectionné"
                                  })()
                                : "Client non sélectionné"}
                            </p>
                          </div>
                          <div className="text-sm text-right">
                            <p className="font-medium">Nombre d'articles</p>
                            <p className="text-muted-foreground">
                              {lignesCommande.reduce((sum, ligne) => sum + ligne.quantite, 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" size="lg">
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer la vente
                    </Button>
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <Link href="/vendeur/commandes">Annuler</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
