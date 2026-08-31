"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Building2, User, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Footer } from "@/components/layout/footer"
import { HomeHeader } from "@/components/layout/home-header"
import { useAuth } from "@/context/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services"

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [entreprise, setEntreprise] = useState({ nom: "", email: "", tel: "", adresse: "" })
  const [admin, setAdmin] = useState({ nom: "", prenom: "", email: "", tel: "", adresse: "", password: "", confirmPassword: "" })

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!entreprise.nom.trim()) e.eNom = "Nom requis"
    if (!entreprise.email.includes("@")) e.eEmail = "Email invalide"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!admin.nom.trim()) e.nom = "Nom requis"
    if (!admin.prenom.trim()) e.prenom = "Prénom requis"
    if (!admin.email.includes("@")) e.email = "Email invalide"
    if (!admin.tel || admin.tel.length < 8) e.tel = "Téléphone invalide"
    if (admin.password.length < 6) e.password = "Minimum 6 caractères"
    if (admin.password !== admin.confirmPassword) e.confirmPassword = "Mots de passe différents"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    setIsSubmitting(true)
    try {
      const result = await authService.registerEntreprise({
        entreprise: { nom: entreprise.nom, email: entreprise.email, tel: entreprise.tel, adresse: entreprise.adresse },
        admin: { nom: admin.nom, prenom: admin.prenom, email: admin.email, tel: admin.tel, adresse: admin.adresse, password: admin.password },
      })
      // Store token and log in
      const { token, user: loggedInUser } = result.data
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(loggedInUser))
      if (loggedInUser?.entrepriseId) localStorage.setItem("entrepriseId", String(loggedInUser.entrepriseId))
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      toast({ title: "Entreprise créée !", description: "Bienvenue sur votre espace de gestion." })
      router.push("/gerant/dashboard")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = "h-11 w-full rounded-xl border border-input bg-muted px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"

  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader />
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/20">
        <div className="w-full max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center gap-4 mb-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Building2 className="w-4 h-4" />
                  Entreprise
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <User className="w-4 h-4" />
                  Administrateur
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {step === 1 ? "Votre entreprise" : "Compte administrateur"}
              </CardTitle>
              <CardDescription>
                {step === 1
                  ? "Informations sur votre entreprise"
                  : "Votre compte pour gérer l'espace"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nom de l'entreprise *</Label>
                    <input className={inputClass} placeholder="Mon Entreprise SARL" value={entreprise.nom}
                      onChange={e => setEntreprise(p => ({ ...p, nom: e.target.value }))} />
                    {errors.eNom && <p className="text-destructive text-xs">{errors.eNom}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email de l'entreprise *</Label>
                    <input className={inputClass} type="email" placeholder="contact@entreprise.com" value={entreprise.email}
                      onChange={e => setEntreprise(p => ({ ...p, email: e.target.value }))} />
                    {errors.eEmail && <p className="text-destructive text-xs">{errors.eEmail}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Téléphone</Label>
                    <input className={inputClass} type="tel" placeholder="+228 90 00 00 00" value={entreprise.tel}
                      onChange={e => setEntreprise(p => ({ ...p, tel: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Adresse</Label>
                    <input className={inputClass} placeholder="Lomé, Togo" value={entreprise.adresse}
                      onChange={e => setEntreprise(p => ({ ...p, adresse: e.target.value }))} />
                  </div>
                  <Button onClick={handleNext} className="w-full h-11">
                    Suivant <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nom *</Label>
                      <input className={inputClass} placeholder="Dupont" value={admin.nom}
                        onChange={e => setAdmin(p => ({ ...p, nom: e.target.value }))} />
                      {errors.nom && <p className="text-destructive text-xs">{errors.nom}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Prénom *</Label>
                      <input className={inputClass} placeholder="Jean" value={admin.prenom}
                        onChange={e => setAdmin(p => ({ ...p, prenom: e.target.value }))} />
                      {errors.prenom && <p className="text-destructive text-xs">{errors.prenom}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <input className={inputClass} type="email" placeholder="admin@entreprise.com" value={admin.email}
                      onChange={e => setAdmin(p => ({ ...p, email: e.target.value }))} />
                    {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Téléphone *</Label>
                    <input className={inputClass} type="tel" placeholder="+228 90 00 00 00" value={admin.tel}
                      onChange={e => setAdmin(p => ({ ...p, tel: e.target.value }))} />
                    {errors.tel && <p className="text-destructive text-xs">{errors.tel}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mot de passe *</Label>
                    <div className="relative">
                      <input className={inputClass + " pr-11"} type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={admin.password} onChange={e => setAdmin(p => ({ ...p, password: e.target.value }))} />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirmer le mot de passe *</Label>
                    <input className={inputClass} type="password" placeholder="••••••••"
                      value={admin.confirmPassword} onChange={e => setAdmin(p => ({ ...p, confirmPassword: e.target.value }))} />
                    {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword}</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                      <ChevronLeft className="mr-2 w-4 h-4" /> Retour
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
                      {isSubmitting ? "Création..." : "Créer mon espace"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">Se connecter</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
