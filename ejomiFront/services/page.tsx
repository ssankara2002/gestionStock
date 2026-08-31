"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { approvisionnementMatierePremiereService } from "@/services/approvisionnement-matiere-premiere-service"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface Approvisionnement {
  id: number;
  dateApprovisionnement: string;
  montant: number;
  fournisseur: { nom: string; prenom: string };
  employe: { user: { nom: string; prenom: string } };
  lignes: { quantite: number }[];
}

export default function ApprovisionnementsMPPage() {
  const { toast } = useToast()
  const [approvisionnements, setApprovisionnements] = useState<Approvisionnement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  useEffect(() => {
    const loadData = async (page = 1) => {
      setLoading(true)
      try {
        const data = await approvisionnementMatierePremiereService.getAll(page)
        setApprovisionnements(data.data)
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalItems: data.totalItems,
        })
      } catch (error: any) {
        toast({
          title: "Erreur de chargement",
          description: error.response?.data?.message || "Impossible de charger les approvisionnements.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData(pagination.currentPage)
  }, [pagination.currentPage, toast])

  const filteredData = approvisionnements.filter(
    (item) =>
      item.fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fournisseur.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approvisionnements de Matières Premières</CardTitle>
              <CardDescription>
                Historique des entrées en stock des matières premières.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/magasinier/matieres-premieres/approvisionner">
                <Plus className="mr-2 h-4 w-4" />
                Nouvel Approvisionnement
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par fournisseur..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead className="text-right">Nb. Articles</TableHead>
                    <TableHead className="text-right">Montant Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.dateApprovisionnement).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-medium">{`${item.fournisseur.prenom} ${item.fournisseur.nom}`}</TableCell>
                      <TableCell>{`${item.employe.user.prenom} ${item.employe.user.nom}`}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">{item.lignes.reduce((sum, l) => sum + l.quantite, 0)}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{item.montant.toFixed(2)} FCFA</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (pagination.currentPage > 1) handlePageChange(pagination.currentPage - 1); }} />
              </PaginationItem>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={pagination.currentPage === i + 1} onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>{i + 1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (pagination.currentPage < pagination.totalPages) handlePageChange(pagination.currentPage + 1); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  )
}