"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, Mail, MailOpen, Archive, Trash2, CheckCircle, Clock, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { contactService } from "@/services/contact-service"
import type { Contact, ContactStatut } from "@/types/contact"
import { DataPagination, type PaginationInfo } from "@/components/shared/data-pagination"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PermissionGuard } from "@/components/permissions/PermissionGuard"
import { usePermissions } from "@/hooks/usePermissions"

export default function ContactsAdminPage() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [filterStatut, setFilterStatut] = useState<ContactStatut | "TOUS">("TOUS")
  const { hasPermission } = usePermissions()

  // Charger les contacts
  const loadContacts = async () => {
    setLoading(true)
    try {
      if (filterStatut === "TOUS") {
        const response = await contactService.getAll(currentPage, 10)
        const responseData = response.data

        setContacts(responseData.data || [])
        setPagination({
          page: responseData.page || currentPage,
          totalPages: responseData.totalPages || 1,
          total: responseData.total || 0,
          limit: 10,
          hasNext: (responseData.page || currentPage) < (responseData.totalPages || 1),
          hasPrev: (responseData.page || currentPage) > 1,
        })
      } else {
        const response = await contactService.getByStatut(filterStatut)
        setContacts(response.data?.data || response.data || [])
        setPagination(null) // Pas de pagination pour les filtres
      }
    } catch (error: any) {
      console.error("Erreur chargement contacts:", error)
      toast({
        title: "Erreur de chargement",
        description: error.response?.data?.message || "Impossible de charger les contacts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [currentPage, filterStatut])

  // Mettre à jour le statut d'un contact
  const handleUpdateStatut = async (id: number, statut: ContactStatut) => {
    try {
      await contactService.update(id, { statut })
      toast({
        title: "Statut mis à jour",
        description: "Le statut du message a été modifié",
      })
      loadContacts()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
    }
  }

  // Supprimer un contact
  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return

    try {
      await contactService.delete(id)
      setContacts(contacts.filter((c) => c.id !== id))
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      })
    }
  }

  // Obtenir le badge de statut
  const getStatutBadge = (statut: ContactStatut) => {
    switch (statut) {
      case "NON_LU":
        return (
          <Badge variant="destructive" className="gap-1">
            <Mail className="h-3 w-3" />
            Non lu
          </Badge>
        )
      case "LU":
        return (
          <Badge variant="secondary" className="gap-1">
            <MailOpen className="h-3 w-3" />
            Lu
          </Badge>
        )
      case "TRAITE":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Traité
          </Badge>
        )
      case "ARCHIVE":
        return (
          <Badge variant="outline" className="gap-1">
            <Archive className="h-3 w-3" />
            Archivé
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages de contact</h1>
            <p className="text-muted-foreground">
              Gérez les messages envoyés par les visiteurs
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrer: {filterStatut === "TOUS" ? "Tous" : filterStatut.replace("_", " ")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatut("TOUS")}>
                Tous les messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatut("NON_LU")}>
                <Mail className="mr-2 h-4 w-4" />
                Non lus
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatut("LU")}>
                <MailOpen className="mr-2 h-4 w-4" />
                Lus
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatut("TRAITE")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Traités
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatut("ARCHIVE")}>
                <Archive className="mr-2 h-4 w-4" />
                Archivés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des messages</CardTitle>
            <CardDescription>
              {contacts.length} message(s) {filterStatut !== "TOUS" && `(${filterStatut})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun message trouvé
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>{getStatutBadge(contact.statut)}</TableCell>
                        <TableCell className="font-medium">{contact.nom}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell className="max-w-xs truncate">{contact.sujet}</TableCell>
                        <TableCell>
                          {format(new Date(contact.dateEnvoi), "Pp", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasPermission("contact.read") && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/gerant/contacts/${contact.id}`}>
                                  <Eye className="mr-1 h-3.5 w-3.5" />
                                  Voir
                                </Link>
                              </Button>
                            )}
                            {contact.statut !== "LU" && hasPermission("contact.update") && (
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatut(contact.id, "LU")}>
                                <MailOpen className="mr-1 h-3.5 w-3.5" />
                                Lu
                              </Button>
                            )}
                            {contact.statut !== "TRAITE" && hasPermission("contact.update") && (
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatut(contact.id, "TRAITE")}>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Traité
                              </Button>
                            )}
                            {contact.statut !== "ARCHIVE" && hasPermission("contact.update") && (
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatut(contact.id, "ARCHIVE")}>
                                <Archive className="mr-1 h-3.5 w-3.5" />
                                Archiver
                              </Button>
                            )}
                            {hasPermission("contact.delete") && (
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(contact.id)}>
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pagination && filterStatut === "TOUS" && (
                  <div className="mt-4">
                    <DataPagination
                      pagination={pagination}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
