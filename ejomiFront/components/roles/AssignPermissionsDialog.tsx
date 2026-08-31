"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { rolesService, permissionsService } from "@/services"
import type { Permission, Role } from "@/types"
import { Shield, Loader2 } from "lucide-react"

interface AssignPermissionsDialogProps {
  role: Role
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function AssignPermissionsDialog({
  role,
  onSuccess,
  trigger,
}: AssignPermissionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true)
      const response = await permissionsService.getAll()
      setPermissions(response.data.data || [])

      // Pré-sélectionner les permissions actuelles du rôle
      const currentPermissionIds =
        role.permissions?.map((p) => p.id) || []
      setSelectedPermissions(currentPermissionIds)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error?.response?.data?.message ||
          "Erreur lors du chargement des permissions",
        variant: "destructive",
      })
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      await rolesService.assignPermissions(
        role.id.toString(),
        selectedPermissions
      )

      toast({
        title: "Succès",
        description: "Permissions assignées avec succès",
      })

      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error?.response?.data?.message ||
          "Erreur lors de l'assignation des permissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Gérer les permissions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gérer les permissions - {role.name}</DialogTitle>
          <DialogDescription>
            Sélectionnez les permissions à attribuer à ce rôle
          </DialogDescription>
        </DialogHeader>

        {loadingPermissions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {permissions.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Aucune permission disponible
                </p>
              ) : (
                permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-start space-x-3 space-y-0"
                  >
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() =>
                        handleTogglePermission(permission.id)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {permission.key}
                      </Label>
                      {permission.description && (
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingPermissions}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
