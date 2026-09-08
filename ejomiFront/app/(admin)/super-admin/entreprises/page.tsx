"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Eye, PenLine, Plus, Search, Trash2, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { entrepriseService } from "@/services/entreprise-service"

export default function EntreprisesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")

  const { data: entreprises = [], isLoading } = useQuery({
    queryKey: ["entreprises"],
    queryFn: async () => {
      const res = await entrepriseService.getAll()
      return res.data.data || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => entrepriseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entreprises"] })
      toast({ title: "Entreprise supprimée avec succès" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'entreprise", variant: "destructive" })
    },
  })

  const handleDelete = (id: number, nom: string) => {
    if (confirm(`Supprimer l'entreprise "${nom}" ? Cette action est irréversible.`)) {
      deleteMutation.mutate(id)
    }
  }

  const filtered = entreprises.filter((e: any) =>
    e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Entreprises
          </h1>
          <p className="text-muted-foreground mt-1">Gérez toutes les entreprises de la plateforme</p>
        </div>
        <Button asChild>
          <Link href="/super-admin/entreprises/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle entreprise
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste des entreprises</CardTitle>
          <CardDescription>{filtered.length} entreprise(s) enregistrée(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une entreprise..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9" onClick={() => setSearchTerm("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucune entreprise trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((entreprise: any) => (
                      <TableRow key={entreprise.id}>
                        <TableCell className="font-medium">{entreprise.nom}</TableCell>
                        <TableCell>{entreprise.email || "—"}</TableCell>
                        <TableCell>{entreprise.tel || "—"}</TableCell>
                        <TableCell>{entreprise.adresse || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entreprise._count?.users ?? "—"} users</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/super-admin/entreprises/${entreprise.id}/modifier`}>
                                <PenLine className="mr-1 h-3.5 w-3.5" />
                                Modifier
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(entreprise.id, entreprise.nom)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
