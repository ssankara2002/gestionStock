"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/components/layout/footer"
import { HomeHeader } from "@/components/layout/home-header"
import { useAuth } from "@/context/auth-provider"
import { useToast } from "@/hooks/use-toast"

// Schéma de validation Yup
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Format d'email invalide")
    .required("L'email est obligatoire"),
  password: Yup.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .required("Le mot de passe est obligatoire"),
})

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const initialValues = {
    email: "",
    password: "",
  }

  const handleSubmit = async (values: typeof initialValues, { setSubmitting }: any) => {
    setFormError(null) // Réinitialiser l'erreur à chaque soumission
    try {
      // La logique de connexion et de redirection est maintenant gérée par le AuthProvider
      await login(values.email, values.password)

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      })
    } catch (error: any) {
      let errorMessage = "Une erreur est survenue lors de la connexion"

      // Extraire le message d'erreur de la réponse Axios ou utiliser le message par défaut
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      setFormError(errorMessage)

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
      <div className="flex flex-col min-h-screen w-full">
      <HomeHeader />
      <main className="flex-1 flex items-center justify-center py-12 bg-muted/20">
        <div className="w-full max-w-lg px-4">
          <Card className="p-6 sm:p-8 md:p-10 shadow-lg">
              <CardHeader className="space-y-4 text-center">
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <CardDescription>Entrez vos identifiants pour accéder à votre compte</CardDescription>
            </CardHeader>
            <CardContent>
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
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
                          <span className="sr-only">{showPassword ? "Masquer" : "Afficher"} le mot de passe</span>
                        </Button>
                      </div>
                      <ErrorMessage name="password" component="div" className="text-sm text-red-500" />
                    </div>

                    <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
                      {isSubmitting ? "Connexion en cours..." : "Se connecter"}
                    </Button>
                  </Form>
                )}
              </Formik>

      
             
            </CardContent>
            <CardFooter>
              <p className="text-center text-sm text-muted-foreground">
                Vous n'avez pas de compte?{" "}
                <Link href="/auth/register" className="text-primary hover:underline">
                  S'inscrire
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
