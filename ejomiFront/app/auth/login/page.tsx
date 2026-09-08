"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, ArrowLeft, Building2 } from "lucide-react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Footer } from "@/components/layout/footer"
import { HomeHeader } from "@/components/layout/home-header"
import { useAuth } from "@/context/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services"

const validationSchema = Yup.object({
  email: Yup.string().email("Format d'email invalide").required("L'email est obligatoire"),
  password: Yup.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .required("Le mot de passe est obligatoire"),
})

type Entreprise = { id: number; nom: string; logo?: string }
type Step = "credentials" | "choose-entreprise"

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>("credentials")
  const [entreprises, setEntreprises] = useState<Entreprise[]>([])
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null)
  const [selectingId, setSelectingId] = useState<number | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3002"

  const handleCredentialsSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: any
  ) => {
    setFormError(null)
    try {
      const res = await authService.getEntreprises(values)
      const list: Entreprise[] = res.data.entreprises

      if (list.length === 0) {
        // Aucune entreprise : connexion directe sans entreprise (cas improbable)
        await login(values.email, values.password)
        toast({ title: "Connexion réussie", description: "Vous êtes maintenant connecté" })
      } else if (list.length === 1) {
        // Une seule entreprise : connexion directe
        await login(values.email, values.password, list[0].id)
        toast({ title: "Connexion réussie", description: "Vous êtes maintenant connecté" })
      } else {
        // Plusieurs entreprises : afficher le sélecteur
        setEntreprises(list)
        setPendingCredentials(values)
        setStep("choose-entreprise")
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Une erreur est survenue"
      setFormError(msg)
      toast({ title: "Erreur de connexion", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectEntreprise = async (entrepriseId: number) => {
    if (!pendingCredentials) return
    setSelectingId(entrepriseId)
    setFormError(null)
    try {
      await login(pendingCredentials.email, pendingCredentials.password, entrepriseId)
      toast({ title: "Connexion réussie", description: "Vous êtes maintenant connecté" })
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Une erreur est survenue"
      setFormError(msg)
      toast({ title: "Erreur de connexion", description: msg, variant: "destructive" })
    } finally {
      setSelectingId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <HomeHeader />
      <main className="flex-1 flex items-center justify-center py-12 bg-muted/20">
        <div className="w-full max-w-lg px-4">
          {step === "credentials" ? (
            <Card className="p-6 sm:p-8 md:p-10 shadow-lg">
              <CardHeader className="space-y-4 text-center">
                <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
                <CardDescription>Entrez vos identifiants pour accéder à votre compte</CardDescription>
              </CardHeader>
              <CardContent>
                <Formik
                  initialValues={{ email: "", password: "" }}
                  validationSchema={validationSchema}
                  onSubmit={handleCredentialsSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-4">
                      {formError && (
                        <div className="bg-destructive/15 p-3 rounded-md text-center text-sm text-destructive">
                          {formError}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Field
                          as={Input}
                          id="email"
                          name="email"
                          type="email"
                          placeholder="exemple@email.com"
                        />
                        <ErrorMessage name="email" component="div" className="text-sm text-red-500" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Mot de passe</Label>
                          <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                            Mot de passe oublié?
                          </Link>
                        </div>
                        <div className="relative">
                          <Field
                            as={Input}
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        <ErrorMessage name="password" component="div" className="text-sm text-red-500" />
                      </div>

                      <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
                        {isSubmitting ? "Vérification..." : "Continuer"}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </CardContent>
              <CardFooter>
                <p className="text-center text-sm text-muted-foreground w-full">
                  Vous n&apos;avez pas de compte?{" "}
                  <Link href="/auth/register" className="text-primary hover:underline">
                    S&apos;inscrire
                  </Link>
                </p>
              </CardFooter>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8 shadow-lg">
              <CardHeader className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2 mb-2"
                  onClick={() => { setStep("credentials"); setFormError(null) }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour
                </Button>
                <CardTitle className="text-2xl font-bold">Choisir une entreprise</CardTitle>
                <CardDescription>
                  Votre compte est associé à plusieurs entreprises. Sélectionnez celle à laquelle vous souhaitez vous connecter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formError && (
                  <div className="bg-destructive/15 p-3 rounded-md text-center text-sm text-destructive mb-4">
                    {formError}
                  </div>
                )}
                <div className="space-y-3">
                  {entreprises.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => handleSelectEntreprise(e.id)}
                      disabled={selectingId !== null}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0 overflow-hidden">
                        {e.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`${baseUrl}/uploads/${e.logo}`} alt={e.nom} className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{e.nom}</p>
                      </div>
                      {selectingId === e.id && (
                        <svg className="animate-spin h-5 w-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
