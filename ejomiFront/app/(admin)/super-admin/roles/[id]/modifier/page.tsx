"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { rolesService } from "@/services"

export default function EditSuperAdminRolePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await rolesService.getById(String(params.id))
        const role = res.data.data
        setForm({ name: role.name || "", description: role.description || "" })
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error?.response?.data?.message || "Impossible de charger le rôle.",
          variant: "destructive",
        })
        router.push("/super-admin/roles")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) loadRole()
  }, [params.id, router, toast])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Erreur", description: "Le nom du rôle est obligatoire.", variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      await rolesService.update(String(params.id), {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      })
      toast({ title: "Succès", description: "Le rôle global a été mis à jour." })
      router.push("/super-admin/roles")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour le rôle.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container py-8 text-center text-muted-foreground">Chargement...</div>
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/super-admin/roles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le rôle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
