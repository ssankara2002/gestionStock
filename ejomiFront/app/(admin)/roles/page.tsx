"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { AssignPermissionsDialog } from "@/components/roles/AssignPermissionsDialog"
import { rolesService } from "@/services"
import type { Role } from "@/types"
import { Shield, Loader2, Users, Lock } from "lucide-react"
import { DataPagination } from "@/components/shared/data-pagination"

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await rolesService.getAll()
      setRoles(response.data.data || [])
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error?.response?.data?.message ||
          "Erreur lors du chargement des rôles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalPages = Math.ceil(roles.length / itemsPerPage)
  const paginatedRoles = roles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pagination = roles.length > 0 ? {
    page: currentPage,
    totalPages,
    total: roles.length,
    limit: itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  } : null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des rôles
          </h1>
          <p className="text-muted-foreground">
            Gérez les rôles et leurs permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des rôles</CardTitle>
          <CardDescription>
            {roles.length} rôle{roles.length > 1 ? "s" : ""} configuré
            {roles.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Aucun rôle trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      {role.description || (
                        <span className="text-muted-foreground italic">
                          Aucune description
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission.id} variant="secondary">
                              {permission.key}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Aucune permission
                          </span>
                        )}
                        {role.permissions && role.permissions.length > 3 && (
                          <Badge variant="outline">
                            +{role.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {role.users?.length || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AssignPermissionsDialog
                        role={role}
                        onSuccess={loadRoles}
                        trigger={
                          <Lock className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors" />
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
