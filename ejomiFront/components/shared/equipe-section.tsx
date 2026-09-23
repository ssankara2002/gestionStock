"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

type Employe = {
  id: number
  user?: {
    prenom: string
    nom: string
    image?: string | null
    role?: { name: string }
  }
}

export function EquipeSection() {
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)

  const baseUrl = process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost'

  useEffect(() => {
    const load = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'
        const res = await fetch(`${API_URL}/employes/public`)
        const body = await res.json()
        setEmployes(body.data || [])
      } catch {
        // silencieux
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-primary/20 bg-card overflow-hidden shadow-lg animate-pulse">
            <div className="aspect-square bg-muted" />
            <CardContent className="p-4 text-center space-y-2">
              <div className="h-4 bg-muted rounded mx-auto w-3/4" />
              <div className="h-3 bg-muted rounded mx-auto w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (employes.length === 0) {
    return (
      <p className="text-center text-muted-foreground">Aucun membre à afficher.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {employes.map((e, index) => {
        const name = `${e.user?.prenom || ""} ${e.user?.nom || ""}`.trim()
        const role = e.user?.role?.name || "Employé"
        const initiales = `${e.user?.prenom?.charAt(0) || ""}${e.user?.nom?.charAt(0) || ""}`.toUpperCase()
        const imageUrl = e.user?.image ? `${baseUrl}/uploads/${e.user.image}` : null

        return (
          <Card key={index} className="border-primary/20 bg-card overflow-hidden shadow-lg">
            <div className="aspect-square relative bg-primary/10">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white text-3xl font-bold">
                    {initiales || "?"}
                  </div>
                </div>
              )}
            </div>
            <CardContent className="p-4 text-center">
              <h3 className="font-playfair text-xl font-bold">{name || "—"}</h3>
              <p className="text-sm text-muted-foreground">{role}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
