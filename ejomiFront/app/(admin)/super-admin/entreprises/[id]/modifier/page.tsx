"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Save, BookOpen, Image, Clock, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { entrepriseService } from "@/services/entreprise-service"

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

export default function ModifierEntreprisePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = Number(params.id)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nom: "", email: "", tel: "", adresse: "", logo: "", geolocalisation: "",
    heroTitre: "", heroSousTitre: "", heroImage: "",
    histoire: "", mission: "", vision: "", valeur: "",
    facebook: "", instagram: "", twitter: "",
    jourouverture: [] as string[],
    heureouverture: [] as string[],
    jourfermeture: [] as string[],
    heurefermeture: [] as string[],
  })

  useEffect(() => {
    const fetchEntreprise = async () => {
      try {
        const res = await entrepriseService.getById(id)
        const e = res.data.data || res.data
        setFormData({
          nom: e.nom || "", email: e.email || "", tel: e.tel || "", adresse: e.adresse || "",
          logo: e.logo || "", geolocalisation: e.geolocalisation || "",
          heroTitre: e.heroTitre || "", heroSousTitre: e.heroSousTitre || "", heroImage: e.heroImage || "",
          histoire: e.histoire || "", mission: e.mission || "", vision: e.vision || "", valeur: e.valeur || "",
          facebook: e.facebook || "", instagram: e.instagram || "", twitter: e.twitter || "",
          jourouverture: e.jourouverture || [],
          heureouverture: e.heureouverture || [],
          jourfermeture: e.jourfermeture || [],
          heurefermeture: e.heurefermeture || [],
        })
      } catch {
        toast({ title: "Erreur", description: "Impossible de charger l'entreprise", variant: "destructive" })
        router.push("/super-admin/entreprises")
      } finally {
        setIsLoading(false)
      }
    }
    fetchEntreprise()
  }, [id])

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const toggleJour = (jour: string, liste: "jourouverture" | "jourfermeture") => {
    setFormData((prev) => {
      const current = prev[liste]
      return {
        ...prev,
        [liste]: current.includes(jour) ? current.filter((j) => j !== jour) : [...current, jour],
      }
    })
  }

  const setHeure = (index: number, valeur: string, liste: "heureouverture" | "heurefermeture") => {
    setFormData((prev) => {
      const arr = [...prev[liste]]
      arr[index] = valeur
      return { ...prev, [liste]: arr }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await entrepriseService.update(id, formData)
      toast({ title: "Entreprise mise à jour avec succès" })
      router.push("/super-admin/entreprises")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="flex justify-center p-8 text-muted-foreground">Chargement...</div>

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/super-admin/entreprises"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier — {formData.nom}</h1>
          <p className="text-muted-foreground text-sm">Ces informations dynamisent la page d'accueil, contact et à propos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 1. INFOS GÉNÉRALES ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'entreprise *</Label>
              <Input value={formData.nom} onChange={setField("nom")} required />
            </div>
            <div className="space-y-2">
              <Label>Email de contact</Label>
              <Input type="email" value={formData.email} onChange={setField("email")} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={formData.tel} onChange={setField("tel")} />
            </div>
            <div className="space-y-2">
              <Label>Adresse physique</Label>
              <Input value={formData.adresse} onChange={setField("adresse")} />
            </div>
            <div className="space-y-2">
              <Label>Géolocalisation</Label>
              <Input value={formData.geolocalisation} onChange={setField("geolocalisation")} placeholder="Lien Google Maps ou coordonnées GPS" />
            </div>
          </CardContent>
        </Card>

        {/* ── 2. PAGE D'ACCUEIL ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />Page d'accueil (Hero)</CardTitle>
            <CardDescription>Textes et images affichés dans la bannière principale du site public</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre principal</Label>
              <Input value={formData.heroTitre} onChange={setField("heroTitre")} placeholder="Bienvenue chez..." />
            </div>
            <div className="space-y-2">
              <Label>Sous-titre</Label>
              <Input value={formData.heroSousTitre} onChange={setField("heroSousTitre")} placeholder="Gérez votre stock..." />
            </div>
            <div className="space-y-2">
              <Label>Logo (URL)</Label>
              <Input value={formData.logo} onChange={setField("logo")} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Image hero (URL)</Label>
              <Input value={formData.heroImage} onChange={setField("heroImage")} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {/* ── 3. À PROPOS ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Page À propos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Histoire</Label>
              <Textarea value={formData.histoire} onChange={setField("histoire")} rows={3} placeholder="Décrivez l'histoire et l'origine..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mission</Label>
                <Textarea value={formData.mission} onChange={setField("mission")} rows={3} placeholder="Mission principale..." />
              </div>
              <div className="space-y-2">
                <Label>Vision</Label>
                <Textarea value={formData.vision} onChange={setField("vision")} rows={3} placeholder="Vision à long terme..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valeurs</Label>
              <Textarea value={formData.valeur} onChange={setField("valeur")} rows={2} placeholder="Ex: Intégrité, Excellence..." />
            </div>
          </CardContent>
        </Card>

        {/* ── 4. HORAIRES ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Horaires d'ouverture</CardTitle>
            <CardDescription>Affichés sur la page contact du site public</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Jours d'ouverture</Label>
              <div className="flex flex-wrap gap-2">
                {JOURS.map((jour) => (
                  <button
                    key={jour}
                    type="button"
                    onClick={() => toggleJour(jour, "jourouverture")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      formData.jourouverture.includes(jour)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {jour}
                  </button>
                ))}
              </div>
              {formData.jourouverture.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Heures d'ouverture</Label>
                  {formData.jourouverture.map((jour, i) => (
                    <div key={jour} className="flex items-center gap-3">
                      <span className="text-sm w-24 font-medium">{jour}</span>
                      <Input
                        type="time"
                        className="w-36"
                        value={formData.heureouverture[i] || ""}
                        onChange={(e) => setHeure(i, e.target.value, "heureouverture")}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Jours de fermeture</Label>
              <div className="flex flex-wrap gap-2">
                {JOURS.map((jour) => (
                  <button
                    key={jour}
                    type="button"
                    onClick={() => toggleJour(jour, "jourfermeture")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      formData.jourfermeture.includes(jour)
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-background border-border text-muted-foreground hover:border-destructive"
                    }`}
                  >
                    {jour}
                  </button>
                ))}
              </div>
              {formData.jourfermeture.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Heures de fermeture</Label>
                  {formData.jourfermeture.map((jour, i) => (
                    <div key={jour} className="flex items-center gap-3">
                      <span className="text-sm w-24 font-medium">{jour}</span>
                      <Input
                        type="time"
                        className="w-36"
                        value={formData.heurefermeture[i] || ""}
                        onChange={(e) => setHeure(i, e.target.value, "heurefermeture")}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── 5. RÉSEAUX SOCIAUX ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />Réseaux sociaux</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input value={formData.facebook} onChange={setField("facebook")} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={formData.instagram} onChange={setField("instagram")} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X</Label>
              <Input value={formData.twitter} onChange={setField("twitter")} placeholder="https://twitter.com/..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/super-admin/entreprises">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-40">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
