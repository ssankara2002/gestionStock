"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Upload } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { platService } from "@/services"
import type { Plat } from "@/types/plat"

const resolveImage = (image?: string | null) => {
  if (!image) return null
  if (image.startsWith("http") || image.startsWith("/")) return image
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001"
  return `${base}/uploads/${image}`
}

export default function ModifierPlatPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = String(params.id)
  const [form, setForm] = useState({ libelle: "", description: "", prixVenteUnitaire: "", categorie: "REPAS" })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    platService.getById(id).then((res) => {
      const plat: Plat = res.data.data
      setForm({ libelle: plat.libelle, description: plat.description || "", prixVenteUnitaire: String(plat.prixVenteUnitaire), categorie: (plat as any).categorie || "REPAS" })
      setPreview(resolveImage(plat.image))
    }).catch(() => {
      toast({ title: "Erreur", description: "Impossible de charger le plat", variant: "destructive" })
      router.push("/plats")
    }).finally(() => setLoading(false))
  }, [id, router, toast])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      data.append("libelle", form.libelle)
      data.append("description", form.description)
      data.append("prixVenteUnitaire", form.prixVenteUnitaire)
      data.append("categorie", form.categorie)
      if (image) data.append("image", image)
      await platService.update(id, data)
      toast({ title: "Plat modifié", description: "Les informations ont été mises à jour." })
      router.push("/plats")
    } catch (error: any) {
      toast({ title: "Erreur", description: error.response?.data?.message || "Modification impossible", variant: "destructive" })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="container py-8 text-muted-foreground">Chargement...</div>

  return <div className="container max-w-3xl py-8 space-y-6">
    <div className="flex items-center gap-3"><Button variant="outline" size="icon" asChild><Link href="/plats"><ArrowLeft className="h-4 w-4" /></Link></Button><h1 className="text-2xl font-bold">Modifier le plat</h1></div>
    <Card><CardHeader><CardTitle>Informations du plat</CardTitle><CardDescription>Modifier le nom, le prix ou l’image du plat.</CardDescription></CardHeader><CardContent>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="libelle">Nom du plat *</Label><Input id="libelle" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required /></div>
        <div className="space-y-2"><Label htmlFor="prix">Prix de vente (FCFA) *</Label><Input id="prix" type="number" min="0" value={form.prixVenteUnitaire} onChange={(e) => setForm({ ...form, prixVenteUnitaire: e.target.value })} required /></div>
        <div className="space-y-2">
          <Label htmlFor="categorie">Catégorie *</Label>
          <select id="categorie" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="REPAS">Repas</option>
            <option value="LIQUIDE">Liquide</option>
            <option value="SNACK">Snack</option>
          </select>
        </div>
        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="image">Image du plat</Label>{preview && <img src={preview} alt="Aperçu" className="h-32 w-32 rounded object-cover" />}<Label htmlFor="image" className="flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm hover:bg-accent"><Upload className="mr-2 h-4 w-4" />Changer l’image</Label><Input id="image" type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImage(file); setPreview(URL.createObjectURL(file)) } }} /></div>
        <div className="flex justify-end"><Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Enregistrement..." : "Enregistrer"}</Button></div>
      </form>
    </CardContent></Card>
  </div>
}
