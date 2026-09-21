"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Shield, Trash2, Pencil, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { rolesService } from "@/services"
import { DataPagination } from "@/components/shared/data-pagination"
import type { Role } from "@/types"

export default function SuperAdminRolesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["super-admin-roles"],
    queryFn: async () => {
      const res = await rolesService.getAll()
      return res.data.data || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesService.delete(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-roles"] })
      toast({ title: "Rôle supprimé", description: "Le rôle global a bien été supprimé." })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de supprimer le rôle.",
        variant: "destructive",
      })
    },
  })

  const filteredRoles = roles.filter((role: Role) => {
    const text = `${role.name} ${role.description || ""}`.toLowerCase()
    return text.includes(searchTerm.toLowerCase())
  })

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage)
  const paginatedRoles = filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = filteredRoles.length > 0 ? {
    page: currentPage,
    totalPages,
    total: filteredRoles.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Rôles globaux
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des rôles du Super Admin pour toutes les entreprises</p>
        </div>
        <Button asChild>
          <Link href="/super-admin/roles/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau rôle
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste des rôles globaux</CardTitle>
          <CardDescription>{filteredRoles.length} rôle(s) global(aux)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un rôle..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setSearchTerm("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Aucun rôle global trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRoles.map((role: Role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions && role.permissions.length > 0 ? (
                              role.permissions.slice(0, 3).map((permission) => (
                                <span key={permission.id} className="text-xs rounded-full border px-2 py-1">
                                  {permission.key}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">Aucune permission</span>
                            )}
                            {role.permissions && role.permissions.length > 3 && (
                              <span className="text-xs rounded-full border px-2 py-1">+{role.permissions.length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/super-admin/roles/${role.id}/modifier`}>
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Modifier
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Supprimer le rôle "${role.name}" ?`)) {
                                  deleteMutation.mutate(role.id)
                                }
                              }}
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

          {pagination && (
            <DataPagination
              pagination={pagination}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
