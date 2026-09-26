"use client"

import { useState, useEffect } from "react"
import { Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/services/api-client"

interface IngredientInventaire {
  id: number
  nom: string
  categorie?: string
  quantiteStock: number
  unite?: string
  quantitePhysique?: number
}

export default function InventaireIngredientsPage() {
  const { toast } = useToast()
  const [ingredients, setIngredients] = useState<IngredientInventaire[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.get("/inventaire-ingredients")
      .then((res) => {
        setIngredients(res.data.data.map((i: any) => ({ ...i, quantitePhysique: i.quantiteStock })))
      })
      .catch(() => toast({ title: "Erreur", description: "Impossible de charger les ingrédients", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [])

  const setQuantite = (id: number, val: string) => {
    setIngredients((prev) =>
      prev.map((i) => i.id === id ? { ...i, quantitePhysique: parseFloat(val) || 0 } : i)
    )
  }

  const reset = () => {
    setIngredients((prev) => prev.map((i) => ({ ...i, quantitePhysique: i.quantiteStock })))
  }

  const save = async () => {
    setSaving(true)
    try {
      const lignes = ingredients.map((i) => ({ id: i.id, quantitePhysique: i.quantitePhysique ?? i.quantiteStock }))
      await apiClient.post("/inventaire-ingredients/ajuster", { lignes })
      // Mettre à jour les quantités théoriques avec les nouvelles valeurs
      setIngredients((prev) => prev.map((i) => ({ ...i, quantiteStock: i.quantitePhysique ?? i.quantiteStock })))
      toast({ title: "Inventaire enregistré", description: "Les stocks ont été mis à jour avec succès." })
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.response?.data?.message || "Une erreur est survenue", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48"><p>Chargement...</p></div>
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventaire des Ingrédients</h1>
          <p className="text-sm text-muted-foreground mt-1">Saisissez les quantités physiques constatées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des ingrédients</CardTitle>
          <CardDescription>Modifiez la colonne "Quantité physique" pour chaque ingrédient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrédient</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Stock théorique</TableHead>
                  <TableHead className="text-right w-48">Quantité physique</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => {
                  const physique = ing.quantitePhysique ?? ing.quantiteStock
                  const ecart = physique - ing.quantiteStock
                  return (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium">{ing.nom}</TableCell>
                      <TableCell className="text-muted-foreground">{ing.categorie || "—"}</TableCell>
                      <TableCell className="text-right">
                        {ing.quantiteStock} <span className="text-xs text-muted-foreground">{ing.unite}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={physique}
                            onChange={(e) => setQuantite(ing.id, e.target.value)}
                            className="w-28 text-right h-8"
                          />
                          <span className="text-xs text-muted-foreground">{ing.unite}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {ecart === 0 ? (
                          <Badge variant="outline" className="text-green-600 border-green-300">0</Badge>
                        ) : ecart > 0 ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">+{ecart.toFixed(2)}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-300">{ecart.toFixed(2)}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {ingredients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun ingrédient trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
