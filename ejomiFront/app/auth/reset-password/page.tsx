"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { HomeHeader } from "@/components/layout/home-header"
import { Footer } from "@/components/layout/footer"
import { authService } from "@/services"

const schema = z.object({
  password: z.string().min(6, "Au moins 6 caractères"),
  password_confirmation: z.string().min(6, "Au moins 6 caractères"),
}).refine((d) => d.password === d.password_confirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirmation"],
})
type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) { setError("Lien de réinitialisation invalide."); return; }
    setIsLoading(true)
    setError("")
    try {
      await authService.resetPassword(token, data.password)
      setSuccess(true)
      setTimeout(() => router.push("/auth/login"), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lien invalide ou expiré. Veuillez recommencer.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full h-11 px-4 pr-11 rounded-xl text-sm bg-muted border border-input outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"

  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl overflow-hidden bg-card border shadow-lg">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary" />
            <div className="p-8">
              <div className="mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>

              <h1 className="text-center text-xl font-bold mb-1">Nouveau mot de passe</h1>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Créez un nouveau mot de passe pour votre compte
              </p>

              {success ? (
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-green-700 font-medium">Mot de passe réinitialisé !</p>
                    <p className="text-green-600 text-sm mt-1">Redirection vers la connexion...</p>
                  </div>
                </div>
              ) : (
                <>
                  {!token && (
                    <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                      <p className="text-destructive text-sm">Lien invalide. Veuillez refaire une demande de réinitialisation.</p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className={inputClass}
                          {...register("password")}
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className={inputClass}
                          {...register("password_confirmation")}
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password_confirmation && <p className="text-destructive text-xs">{errors.password_confirmation.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !token}
                      className="w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground bg-primary transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Réinitialisation...</>
                      ) : (
                        "Réinitialiser le mot de passe"
                      )}
                    </button>
                  </form>

                  <div className="mt-5 pt-4 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Vous vous souvenez ?</span>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
