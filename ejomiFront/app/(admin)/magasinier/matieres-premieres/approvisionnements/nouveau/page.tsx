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
import { matierePremiereService, fournisseurService } from "@/services"
import { approvisionnementMatierePremiereService } from "@/services/approvisionnement-matiere-premiere-service"
import type { MatierePremiere } from "@/types/matierePremiere"
import type { Fournisseur } from "@/types/fournisseur"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { approvisionnementMatiereSchema, type ApprovisionnementMatiereFormValues } from "@/lib/validations"

interface LigneApprovisionnementMatierePremiereInput {
  matierePremiereId: number
  quantite: number
  montant: number
}

export default function NouvelApprovisionnementMatierePremierePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  interface LigneApprovisionnementLocal extends LigneApprovisionnementMatierePremiereInput {
    id: string
  }

  const [matieres, setMatieres] = useState<MatierePremiere[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [lignesApprovisionnement, setLignesApprovisionnement] = useState<LigneApprovisionnementLocal[]>([])
  const [montantTotal, setMontantTotal] = useState(0)

  // État pour la sélection de matières premières
  const [selectedMatierePremiereId, setSelectedMatierePremiereId] = useState<string>("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedPrixUnitaire, setSelectedPrixUnitaire] = useState(0)

  // États pour les dialogues
  const [isNewFournisseurDialogOpen, setIsNewFournisseurDialogOpen] = useState(false)
  const [isNewMatierePremiereDialogOpen, setIsNewMatierePremiereDialogOpen] = useState(false)

  // État pour le nouveau fournisseur
  const [newFournisseur, setNewFournisseur] = useState({
    prenom: "",
    nom: "",
    email: "",
    tel: "",
    adresse: "",
  })

  // État pour la nouvelle matière première
  const [newMatierePremiere, setNewMatierePremiere] = useState({
    nom: "",
    description: "",
    prixAchat: 0,
    quantiteStock: 0,
  })

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApprovisionnementMatiereFormValues>({
    resolver: zodResolver(approvisionnementMatiereSchema),
    defaultValues: {
      fournisseurId: 0,
      employeId: 0,
    },
  })

  const watchedFournisseurId = watch("fournisseurId")

  // Mettre à jour l'employeId lorsque l'utilisateur est chargé
  useEffect(() => {
    if (user?.employe?.id) {
      setValue("employeId", user.employe.id)
    }
  }, [user, setValue])

  // Charger les matières et les fournisseurs
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [matieresRes, fournisseursRes] = await Promise.all([
          matierePremiereService.getAllMatieresPremieres(),
          fournisseurService.getAll(),
        ])
        const matieresData: any[] = (matieresRes as any).data?.data || matieresRes.data || []
        const fournisseursData: any[] = (fournisseursRes as any).data?.data || fournisseursRes.data || []

        setMatieres(matieresData.filter((m: any) => m && m.id))
        setFournisseurs(fournisseursData.filter((f: any) => f && f.id))
      } catch (error) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les matières premières ou les fournisseurs.",
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
  const ajouterLigne = (selectedMatiereId: string) => {
    if (!selectedMatiereId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une matière première",
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

    const matiere = matieres.find((p) => p.id.toString() === selectedMatiereId)
    if (!matiere) return

    const nouvelleLigne: LigneApprovisionnementLocal = {
      id: Math.random().toString(36).substring(2, 15),
      matierePremiereId: parseInt(selectedMatiereId),
      quantite: selectedQuantity,
      montant: selectedQuantity * selectedPrixUnitaire,
    }

    setLignesApprovisionnement((prevLignes) => [...prevLignes, nouvelleLigne])

    // Réinitialiser les champs
    setSelectedQuantity(1)
    setSelectedPrixUnitaire(0)
    setSelectedMatierePremiereId("")

    toast({
      title: "Matière première ajoutée",
      description: `${matiere.nom} a été ajoutée à l'approvisionnement`,
    })
  }

  // Supprimer une ligne
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

  // Ajouter une nouvelle matière première
  const ajouterNouvelleMatierePremiere = async () => {
    if (!newMatierePremiere.nom) {
      toast({
        title: "Erreur",
        description: "Le nom de la matière première est requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await matierePremiereService.createMatierePremiere(newMatierePremiere)
      const createdMatiere = response.data

      // Ajouter la matière première à la liste
      setMatieres((prevMatieres) => [...prevMatieres, createdMatiere])

      // Sélectionner automatiquement la matière créée
      setSelectedMatierePremiereId(createdMatiere.id.toString())

      setIsNewMatierePremiereDialogOpen(false)
      setNewMatierePremiere({ nom: "", description: "", prixAchat: 0, quantiteStock: 0 })

      toast({
        title: "Matière première ajoutée",
        description: `${createdMatiere.nom} a été ajoutée et sélectionnée.`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'ajout de la matière première",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  // Enregistrer l'approvisionnement
  const onSubmit = async (data: ApprovisionnementMatiereFormValues) => {
    if (!lignesApprovisionnement.length) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins une matière première à l'approvisionnement",
        variant: "destructive",
      })
      return
    }

    try {
      const approData = {
        fournisseurId: data.fournisseurId,
        employeId: data.employeId,
        lignes: lignesApprovisionnement.map(({ id, ...ligne }) => ligne),
      }

      await approvisionnementMatierePremiereService.create(approData)

      toast({
        title: "Approvisionnement enregistré",
        description: "L'approvisionnement a été enregistré avec succès et le stock a été mis à jour",
      })

      router.push("/magasinier/matieres-premieres/approvisionnements")
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
              <Link href="/magasinier/matieres-premieres/approvisionnements">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux approvisionnements MP
              </Link>
            </Button>
          </div>

          <h1 className="font-playfair text-3xl font-bold md:text-4xl mb-8">Nouvel Approvisionnement de Matières Premières</h1>

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
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="prenom" className="text-right">
                                  Prénom*
                                </Label>
                                <Input
                                  id="prenom"
                                  value={newFournisseur.prenom}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, prenom: e.target.value })}
                                  className="col-span-3"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nom" className="text-right">
                                  Nom*
                                </Label>
                                <Input
                                  id="nom"
                                  value={newFournisseur.nom}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, nom: e.target.value })}
                                  className="col-span-3"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                  Email*
                                </Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={newFournisseur.email}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, email: e.target.value })}
                                  className="col-span-3"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tel" className="text-right">
                                  Téléphone*
                                </Label>
                                <Input
                                  id="tel"
                                  value={newFournisseur.tel}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, tel: e.target.value })}
                                  className="col-span-3"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="adresse" className="text-right">
                                  Adresse*
                                </Label>
                                <Input
                                  id="adresse"
                                  value={newFournisseur.adresse}
                                  onChange={(e) => setNewFournisseur({ ...newFournisseur, adresse: e.target.value })}
                                  className="col-span-3"
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

                {/* Ajouter des matières premières */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Ajouter des matières premières</CardTitle>
                      <Dialog open={isNewMatierePremiereDialogOpen} onOpenChange={setIsNewMatierePremiereDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Ajouter une nouvelle matière première</DialogTitle>
                            <DialogDescription>
                              Créez une nouvelle matière première pour l'ajouter à l'approvisionnement.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="nom" className="text-right">
                                Nom*
                              </Label>
                              <Input
                                id="nom"
                                value={newMatierePremiere.nom}
                                onChange={(e) => setNewMatierePremiere({ ...newMatierePremiere, nom: e.target.value })}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="description" className="text-right">
                                Description
                              </Label>
                              <Input
                                id="description"
                                value={newMatierePremiere.description}
                                onChange={(e) => setNewMatierePremiere({ ...newMatierePremiere, description: e.target.value })}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="prixAchat" className="text-right">
                                Prix d'achat*
                              </Label>
                              <Input
                                id="prixAchat"
                                type="number"
                                min="0"
                                step="0.01"
                                value={newMatierePremiere.prixAchat}
                                onChange={(e) => setNewMatierePremiere({ ...newMatierePremiere, prixAchat: Number.parseFloat(e.target.value) || 0 })}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="quantiteStock" className="text-right">
                                Stock initial
                              </Label>
                              <Input
                                id="quantiteStock"
                                type="number"
                                min="0"
                                value={newMatierePremiere.quantiteStock}
                                onChange={(e) => setNewMatierePremiere({ ...newMatierePremiere, quantiteStock: Number.parseInt(e.target.value) || 0 })}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsNewMatierePremiereDialogOpen(false)}>
                              Annuler
                            </Button>
                            <Button type="button" onClick={ajouterNouvelleMatierePremiere}>
                              Ajouter
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                      <div className="flex-1 w-full">
                        <Label htmlFor="matiere">Matière Première</Label>
                        <SearchableSelect
                          options={matieres.map((m) => ({
                            value: m.id.toString(),
                            label: m.nom,
                            description: `Stock: ${m.quantiteStock} - ${m.prixAchat} FCFA`,
                          }))}
                          value={selectedMatierePremiereId}
                          onValueChange={setSelectedMatierePremiereId}
                          placeholder="Sélectionner une matière première"
                          searchPlaceholder="Rechercher une matière..."
                          emptyMessage="Aucune matière première trouvée"
                          className="w-full mt-1"
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <Label>Quantité</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qté"
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
                          className="w-full sm:w-24 mt-1"
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <Label>Prix unitaire (FCFA)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Prix"
                          value={selectedPrixUnitaire}
                          onChange={(e) => setSelectedPrixUnitaire(Number.parseFloat(e.target.value) || 0)}
                          className="w-full sm:w-32 mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (selectedMatierePremiereId) ajouterLigne(selectedMatierePremiereId)
                        }}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
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
                        <h3 className="mt-2 text-lg font-medium">Aucune matière première ajoutée</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Recherchez et ajoutez des matières premières à votre approvisionnement
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Matière Première</TableHead>
                              <TableHead className="text-center">Quantité</TableHead>
                              <TableHead className="text-right">Prix unitaire</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lignesApprovisionnement.map((ligne) => {
                              const matiere = matieres.find((m) => m.id === String(ligne.matierePremiereId))
                              const prixUnitaire = ligne.montant / ligne.quantite

                              return (
                                <TableRow key={ligne.id}>
                                  <TableCell className="font-medium">{matiere?.nom || 'Matière introuvable'}</TableCell>
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
                            <p className="font-medium">Nombre d'articles</p>
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
                      <Link href="/magasinier/matieres-premieres/approvisionnements">Annuler</Link>
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
