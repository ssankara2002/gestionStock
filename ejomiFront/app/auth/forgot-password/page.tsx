"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, KeyRound } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { HomeHeader } from "@/components/layout/home-header"
import { Footer } from "@/components/layout/footer"
import { authService } from "@/services"

const schema = z.object({
  email: z.string().email("Email invalide"),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError("")
    try {
      await authService.forgotPassword(data.email)
      setSuccess(true)
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl overflow-hidden bg-card border shadow-lg">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary" />
            <div className="p-8">
              <div className="mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>

              <h1 className="text-center text-xl font-bold mb-1">Mot de passe oublié</h1>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>

              {success ? (
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-green-700 font-medium">Email envoyé !</p>
                    <p className="text-green-600 text-sm mt-1">
                      Si cet email est associé à un compte, vous recevrez un lien dans quelques minutes.
                    </p>
                  </div>
                  <Link href="/auth/login" className="text-sm font-semibold text-primary hover:underline">
                    Retour à la connexion
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="exemple@email.com"
                        autoComplete="email"
                        className="w-full h-11 px-4 rounded-xl text-sm bg-muted border border-input outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs">{errors.email.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground bg-primary transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours...</>
                      ) : (
                        "Envoyer le lien"
                      )}
                    </button>
                  </form>

                  <div className="mt-5 pt-4 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Lien valide 1 heure</span>
                    <Link href="/auth/login" className="text-xs font-semibold text-primary hover:underline">
                      Retour à la connexion
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
