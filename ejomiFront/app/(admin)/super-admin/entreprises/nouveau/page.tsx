"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Save, User, Globe, BookOpen, Image, Clock, Share2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { entrepriseService } from "@/services/entreprise-service"

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

export default function NouvelleEntreprisePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [entrepriseData, setEntrepriseData] = useState({
    // Infos de base
    nom: "",
    email: "",
    tel: "",
    adresse: "",
    logo: "",
    geolocalisation: "",
    siteWeb: "",
    // Page d'accueil
    heroTitre: "",
    heroSousTitre: "",
    heroImage: "",
    // À propos
    histoire: "",
    mission: "",
    vision: "",
    valeur: "",
    // Réseaux sociaux
    facebook: "",
    instagram: "",
    twitter: "",
    // Horaires
    jourouverture: [] as string[],
    heureouverture: [] as string[],
    jourfermeture: [] as string[],
    heurefermeture: [] as string[],
  })

  const [adminData, setAdminData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    tel: "",
    adresse: "",
  })

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEntrepriseData((prev) => ({ ...prev, [field]: e.target.value }))

  const toggleJour = (jour: string, liste: "jourouverture" | "jourfermeture") => {
    setEntrepriseData((prev) => {
      const current = prev[liste]
      return {
        ...prev,
        [liste]: current.includes(jour) ? current.filter((j) => j !== jour) : [...current, jour],
      }
    })
  }

  const setHeure = (index: number, valeur: string, liste: "heureouverture" | "heurefermeture") => {
    setEntrepriseData((prev) => {
      const arr = [...prev[liste]]
      arr[index] = valeur
      return { ...prev, [liste]: arr }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entrepriseData.nom || !entrepriseData.email) {
      toast({ title: "Erreur", description: "Nom et email de l'entreprise sont requis", variant: "destructive" })
      return
    }
    if (!adminData.nom || !adminData.prenom || !adminData.email || !adminData.password) {
      toast({ title: "Erreur", description: "Nom, prénom, email et mot de passe de l'admin sont requis", variant: "destructive" })
      return
    }
    if (adminData.password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await entrepriseService.create({ entreprise: entrepriseData, admin: adminData })
      toast({ title: "Entreprise créée avec succès" })
      router.push("/super-admin/entreprises")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la création",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/super-admin/entreprises"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle entreprise</h1>
          <p className="text-muted-foreground text-sm">Remplissez toutes les informations — elles seront utilisées pour dynamiser la page d'accueil, la page contact et la page à propos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 1. INFOS DE BASE ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Informations générales *</CardTitle>
            <CardDescription>Coordonnées principales de l'entreprise</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'entreprise *</Label>
              <Input value={entrepriseData.nom} onChange={setField("nom")} placeholder="Ex: Ejomi SARL" required />
            </div>
            <div className="space-y-2">
              <Label>Email de contact *</Label>
              <Input type="email" value={entrepriseData.email} onChange={setField("email")} placeholder="contact@entreprise.com" required />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={entrepriseData.tel} onChange={setField("tel")} placeholder="+226 70 00 00 00" />
            </div>
            <div className="space-y-2">
              <Label>Adresse physique</Label>
              <Input value={entrepriseData.adresse} onChange={setField("adresse")} placeholder="Ex: Ouagadougou, Secteur 15" />
            </div>
            <div className="space-y-2">
              <Label>Géolocalisation</Label>
              <Input value={entrepriseData.geolocalisation} onChange={setField("geolocalisation")} placeholder="Lien Google Maps ou coordonnées GPS" />
            </div>
            <div className="space-y-2">
              <Label>Site web</Label>
              <Input value={entrepriseData.siteWeb} onChange={setField("siteWeb")} placeholder="https://www.entreprise.com" />
            </div>
          </CardContent>
        </Card>

        {/* ── 2. PAGE D'ACCUEIL ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />Page d'accueil (Hero)</CardTitle>
            <CardDescription>Textes affichés dans la bannière principale du site public</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre principal</Label>
              <Input value={entrepriseData.heroTitre} onChange={setField("heroTitre")} placeholder="Ex: Bienvenue chez Ejomi" />
            </div>
            <div className="space-y-2">
              <Label>Sous-titre</Label>
              <Input value={entrepriseData.heroSousTitre} onChange={setField("heroSousTitre")} placeholder="Ex: Gérez votre stock efficacement" />
            </div>
            <div className="space-y-2">
              <Label>Logo (URL)</Label>
              <Input value={entrepriseData.logo} onChange={setField("logo")} placeholder="https://... (URL de l'image du logo)" />
            </div>
            <div className="space-y-2">
              <Label>Image hero (URL)</Label>
              <Input value={entrepriseData.heroImage} onChange={setField("heroImage")} placeholder="https://... (image de fond du hero)" />
            </div>
          </CardContent>
        </Card>

        {/* ── 3. À PROPOS ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Page À propos</CardTitle>
            <CardDescription>Ces textes alimenteront la page "À propos" du site public</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Histoire de l'entreprise</Label>
              <Textarea value={entrepriseData.histoire} onChange={setField("histoire")} rows={3} placeholder="Décrivez l'histoire et l'origine de l'entreprise..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mission</Label>
                <Textarea value={entrepriseData.mission} onChange={setField("mission")} rows={3} placeholder="Quelle est la mission principale ?" />
              </div>
              <div className="space-y-2">
                <Label>Vision</Label>
                <Textarea value={entrepriseData.vision} onChange={setField("vision")} rows={3} placeholder="Quelle est la vision à long terme ?" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valeurs</Label>
              <Textarea value={entrepriseData.valeur} onChange={setField("valeur")} rows={2} placeholder="Ex: Intégrité, Excellence, Service client..." />
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
                      entrepriseData.jourouverture.includes(jour)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {jour}
                  </button>
                ))}
              </div>
              {entrepriseData.jourouverture.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Heures d'ouverture pour chaque jour sélectionné</Label>
                  {entrepriseData.jourouverture.map((jour, i) => (
                    <div key={jour} className="flex items-center gap-3">
                      <span className="text-sm w-24 font-medium">{jour}</span>
                      <Input
                        type="time"
                        className="w-36"
                        value={entrepriseData.heureouverture[i] || ""}
                        onChange={(e) => setHeure(i, e.target.value, "heureouverture")}
                        placeholder="08:00"
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
                      entrepriseData.jourfermeture.includes(jour)
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-background border-border text-muted-foreground hover:border-destructive"
                    }`}
                  >
                    {jour}
                  </button>
                ))}
              </div>
              {entrepriseData.jourfermeture.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Heures de fermeture pour chaque jour sélectionné</Label>
                  {entrepriseData.jourfermeture.map((jour, i) => (
                    <div key={jour} className="flex items-center gap-3">
                      <span className="text-sm w-24 font-medium">{jour}</span>
                      <Input
                        type="time"
                        className="w-36"
                        value={entrepriseData.heurefermeture[i] || ""}
                        onChange={(e) => setHeure(i, e.target.value, "heurefermeture")}
                        placeholder="18:00"
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
            <CardDescription>Liens affichés dans le footer et la page contact</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input value={entrepriseData.facebook} onChange={setField("facebook")} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={entrepriseData.instagram} onChange={setField("instagram")} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X</Label>
              <Input value={entrepriseData.twitter} onChange={setField("twitter")} placeholder="https://twitter.com/..." />
            </div>
          </CardContent>
        </Card>

        {/* ── 6. ADMINISTRATEUR ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Administrateur de l'entreprise *</CardTitle>
            <CardDescription>Ce compte aura les droits ADMIN et pourra gérer toute l'entreprise</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input value={adminData.prenom} onChange={(e) => setAdminData({ ...adminData, prenom: e.target.value })} placeholder="Prénom" required />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={adminData.nom} onChange={(e) => setAdminData({ ...adminData, nom: e.target.value })} placeholder="Nom de famille" required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={adminData.email} onChange={(e) => setAdminData({ ...adminData, email: e.target.value })} placeholder="admin@entreprise.com" required />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe *</Label>
              <Input type="password" value={adminData.password} onChange={(e) => setAdminData({ ...adminData, password: e.target.value })} placeholder="Minimum 6 caractères" required />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={adminData.tel} onChange={(e) => setAdminData({ ...adminData, tel: e.target.value })} placeholder="+226 70 00 00 00" />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={adminData.adresse} onChange={(e) => setAdminData({ ...adminData, adresse: e.target.value })} placeholder="Adresse de résidence" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/super-admin/entreprises">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-40">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Création en cours..." : "Créer l'entreprise"}
          </Button>
        </div>
      </form>
    </div>
  )
}
