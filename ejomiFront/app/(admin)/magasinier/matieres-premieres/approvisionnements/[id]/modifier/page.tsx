"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/context/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { approvisionnementMatierePremiereService } from "@/services/approvisionnement-matiere-premiere-service"
import { matierePremiereService, fournisseurService } from "@/services"
import type { MatierePremiere } from "@/types/matierePremiere"
import type { Fournisseur } from "@/types/fournisseur"

interface LigneApprovisionnementMatierePremiereInput {
  matierePremiereId: number
  quantite: number
  montant: number
}

export default function ModifierApprovisionnementMatierePremierePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [matieres, setMatieres] = useState<MatierePremiere[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)

  interface LigneApprovisionnementLocal extends LigneApprovisionnementMatierePremiereInput {
    id: string
  }

  const [lignesApprovisionnement, setLignesApprovisionnement] = useState<LigneApprovisionnementLocal[]>([])
  const [fournisseurId, setFournisseurId] = useState<number | undefined>(undefined)
  const [employeId, setEmployeId] = useState<number | undefined>(undefined)
  const [montantTotal, setMontantTotal] = useState(0)

  const [selectedMatierePremiereId, setSelectedMatierePremiereId] = useState<string>("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedPrixUnitaire, setSelectedPrixUnitaire] = useState(0)

  useEffect(() => {
    if (user?.employe?.id) {
      setEmployeId(user.employe.id)
    }
  }, [user])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [approRes, matieresRes, fournisseursRes] = await Promise.all([
          approvisionnementMatierePremiereService.getById(parseInt(resolvedParams.id)),
          matierePremiereService.getAllMatieresPremieres(),
          fournisseurService.getAll(),
        ])

        const approData = (approRes.data as any).data || approRes.data
        setMatieres(Array.isArray(matieresRes.data) ? matieresRes.data : (matieresRes.data as any).data || [])
        setFournisseurs(Array.isArray(fournisseursRes.data) ? fournisseursRes.data : (fournisseursRes.data as any).data || [])

        setFournisseurId(approData.fournisseurId)
        if (approData.lignes) {
          setLignesApprovisionnement(
            approData.lignes.map((ligne: any) => ({
              id: ligne.id?.toString() || Math.random().toString(36).substring(2, 15),
              matierePremiereId: Number(ligne.matierePremiereId),
              quantite: ligne.quantite,
              montant: ligne.montant,
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
  }, [resolvedParams.id, toast])

  useEffect(() => {
    const total = lignesApprovisionnement.reduce((sum, ligne) => sum + ligne.montant, 0)
    setMontantTotal(Number.parseFloat(total.toFixed(2)))
  }, [lignesApprovisionnement])

  const ajouterLigne = (selectedMatiereId: string) => {
    if (!selectedMatiereId) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une matière première", variant: "destructive" })
      return
    }

    if (selectedQuantity <= 0 || selectedPrixUnitaire <= 0) {
      toast({ title: "Erreur", description: "La quantité et le prix unitaire doivent être supérieurs à 0", variant: "destructive" })
      return
    }

    const nouvelleLigne: LigneApprovisionnementLocal = {
      id: Math.random().toString(36).substring(2, 15),
      matierePremiereId: parseInt(selectedMatiereId),
      quantite: selectedQuantity,
      montant: selectedQuantity * selectedPrixUnitaire,
    }

    setLignesApprovisionnement((prevLignes) => [...prevLignes, nouvelleLigne])

    setSelectedQuantity(1)
    setSelectedPrixUnitaire(0)
    setSelectedMatierePremiereId("")

    toast({ title: "Matière première ajoutée" })
  }

  const supprimerLigne = (ligneId: string) => {
    setLignesApprovisionnement((prevLignes) => prevLignes.filter((ligne) => ligne.id !== ligneId))
    toast({ title: "Matière première retirée" })
  }

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

  const enregistrerModifications = async () => {
    if (!fournisseurId || !employeId || !lignesApprovisionnement.length) {
      toast({
        title: "Erreur",
        description: "Un fournisseur, un employé et au moins une matière première sont requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const updateData = {
        fournisseurId,
        employeId,
        lignes: lignesApprovisionnement.map(({ id, ...ligne }) => ligne),
      }

      await approvisionnementMatierePremiereService.update(parseInt(resolvedParams.id), updateData)

      toast({ title: "Approvisionnement modifié", description: "L'approvisionnement a été modifié avec succès" })

      router.push("/magasinier/matieres-premieres/approvisionnements")
      router.refresh()
    } catch (error: any) {
      toast({ title: "Erreur lors de la modification", description: error.response?.data?.message || "Une erreur est survenue", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center gap-2 mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/magasinier/matieres-premieres/approvisionnements">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
          </div>

          <h1 className="font-playfair text-3xl font-bold md:text-4xl mb-8">
            Modifier l'approvisionnement MP #{resolvedParams.id}
          </h1>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fournisseur">Fournisseur</Label>
                    <SearchableSelect 
                      options={fournisseurs.map((f) => ({ value: f.id.toString(), label: `${f.prenom} ${f.nom}`}))}
                      value={fournisseurId?.toString()}
                      onValueChange={(value) => setFournisseurId(parseInt(value))}
                      placeholder="Sélectionner un fournisseur"
                      searchPlaceholder="Rechercher un fournisseur..."
                      emptyMessage="Aucun fournisseur trouvé"
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Ajouter des matières premières</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1 w-full">
                      <Label htmlFor="matiere">Matière Première</Label>
                      <SearchableSelect
                        options={matieres.map((m) => ({ value: m.id.toString(), label: m.nom }))}
                        value={selectedMatierePremiereId}
                        onValueChange={setSelectedMatierePremiereId}
                        placeholder="Sélectionner une matière première"
                        searchPlaceholder="Rechercher..."
                        emptyMessage="Aucune matière trouvée"
                        className="w-full mt-1"
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <Label>Quantité</Label>
                      <Input type="number" min="1" value={selectedQuantity} onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)} className="w-full sm:w-24 mt-1" />
                    </div>
                    <div className="w-full sm:w-auto">
                      <Label>Prix unitaire (FCFA)</Label>
                      <Input type="number" min="0" step="0.01" value={selectedPrixUnitaire} onChange={(e) => setSelectedPrixUnitaire(Number.parseFloat(e.target.value) || 0)} className="w-full sm:w-32 mt-1" />
                    </div>
                    <Button onClick={() => { if (selectedMatierePremiereId) ajouterLigne(selectedMatierePremiereId) }} className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
                <CardContent>
                  {lignesApprovisionnement.length === 0 ? (
                    <div className="text-center p-8">Aucune matière première ajoutée</div>
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
                            const matiere = matieres.find((m) => m.id === ligne.matierePremiereId)
                            const prixUnitaire = ligne.quantite > 0 ? ligne.montant / ligne.quantite : 0

                            return (
                              <TableRow key={ligne.id}>
                                <TableCell className="font-medium">{matiere?.nom || 'Introuvable'}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-r-none" onClick={() => updateQuantite(ligne.id, ligne.quantite - 1)}>-</Button>
                                    <div className="flex h-7 w-10 items-center justify-center border-y">{ligne.quantite}</div>
                                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-l-none" onClick={() => updateQuantite(ligne.id, ligne.quantite + 1)}>+</Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input type="number" min="0" step="0.01" className="w-24 h-7 text-right ml-auto" value={prixUnitaire.toFixed(2)} onChange={(e) => updatePrixUnitaire(ligne.id, Number.parseFloat(e.target.value) || 0)} />
                                </TableCell>
                                <TableCell className="text-right font-medium">{ligne.montant.toFixed(2)} FCFA</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => supprimerLigne(ligne.id)}>
                                    <Trash2 className="h-4 w-4" />
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

            <div>
              <Card className="sticky top-8">
                <CardHeader><CardTitle>Récapitulatif</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{montantTotal.toFixed(2)} FCFA</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button onClick={enregistrerModifications} className="w-full" size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/magasinier/matieres-premieres/approvisionnements">Annuler</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}