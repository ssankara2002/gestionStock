"use client"

import { useState, useEffect, use } from "react"
import { useRouter, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Search, Save } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { produitService, userService } from "@/services"
import type { User } from "@/types/user"
import type { CommandeUpdateData, LigneCommandeInput } from "@/types/commande"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Produit } from "@/types/produit"
import { commandesService } from "@/services/commande-service"
import { commandeSchema, type CommandeFormValues } from "@/lib/validations"

// Schema for main form fields only (lignes managed via useState)
const mainCommandeSchema = commandeSchema.pick({
  dateCommande: true,
  clientId: true,
  reductionGlobale: true,
})
type MainCommandeFormValues = z.infer<typeof mainCommandeSchema>

interface LigneCommandeLocal extends LigneCommandeInput {
  id: string // ID temporaire pour gérer l'affichage
}

export default function ModifierCommandePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Produit[]>([])
  const [clients, setClients] = useState<User[]>([])

  const [lignesCommande, setLignesCommande] = useState<LigneCommandeLocal[]>([])
  const [montantTotal, setMontantTotal] = useState(0)

  const [statut, setStatut] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<MainCommandeFormValues>({
    resolver: zodResolver(mainCommandeSchema),
    defaultValues: {
      dateCommande: new Date().toISOString().split("T")[0],
      clientId: undefined,
      reductionGlobale: 0,
    },
  })

  // Watch reductionGlobale for total calculation
  const reductionGlobale = watch("reductionGlobale") ?? 0
  const clientId = watch("clientId")

  // Charger les données initiales (commande, produits, clients)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const [productsRes, usersRes, commandeRes] = await Promise.all([
          produitService.getAll(),
          userService.getAll(),
          commandesService.getById(unwrappedParams.id),
        ])

        // @ts-ignore
        setProducts(productsRes.data.data || productsRes.data || [])
        // @ts-ignore
        const allClients = usersRes.data.data.filter((u: User) => u.role?.name === 'CLIENT' || !u.role)
        setClients(allClients)

        // @ts-ignore
        const commandeData = commandeRes.data.data || commandeRes.data
        if (!commandeData) {
          notFound()
          return
        }

        // Pré-remplir le formulaire avec les données de la commande
        setStatut(commandeData.statut)
        setLignesCommande(
          commandeData.lignes.map((ligne: any) => ({
            id: Math.random().toString(36).substring(2, 15), // ID local
            produitId: ligne.produitId,
            quantite: ligne.quantiteCommande,
            prixUnitaire: Number(ligne.produit.prixDeVenteUnitaire),
            reduction: 0, // La réduction par ligne n'est pas gérée dans le modèle actuel, on la met à 0
          }))
        )

        // Reset form with loaded data
        reset({
          dateCommande: new Date(commandeData.dateCommande).toISOString().split("T")[0],
          clientId: commandeData.clientId,
          reductionGlobale: commandeData.reduction || 0,
        })
      } catch (error) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données pour la modification.",
          variant: "destructive",
        })
        router.push("/vendeur/commandes")
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [unwrappedParams.id, toast, router, reset])

  // Filtrer les produits
  const filteredProducts = products.filter(
    (product) =>
      product.libelle.toLowerCase().includes(searchTerm.toLowerCase())
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
  const ajouterLigne = (selectedProductId: string) => {
    const product = products.find((p) => p.id.toString() === selectedProductId)
    if (!product) return

    const ligneExistante = lignesCommande.find((ligne) => ligne.produitId.toString() === selectedProductId)

    if (ligneExistante) {
      setLignesCommande((prevLignes) =>
        prevLignes.map((ligne) =>
          ligne.produitId.toString() === selectedProductId
            ? { ...ligne, quantite: ligne.quantite + selectedQuantity }
            : ligne
        )
      )
    } else {
      const nouvelleLigne: LigneCommandeLocal = {
        id: Math.random().toString(36).substring(2, 15),
        produitId: parseInt(selectedProductId),
        quantite: selectedQuantity,
        prixUnitaire: Number(product.prixDeVenteUnitaire),
        reduction: 0,
      }
      setLignesCommande((prevLignes) => [...prevLignes, nouvelleLigne])
    }

    setSelectedQuantity(1)
    setSearchTerm("")
    toast({ title: "Produit ajouté", description: `${product.libelle} a été ajouté.` })
  }

  // Supprimer une ligne de commande
  const supprimerLigne = (ligneId: string) => {
    setLignesCommande((prevLignes) => prevLignes.filter((ligne) => ligne.id !== ligneId))
    toast({ title: "Produit retiré" })
  }

  // Mettre à jour la quantité
  const updateQuantite = (ligneId: string, quantite: number) => {
    if (quantite <= 0) return
    setLignesCommande((prevLignes) =>
      prevLignes.map((ligne) => (ligne.id === ligneId ? { ...ligne, quantite } : ligne))
    )
  }

  // Mettre à jour la réduction
  const updateReduction = (ligneId: string, reduction: number) => {
    if (reduction < 0) return
    setLignesCommande((prevLignes) =>
      prevLignes.map((ligne) => (ligne.id === ligneId ? { ...ligne, reduction } : ligne))
    )
  }

  // Enregistrer les modifications
  const onSubmit = async (data: MainCommandeFormValues) => {
    if (lignesCommande.length < 1) {
      toast({
        title: "Erreur",
        description: "Au moins un produit est requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const commandeData: CommandeUpdateData = {
        dateCommande: new Date(data.dateCommande),
        clientId: data.clientId,
        reduction: data.reductionGlobale,
        lignes: lignesCommande.map(({ id, ...ligne }) => ligne),
      }

      await commandesService.update(unwrappedParams.id, commandeData)

      toast({
        title: "Commande modifiée",
        description: "La commande a été mise à jour avec succès.",
      })

      router.push(`/vendeur/commandes/${unwrappedParams.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur lors de la modification",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="container py-8 text-center">Chargement du formulaire de modification...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center gap-2 mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/vendeur/commandes/${unwrappedParams.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la vente
              </Link>
            </Button>
          </div>

          <h1 className="font-playfair text-3xl font-bold md:text-4xl mb-8">
            Modifier la Vente #{unwrappedParams.id}
          </h1>

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
                                        return c ? `${c.prenom} ${c.nom}` : ""
                                      })(),
                                    }
                                  : null
                              }
                              onChange={(opt: any) =>
                                field.onChange(opt ? parseInt(opt.value) : undefined)
                              }
                              options={clients.map((c) => ({
                                value: c.id.toString(),
                                label: `${c.prenom} ${c.nom}`,
                              }))}
                            />
                          )}
                        />
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
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher un produit..."
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map((product) => (
                                <div
                                  key={product.id}
                                  className="p-2 hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    setSearchTerm(product.libelle)
                                    ajouterLigne(product.id.toString())
                                  }}
                                >
                                  <p className="font-medium">{product.libelle}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {product.prixDeVenteUnitaire} FCFA - Stock: {product.stockBoutique?.quantite ?? 0}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Aucun produit trouvé
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
                        <h3 className="mt-2 text-lg font-medium">Aucun produit</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ajoutez des produits à la vente.
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
                              if (!product) return null

                              const prixTotal = ligne.prixUnitaire * ligne.quantite
                              const total = Math.max(0, prixTotal - ligne.reduction)

                              return (
                                <TableRow key={ligne.id}>
                                  <TableCell className="font-medium">{product?.libelle || 'Produit introuvable'}</TableCell>
                                  <TableCell className="text-right">{ligne.prixUnitaire.toFixed(2)} FCFA</TableCell>
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
                                      className="w-20 h-7 text-right ml-auto"
                                      value={ligne.reduction}
                                      onChange={(e) => updateReduction(ligne.id, Number.parseFloat(e.target.value) || 0)}
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
                            .reduce((sum, ligne) => sum + ligne.prixUnitaire * ligne.quantite, 0)
                            .toFixed(2)}{" "}
                          FCFA
                        </span>
                      </div>

                      {lignesCommande.some((ligne) => ligne.reduction > 0) && (
                        <div className="flex justify-between text-primary">
                          <span>Réductions produits</span>
                          <span>
                            -
                            {lignesCommande
                              .reduce((sum, ligne) => sum + ligne.reduction, 0)
                              .toFixed(2)}{" "}
                            FCFA
                          </span>
                        </div>
                      )}

                      {Number(reductionGlobale) > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Réduction globale</span>
                          <span>
                            -{Number(reductionGlobale).toFixed(2)} FCFA
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{montantTotal.toFixed(2)} FCFA</span>
                    </div>

                    <div className="pt-4">
                      <div className="rounded-lg bg-muted p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <p className="font-medium">Client</p>
                            <p className="text-muted-foreground">
                              {clientId
                                ? (() => {
                                    const client = clients.find((c) => c.id === clientId)
                                    return client ? `${client.prenom} ${client.nom}`.trim() : "Client non sélectionné"
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
                      Enregistrer les modifications
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/vendeur/commandes/${unwrappedParams.id}`}>Annuler</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
