"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getAllMatieresPremieres } from "@/services/matiere-premiere-service"
import { fournisseurService } from "@/services"
import type { MatierePremiere } from "@/types/matierePremiere"
import type { Fournisseur } from "@/types/fournisseur"
import { approvisionnementMatierePremiereService } from "@/services/approvisionnement-matiere-premiere-service"

interface LigneInput {
  id: string // Pour la gestion de la clé dans React
  matierePremiereId: number
  quantite: number
  montant: number
}

export default function ApprovisionnerMatierePremierePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [matieres, setMatieres] = useState<MatierePremiere[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [fournisseurId, setFournisseurId] = useState<string>("")
  const [lignes, setLignes] = useState<LigneInput[]>([])

  const [nouvelleLigne, setNouvelleLigne] = useState({
    matierePremiereId: "",
    quantite: 1,
    montant: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matieresRes, fournisseursRes] = await Promise.all([
          getAllMatieresPremieres(),
          fournisseurService.getAll(),
        ])
        setMatieres(matieresRes.data) // Assurez-vous que le service retourne un objet avec une propriété data
        setFournisseurs(fournisseursRes.data.data)
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger les données initiales.", variant: "destructive" })
      }
    }
    loadData()
  }, [toast])

  const handleAddLigne = () => {
    if (!nouvelleLigne.matierePremiereId || nouvelleLigne.quantite <= 0 || nouvelleLigne.montant <= 0) {
      toast({ title: "Données invalides", description: "Veuillez remplir tous les champs de la ligne.", variant: "destructive" })
      return
    }

    const nouvelleLigneData: LigneInput = {
      id: crypto.randomUUID(),
      matierePremiereId: parseInt(nouvelleLigne.matierePremiereId),
      quantite: nouvelleLigne.quantite,
      montant: nouvelleLigne.montant,
    }

    setLignes([...lignes, nouvelleLigneData])
    setNouvelleLigne({ matierePremiereId: "", quantite: 1, montant: 0 }) // Reset form
  }

  const handleRemoveLigne = (id: string) => {
    setLignes(lignes.filter(l => l.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fournisseurId || lignes.length === 0) {
      toast({ title: "Formulaire incomplet", description: "Veuillez sélectionner un fournisseur et ajouter au moins une matière première.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const dataToSend = {
        fournisseurId: parseInt(fournisseurId),
        lignes: lignes.map(({ id, ...ligne }) => ligne), // Exclure l'ID temporaire
      }
      await approvisionnementMatierePremiereService.create(dataToSend)
      toast({ title: "Succès", description: "Approvisionnement enregistré." })
      router.push("/magasinier/approvisionnements-mp") // Rediriger vers la liste des approvisionnements MP
    } catch (error: any) {
      toast({ title: "Erreur", description: error.response?.data?.message || "Une erreur est survenue.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMatiereNom = (id: number) => matieres.find(m => m.id === id)?.nom || "Inconnue"
  const total = lignes.reduce((sum, l) => sum + l.montant, 0)

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/magasinier/approvisionnements-mp">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Nouvel Approvisionnement de Matières Premières</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="fournisseurId">Fournisseur *</Label>
              <AppSelect
                placeholder="Sélectionner un fournisseur"
                value={fournisseurId ? { value: fournisseurId, label: fournisseurs.find(f => f.id.toString() === fournisseurId) ? `${fournisseurs.find(f => f.id.toString() === fournisseurId)!.prenom} ${fournisseurs.find(f => f.id.toString() === fournisseurId)!.nom}` : fournisseurId } : null}
                onChange={(opt: any) => setFournisseurId(opt?.value ?? "")}
                options={fournisseurs.map(f => ({ value: f.id.toString(), label: `${f.prenom} ${f.nom}` }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matières premières à ajouter</CardTitle>
            <CardDescription>Ajoutez les articles reçus du fournisseur.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Matière première</Label>
                <AppSelect
                  placeholder="Sélectionner..."
                  value={nouvelleLigne.matierePremiereId ? { value: nouvelleLigne.matierePremiereId, label: matieres.find(m => m.id.toString() === nouvelleLigne.matierePremiereId)?.nom ?? nouvelleLigne.matierePremiereId } : null}
                  onChange={(opt: any) => setNouvelleLigne(p => ({ ...p, matierePremiereId: opt?.value ?? "" }))}
                  options={matieres.map(m => ({ value: m.id.toString(), label: m.nom }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input type="number" min="1" value={nouvelleLigne.quantite} onChange={e => setNouvelleLigne(p => ({ ...p, quantite: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-2">
                <Label>Montant total (FCFA)</Label>
                <Input type="number" min="0" value={nouvelleLigne.montant} onChange={e => setNouvelleLigne(p => ({ ...p, montant: parseFloat(e.target.value) || 0 }))} />
              </div>
              <Button type="button" onClick={handleAddLigne}><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
            </div>

            {lignes.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière première</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map(ligne => (
                      <TableRow key={ligne.id}>
                        <TableCell>{getMatiereNom(ligne.matierePremiereId)}</TableCell>
                        <TableCell className="text-right">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">{ligne.montant.toFixed(2)} FCFA</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveLigne(ligne.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end items-center gap-4">
          <div className="text-lg font-semibold">
            Total: <span className="text-primary">{total.toFixed(2)} FCFA</span>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer l'approvisionnement"}
          </Button>
        </div>
      </form>
    </div>
  )
}