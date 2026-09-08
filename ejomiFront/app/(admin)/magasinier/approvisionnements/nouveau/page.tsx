"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Footer } from "@/components/layout/footer"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-provider"
import { produitService, fournisseurService, approvisionnementService } from "@/services"
import type { Produit } from "@/types/produit"
import type { Fournisseur } from "@/types/fournisseur"
import type { ApprovisionnementCreateData, LigneApprovisionnementInput } from "@/types/approvisionnement"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { approvisionnementSchema, type ApprovisionnementFormValues } from "@/lib/validations"

export default function NouvelApprovisionnementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  interface LigneApprovisionnementLocal extends LigneApprovisionnementInput {
    id: string
  }

  const [products, setProducts] = useState<Produit[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [lignesApprovisionnement, setLignesApprovisionnement] = useState<LigneApprovisionnementLocal[]>([])
  const [montantTotal, setMontantTotal] = useState(0)

  // État pour la sélection de produits
  const [selectedProduitId, setSelectedProduitId] = useState<string>("")
  const [selectedQuantity, setSelectedQuantity] = useState<string>("")
  const [selectedPrixUnitaire, setSelectedPrixUnitaire] = useState<string>("")
  const [selectedDateFabrication, setSelectedDateFabrication] = useState("")
  const [selectedDatePeremption, setSelectedDatePeremption] = useState("")

  // États pour les dialogues
  const [isNewFournisseurDialogOpen, setIsNewFournisseurDialogOpen] = useState(false)
  const [isNewProduitDialogOpen, setIsNewProduitDialogOpen] = useState(false)

  // État pour le nouveau fournisseur
  const [newFournisseur, setNewFournisseur] = useState({
    prenom: "",
    nom: "",
    email: "",
    tel: "",
    adresse: "",
  })

  // État pour le nouveau produit
  const [newProduit, setNewProduit] = useState({
    libelle: "",
    description: "",
    prixDeVenteUnitaire: "",
    prixAchatUnitaire: "",
  })

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApprovisionnementFormValues>({
    resolver: zodResolver(approvisionnementSchema),
    defaultValues: {
      fournisseurId: 0,
    },
  })

  const watchedFournisseurId = watch("fournisseurId")

  // Charger les produits et les fournisseurs
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [productsRes, fournisseursRes] = await Promise.all([
          produitService.getAll(),
          fournisseurService.getAll(),
        ])
        const productsData: any[] = (productsRes as any).data?.data || productsRes.data || []
        const fournisseursData: any[] = (fournisseursRes as any).data?.data || fournisseursRes.data || []

        setProducts(productsData.filter((p: any) => p && p.id))
        setFournisseurs(fournisseursData.filter((f: any) => f && f.id))
      } catch (error) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les produits ou les fournisseurs.",
          variant: "destructive",
        })
      }
    }
    loadInitialData()
  }, [toast])

  // Calculer le montant total
  useEffect(() => {
    const total = lignesApprovisionnement.reduce((sum, ligne) => sum + ligne.montant, 0)
    setMontantTotal(Number.parseFloat(total.toFixed(2)))
  }, [lignesApprovisionnement])

  // Ajouter une ligne d'approvisionnement
  const ajouterLigne = (selectedProductId: string) => {
    if (!selectedProductId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit",
        variant: "destructive",
      })
      return
    }

    const qty = Number.parseInt(selectedQuantity)
    const prix = Number.parseFloat(selectedPrixUnitaire)

    if (!qty || qty <= 0 || !prix || prix <= 0) {
      toast({
        title: "Erreur",
        description: "La quantité et le prix unitaire doivent être supérieurs à 0",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id.toString() === selectedProductId)
    if (!product) return

    const nouvelleLigne: LigneApprovisionnementLocal = {
      id: Math.random().toString(36).substring(2, 15),
      produitId: parseInt(selectedProductId),
      quantite: qty,
      prixUnitaire: prix,
      montant: qty * prix,
      dateFabrication: selectedDateFabrication || undefined,
      datePeremption: selectedDatePeremption || undefined,
    }

    setLignesApprovisionnement((prevLignes) => [...prevLignes, nouvelleLigne])

    // Réinitialiser les champs
    setSelectedQuantity("")
    setSelectedPrixUnitaire("")
    setSelectedProduitId("")
    setSelectedDateFabrication("")
    setSelectedDatePeremption("")

    toast({
      title: "Produit ajouté",
      description: `${product.libelle} a été ajouté à l'approvisionnement`,
    })
  }

  // Supprimer une ligne d'approvisionnement
  const supprimerLigne = (ligneId: string) => {
    setLignesApprovisionnement((prevLignes) => prevLignes.filter((ligne) => ligne.id !== ligneId))

    toast({
      title: "Produit retiré",
      description: "Le produit a été retiré de l'approvisionnement",
    })
  }

  // Mettre à jour la quantité d'une ligne
  const updateQuantite = (ligneId: string, quantite: number) => {
    if (quantite <= 0) return

    setLignesApprovisionnement((prevLignes) =>
      prevLignes.map((ligne) => {
        if (ligne.id === ligneId) {
          const prixUnitaire = ligne.montant / ligne.quantite
          return { ...ligne, quantite, montant: quantite * prixUnitaire }
        }
        return ligne
      })
    )
  }

  // Mettre à jour le prix unitaire d'une ligne
  const updatePrixUnitaire = (ligneId: string, prixUnitaire: number) => {
    if (prixUnitaire < 0) return

    setLignesApprovisionnement((prevLignes) =>
      prevLignes.map((ligne) => {
        if (ligne.id === ligneId) {
          return { ...ligne, montant: ligne.quantite * prixUnitaire }
        }
        return ligne
      })
    )
  }

  // Ajouter un nouveau fournisseur
  const ajouterNouveauFournisseur = async () => {
    if (!newFournisseur.nom || !newFournisseur.prenom || !newFournisseur.tel || !newFournisseur.adresse) {
      toast({
        title: "Erreur",
        description: "Le nom, prénom, téléphone et adresse du fournisseur sont requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fournisseurService.create(newFournisseur)
      const createdFournisseur = response.data.data

      setFournisseurs((prevFournisseurs) => [...prevFournisseurs, createdFournisseur])
      setValue("fournisseurId", createdFournisseur.id)

      setIsNewFournisseurDialogOpen(false)
      setNewFournisseur({ prenom: "", nom: "", email: "", tel: "", adresse: "" })

      toast({
        title: "Fournisseur ajouté",
        description: `${createdFournisseur.prenom} ${createdFournisseur.nom} a été ajouté avec succès.`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'ajout du fournisseur",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  // Ajouter un nouveau produit
  const ajouterNouveauProduit = async () => {
    if (!newProduit.libelle || !newProduit.description) {
      toast({
        title: "Erreur",
        description: "Le libellé et la description du produit sont requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await produitService.create({
        ...newProduit,
        prixDeVenteUnitaire: newProduit.prixDeVenteUnitaire || "0",
        prixAchatUnitaire: Number.parseFloat(newProduit.prixAchatUnitaire) || 0,
      })
      const createdProduit = response.data.data

      // Ajouter le produit à la liste
      setProducts((prevProducts) => [...prevProducts, createdProduit])

      // Sélectionner automatiquement le produit créé
      setSelectedProduitId(createdProduit.id.toString())

      setIsNewProduitDialogOpen(false)
      setNewProduit({ libelle: "", description: "", prixDeVenteUnitaire: "", prixAchatUnitaire: "" })

      toast({
        title: "Produit ajouté",
        description: `${createdProduit.libelle} a été ajouté et sélectionné. Vous pouvez maintenant l'ajouter à l'approvisionnement.`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'ajout du produit",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  // Enregistrer l'approvisionnement
  const onSubmit = async (data: ApprovisionnementFormValues) => {
    if (!lignesApprovisionnement.length) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit à l'approvisionnement",
        variant: "destructive",
      })
      return
    }

    try {
      const approData: ApprovisionnementCreateData = {
        fournisseurId: data.fournisseurId,
        lignes: lignesApprovisionnement.map(({ id, ...ligne }) => ligne),
      }

      await approvisionnementService.create(approData)

      toast({
        title: "Approvisionnement enregistré",
        description: "L'approvisionnement a été enregistré avec succès et le stock a été mis à jour",
      })

      router.push("/magasinier/approvisionnements")
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'enregistrement",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const selectedFournisseur = fournisseurs.find((f) => f.id === watchedFournisseurId)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center gap-2 mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/magasinier/approvisionnements">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux approvisionnements
              </Link>
            </Button>
          </div>

          <h1 className="font-playfair text-3xl font-bold md:text-4xl mb-8">Nouvel Approvisionnement</h1>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                {/* Informations de l'approvisionnement */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de l'approvisionnement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fournisseur">Fournisseur</Label>
                      <div className="flex gap-2">
                        <Controller
                          name="fournisseurId"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={fournisseurs.filter(f => f && f.id).map((f) => ({
                                value: f.id.toString(),
                                label: `${f.prenom} ${f.nom}`,
                                description: `${f.tel}${f.email ? ' - ' + f.email : ''}`,
                              }))}
                              value={field.value ? field.value.toString() : undefined}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              placeholder="Sélectionner un fournisseur"
                              searchPlaceholder="Rechercher un fournisseur..."
                              emptyMessage="Aucun fournisseur trouvé"
                              className="flex-1"
                            />
                          )}
                        />
                        <Dialog open={isNewFournisseurDialogOpen} onOpenChange={setIsNewFournisseurDialogOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="shrink-0">
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Ajouter un fournisseur</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Ajouter un nouveau fournisseur</DialogTitle>
                              <DialogDescription>
                                Créez un nouveau fournisseur pour l'ajouter à votre approvisionnement.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor="prenom">Prénom*</Label>
                                <Input
                                  id="prenom"
                                  value={newFournisseur.prenom}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, prenom: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor="nom">Nom*</Label>
                                <Input
                                  id="nom"
                                  value={newFournisseur.nom}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, nom: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={newFournisseur.email}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, email: e.target.value })}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor="tel">Téléphone*</Label>
                                <Input
                                  id="tel"
                                  value={newFournisseur.tel}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, tel: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor="adresse">Adresse*</Label>
                                <Input
                                  id="adresse"
                                  value={newFournisseur.adresse}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, adresse: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsNewFournisseurDialogOpen(false)}>
                                Annuler
                              </Button>
                              <Button type="button" onClick={ajouterNouveauFournisseur}>
                                Ajouter
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {errors.fournisseurId && (
                        <p className="text-sm text-red-500 mt-1">{errors.fournisseurId.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ajouter des produits */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Ajouter des produits</CardTitle>
                      <Dialog open={isNewProduitDialogOpen} onOpenChange={setIsNewProduitDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau produit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Ajouter un nouveau produit</DialogTitle>
                            <DialogDescription>
                              Créez un nouveau produit pour l'ajouter à votre approvisionnement.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="libelle">Libellé*</Label>
                              <Input
                                id="libelle"
                                value={newProduit.libelle}
                                onChange={(e) => setNewProduit({ ...newProduit, libelle: e.target.value })}
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="description">Description*</Label>
                              <Input
                                id="description"
                                value={newProduit.description}
                                onChange={(e) => setNewProduit({ ...newProduit, description: e.target.value })}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor="prixVente">Prix de vente</Label>
                                <Input
                                  id="prixVente"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={newProduit.prixDeVenteUnitaire}
                                  onChange={(e) => setNewProduit({ ...newProduit, prixDeVenteUnitaire: e.target.value })}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor="prixAchat">Prix d'achat</Label>
                                <Input
                                  id="prixAchat"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={newProduit.prixAchatUnitaire}
                                  onChange={(e) => setNewProduit({ ...newProduit, prixAchatUnitaire: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsNewProduitDialogOpen(false)}>
                              Annuler
                            </Button>
                            <Button type="button" onClick={ajouterNouveauProduit}>
                              Ajouter
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {/* Produit — prend toute la largeur */}
                      <div>
                        <Label htmlFor="produit">Produit</Label>
                        <SearchableSelect
                          options={products.filter((p) => p?.id != null).map((p) => ({
                            value: p.id.toString(),
                            label: p.libelle,
                            description: `Stock magasin: ${p.stockMagasin?.quantite ?? 0} - ${p.prixDeVenteUnitaire} FCFA`,
                          }))}
                          value={selectedProduitId}
                          onValueChange={setSelectedProduitId}
                          placeholder="Sélectionner un produit"
                          searchPlaceholder="Rechercher un produit..."
                          emptyMessage="Aucun produit trouvé"
                          className="w-full mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qté"
                            value={selectedQuantity}
                            onChange={(e) => setSelectedQuantity(e.target.value)}
                            className="w-full mt-1"
                          />
                        </div>
                        <div>
                          <Label>Prix unitaire (FCFA)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Prix"
                            value={selectedPrixUnitaire}
                            onChange={(e) => setSelectedPrixUnitaire(e.target.value)}
                            className="w-full mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Date de fabrication (optionnel)</Label>
                          <Input
                            type="date"
                            value={selectedDateFabrication}
                            onChange={(e) => setSelectedDateFabrication(e.target.value)}
                            className="w-full mt-1"
                          />
                        </div>
                        <div>
                          <Label>Date de péremption (optionnel)</Label>
                          <Input
                            type="date"
                            value={selectedDatePeremption}
                            onChange={(e) => setSelectedDatePeremption(e.target.value)}
                            className="w-full mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (selectedProduitId) ajouterLigne(selectedProduitId)
                        }}
                        className="w-full sm:w-auto sm:self-end"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter le produit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Lignes d'approvisionnement */}
                <Card>
                  <CardHeader>
                    <CardTitle>Détails de l'approvisionnement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lignesApprovisionnement.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                        <h3 className="mt-2 text-lg font-medium">Aucun produit ajouté</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Recherchez et ajoutez des produits à votre approvisionnement
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead>Date fabrication</TableHead>
                              <TableHead>Date péremption</TableHead>
                              <TableHead className="text-center">Quantité</TableHead>
                              <TableHead className="text-right">Prix unitaire</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lignesApprovisionnement.map((ligne) => {
                              const product = products.find((p) => p.id === ligne.produitId)
                              const prixUnitaire = ligne.montant / ligne.quantite

                              return (
                                <TableRow key={ligne.id}>
                                  <TableCell className="font-medium">{product?.libelle || 'Produit introuvable'}</TableCell>
                                  <TableCell className="text-sm">{ligne.dateFabrication || <span className="text-muted-foreground">—</span>}</TableCell>
                                  <TableCell className="text-sm">{ligne.datePeremption || <span className="text-muted-foreground">—</span>}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-r-none"
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
                                        className="h-7 w-7 rounded-l-none"
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
                                      step="0.01"
                                      className="w-24 h-7 text-right ml-auto"
                                      value={prixUnitaire.toFixed(2)}
                                      onChange={(e) => updatePrixUnitaire(ligne.id, Number.parseFloat(e.target.value) || 0)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{ligne.montant.toFixed(2)} FCFA</TableCell>
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
              </div>

              {/* Récapitulatif */}
              <div>
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator />

                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{montantTotal.toFixed(2)} FCFA</span>
                    </div>

                    <div className="pt-4">
                      <div className="rounded-lg bg-muted p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <p className="font-medium">Fournisseur</p>
                            <p className="text-muted-foreground">
                              {selectedFournisseur
                                ? `${selectedFournisseur.prenom} ${selectedFournisseur.nom}`.trim()
                                : "Fournisseur non sélectionné"}
                            </p>
                          </div>
                          <div className="text-sm text-right">
                            <p className="font-medium">Nombre de produits</p>
                            <p className="text-muted-foreground">
                              {lignesApprovisionnement.reduce((sum, ligne) => sum + ligne.quantite, 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" size="lg">
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer l'approvisionnement
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/magasinier/approvisionnements">Annuler</Link>
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
