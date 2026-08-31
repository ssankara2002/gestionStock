"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, PenLine, Trash2, Calendar, DollarSign, UserX } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import { employesService } from "@/services"
import type { Employe } from "@/types"
import { ListeAbsences } from "@/components/employes/liste-absences"
import { ListeConges } from "@/components/employes/liste-conges"
import { ListeSalaires } from "@/components/employes/liste-salaires"
import { PermissionGuard } from "@/components/permissions"

export default function EmployeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [employe, setEmploye] = useState<Employe | null>(null)
  const [activeTab, setActiveTab] = useState("informations")
  const resolvedParams = use(params)

  useEffect(() => {
    const fetchEmploye = async () => {
      try {
        setLoading(true)
        const response = await employesService.getById(resolvedParams.id)
        setEmploye(response.data.data)
      } catch (err) {
        console.error("Erreur lors du chargement de l'employé:", err)
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement de l'employé",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEmploye()
  }, [resolvedParams.id])

  const handleDelete = async () => {
    try {
      await employesService.delete(resolvedParams.id)
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès",
      })
      router.push("/gerant/employes")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'employé",
        variant: "destructive",
      })
    }
  }

  if (loading) return <div className="flex justify-center p-8">Chargement...</div>

  if (!employe) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Employé non trouvé</h1>
        <Button asChild>
          <Link href="/gerant/employes">Retour à la liste</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/gerant/employes">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Détails de l'employé</h1>
            </div>
            <div className="flex items-center gap-2">
            <PermissionGuard permissions={["employe.delete"]} >              
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </PermissionGuard>
            <PermissionGuard permissions={["employe.update"]} >              
                <Button asChild>
                  <Link href={`/gerant/employes/${resolvedParams.id}/modifier`}>
                    <PenLine className="h-4 w-4 mr-2" />
                    Modifier
                  </Link>
                </Button>
          
            </PermissionGuard>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
           
            <TabsContent value="informations" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Informations personnelles</CardTitle>
                    <CardDescription>Détails de l'employé</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Nom complet</h3>
                        <p className="mt-1 text-base">
                          {employe.user ? `${employe.user.prenom} ${employe.user.nom}` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                        <p className="mt-1 text-base">{employe.user?.email || "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Téléphone</h3>
                        <p className="mt-1 text-base">{employe.user?.tel || "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
                        <p className="mt-1 text-base">{employe.user?.adresse || "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Salaire</h3>
                        <p className="mt-1 text-base">{employe.salaire.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Date d'embauche</h3>
                        <p className="mt-1 text-base">
                          {format(new Date(employe.dateEmbauche), "PPP", { locale: fr })}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Rôle</h3>
                        <p className="mt-1 text-base">
                          {employe.user?.role?.name || "Aucun rôle assigné"}
                          {employe.user?.role?.description && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({employe.user.role.description})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>Dernières actions de l'employé</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-l-2 border-muted pl-4 py-2">
                        <p className="text-sm text-muted-foreground">Aujourd'hui à 10:30</p>
                        <p className="mt-1">A traité la commande #CMD-123</p>
                      </div>
                      <div className="border-l-2 border-muted pl-4 py-2">
                        <p className="text-sm text-muted-foreground">Hier à 15:45</p>
                        <p className="mt-1">A ajouté un nouveau client</p>
                      </div>
                      <div className="border-l-2 border-muted pl-4 py-2">
                        <p className="text-sm text-muted-foreground">12/05/2025 à 09:15</p>
                        <p className="mt-1">A modifié le stock du produit #P-456</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="absences">
              <ListeAbsences employeId={Number.parseInt(resolvedParams.id)} />
            </TabsContent>

            <TabsContent value="conges">
              <ListeConges employeId={Number.parseInt(resolvedParams.id)} />
            </TabsContent>

            <TabsContent value="salaires">
              <ListeSalaires employeId={Number.parseInt(resolvedParams.id)} employeSalaire={employe.salaire} />
            </TabsContent>
          </Tabs>

          <DeleteConfirmationDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDelete}
            title="Supprimer l'employé"
            description="Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible."
            entityName="L'employé"
          />
        </div>
      </main>
    </div>
  )
}
