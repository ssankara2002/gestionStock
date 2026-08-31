"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { Header } from "@/components/layout/header"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
   
         <div className="flex flex-col min-h-screen w-full">
         <Header />
         <main className="flex-1 flex items-center justify-center py-12 bg-muted/20">
           <div className="w-full max-w-lg px-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Accès non autorisé</CardTitle>
          <CardDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur système.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Retour
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push("/")}
            >
              Accueil
            </Button>
          </div>
        </CardContent>
      
            </div>
      </main>
      
    </div>
  )
}
