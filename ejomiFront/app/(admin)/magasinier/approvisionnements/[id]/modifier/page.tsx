"use client"

import { use, useState, useEffect } from "react"
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
import { approvisionnementService, produitService, fournisseurService } from "@/services"
import type { ApprovisionnementUpdateData, LigneApprovisionnementInput } from "@/types/approvisionnement"
import type { Produit } from "@/types/produit"
import type { Fournisseur } from "@/types/fournisseur"
import { approvisionnementSchema, type ApprovisionnementFormValues } from "@/lib/validations"

export default function ModifierApprovisionnementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()

  interface LigneApprovisionnementLocal extends LigneApprovisionnementInput {
    id: string
  }

  const [products, setProducts] = useState<Produit[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [lignesApprovisionnement, setLignesApprovisionnement] = useState<LigneApprovisionnementLocal[]>([])
  const [montantTotal, setMontantTotal] = useState(0)

  // État pour la sélection de produits
  const [selectedProduitId, setSelectedProduitId] = useState<string>("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedPrixUnitaire, setSelectedPrixUnitaire] = useState(0)
  const [selectedDateFabrication, setSelectedDateFabrication] = useState("")
  const [selectedDatePeremption, setSelectedDatePeremption] = useState("")

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ApprovisionnementFormValues>({
    resolver: zodResolver(approvisionnementSchema),
    defaultValues: {
      fournisseurId: 0,
    },
  })

  const watchedFournisseurId = watch("fournisseurId")

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [approRes, productsRes, fournisseursRes] = await Promise.all([
          approvisionnementService.getById(parseInt(resolvedParams.id)),
          produitService.getAll(),
          fournisseurService.getAll(),
        ])

        const approData = (approRes.data as any).data || approRes.data
        const productsData: any[] = (productsRes as any).data?.data || productsRes.data || []
        const fournisseursData: any[] = (fournisseursRes as any).data?.data || fournisseursRes.data || []

        setProducts(productsData.filter((p: any) => p && p.id))
        setFournisseurs(fournisseursData.filter((f: any) => f && f.id))

        // Peupler les champs du formulaire
        reset({ fournisseurId: approData.fournisseurId })

        if (approData.lignes) {
          setLignesApprovisionnement(
            approData.lignes.map((ligne: any) => ({
              id: ligne.id?.toString() || Math.random().toString(36).substring(2, 15),
              produitId: Number(ligne.produitId),
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire ?? (ligne.quantite > 0 ? ligne.montant / ligne.quantite : 0),
              montant: ligne.montant,
              dateFabrication: ligne.dateFabrication || undefined,
              datePeremption: ligne.datePeremption || undefined,
            }))
          )
        }
      } catch (error) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger l'approvisionnement",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [resolvedParams.id, toast, reset])

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

    if (selectedQuantity <= 0 || selectedPrixUnitaire <= 0) {
      toast({
        title: "Erreur",
        description: "La quantité et le prix unitaire doivent être supérieurs à 0",
        variant: "destructive",
      })
      return
    }

    const nouvelleLigne: LigneApprovisionnementLocal = {
      id: Math.random().toString(36).substring(2, 15),
      produitId: parseInt(selectedProductId),
      quantite: selectedQuantity,
      prixUnitaire: selectedPrixUnitaire,
      montant: selectedQuantity * selectedPrixUnitaire,
      dateFabrication: selectedDateFabrication || undefined,
      datePeremption: selectedDatePeremption || undefined,
    }

    setLignesApprovisionnement((prevLignes) => [...prevLignes, nouvelleLigne])

    setSelectedQuantity(1)
    setSelectedPrixUnitaire(0)
    setSelectedProduitId("")
    setSelectedDateFabrication("")
    setSelectedDatePeremption("")

    toast({
      title: "Produit ajouté",
      description: "Le produit a été ajouté à l'approvisionnement",
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
          return { ...ligne, quantite, montant: quantite * ligne.prixUnitaire }
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
          return { ...ligne, prixUnitaire, montant: ligne.quantite * prixUnitaire }
        }
        return ligne
      })
    )
  }

  // Enregistrer les modifications
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
      const updateData: ApprovisionnementUpdateData = {
        fournisseurId: data.fournisseurId,
        lignes: lignesApprovisionnement.map(({ id, ...ligne }) => ligne),
      }

      console.log('Données envoyées:', updateData)

      await approvisionnementService.update(parseInt(resolvedParams.id), updateData)

      toast({
        title: "Approvisionnement modifié",
        description: "L'approvisionnement a été modifié avec succès",
      })

      router.push("/magasinier/approvisionnements")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur lors de la modification",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const selectedFournisseur = fournisseurs.find((f) => f.id === watchedFournisseurId)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

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

          <h1 className="font-playfair text-3xl font-bold md:text-4xl mb-8">
            Modifier l'approvisionnement #{resolvedParams.id}
          </h1>

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
                            className="w-full"
                          />
                        )}
                      />
                      {errors.fournisseurId && (
                        <p className="text-sm text-red-500 mt-1">{errors.fournisseurId.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ajouter des produits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter des produits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="produit">Produit</Label>
                        <SearchableSelect
                          options={products.map((p) => ({
                            value: p.id.toString(),
                            label: p.libelle,
                            description: `Stock: ${p.stockBoutique?.quantite ?? 0} - ${p.prixDeVenteUnitaire} FCFA`,
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
                            onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
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
                            onChange={(e) => setSelectedPrixUnitaire(Number.parseFloat(e.target.value) || 0)}
                            className="w-full mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Date de fabrication <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                          <Input
                            type="date"
                            value={selectedDateFabrication}
                            onChange={(e) => setSelectedDateFabrication(e.target.value)}
                            className="w-full mt-1"
                          />
                        </div>
                        <div>
                          <Label>Date de péremption <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
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
                        className="w-full sm:w-auto"
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
                              const prixUnitaire = ligne.prixUnitaire ?? (ligne.quantite > 0 ? ligne.montant / ligne.quantite : 0)

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
                      Enregistrer les modifications
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
