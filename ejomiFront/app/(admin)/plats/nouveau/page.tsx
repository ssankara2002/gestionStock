"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { platService } from "@/services"

export default function NouveauPlatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({ libelle: "", description: "", prixVenteUnitaire: "" })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.libelle.trim() || form.prixVenteUnitaire === "") return
    setSaving(true)
    try {
      const data = new FormData()
      data.append("libelle", form.libelle)
      data.append("description", form.description)
      data.append("prixVenteUnitaire", form.prixVenteUnitaire)
      if (image) data.append("image", image)
      await platService.create(data)
      toast({ title: "Plat créé", description: "Le plat a été ajouté au catalogue." })
      router.push("/plats")
    } catch (error: any) {
      toast({ title: "Erreur", description: error.response?.data?.message || "Création impossible", variant: "destructive" })
    } finally { setSaving(false) }
  }

  return <div className="container max-w-3xl py-8 space-y-6">
    <div className="flex items-center gap-3"><Button variant="outline" size="icon" asChild><Link href="/plats"><ArrowLeft className="h-4 w-4" /></Link></Button><h1 className="text-2xl font-bold">Nouveau plat</h1></div>
    <Card><CardHeader><CardTitle>Informations du plat</CardTitle><CardDescription>Le plat sera vendable sans être suivi comme un stock.</CardDescription></CardHeader><CardContent>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="libelle">Nom du plat *</Label><Input id="libelle" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required /></div>
        <div className="space-y-2"><Label htmlFor="prix">Prix de vente (FCFA) *</Label><Input id="prix" type="number" min="0" value={form.prixVenteUnitaire} onChange={(e) => setForm({ ...form, prixVenteUnitaire: e.target.value })} required /></div>
        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="image">Image du plat</Label>{preview && <img src={preview} alt="Aperçu" className="h-32 w-32 rounded object-cover" />}<Label htmlFor="image" className="flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm hover:bg-accent"><Upload className="mr-2 h-4 w-4" />Téléverser une image</Label><Input id="image" type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImage(file); setPreview(URL.createObjectURL(file)) } }} /></div>
        <div className="flex justify-end"><Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Enregistrement..." : "Enregistrer"}</Button></div>
      </form>
    </CardContent></Card>
  </div>
}
