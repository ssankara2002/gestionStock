"use client"

import { useAuth } from "@/context/auth-provider"
import { usePermissions } from "@/hooks/usePermissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugPermissionsPage() {
  const { user } = useAuth()
  const { hasPermission, getUserPermissions, userRole, isAdmin } = usePermissions()

  const allPermissions = getUserPermissions()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Permissions</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Nom:</strong> {user?.prenom} {user?.nom}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Rôle:</strong> <Badge>{user?.role?.name || "Aucun"}</Badge></p>
            <p><strong>Est Admin:</strong> {isAdmin() ? "Oui" : "Non"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions de l'utilisateur ({allPermissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allPermissions.map((perm) => (
                <Badge key={perm} variant="outline">
                  {perm}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tests de permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>inventaire.read</span>
              <Badge variant={hasPermission("inventaire.read") ? "default" : "destructive"}>
                {hasPermission("inventaire.read") ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>inventaire.create</span>
              <Badge variant={hasPermission("inventaire.create") ? "default" : "destructive"}>
                {hasPermission("inventaire.create") ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>inventaire.update</span>
              <Badge variant={hasPermission("inventaire.update") ? "default" : "destructive"}>
                {hasPermission("inventaire.update") ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>commande.read</span>
              <Badge variant={hasPermission("commande.read") ? "default" : "destructive"}>
                {hasPermission("commande.read") ? "✓" : "✗"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objet user complet</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 p-4 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
