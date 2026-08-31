"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppSelect } from "@/components/ui/app-select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { salairePaiementService } from "@/services/salaire-paiement-service"
import type { CreateSalairePaiementDto } from "@/types/salairePaiement"
import type { Employe } from "@/types"

interface FormulaireSalaireProps {
  employes: Employe[]
  onPaiementCreated: () => void
}

export function FormulaireSalaire({ employes, onPaiementCreated }: FormulaireSalaireProps) {
  const [selectedEmployeId, setSelectedEmployeId] = useState<string>("")
  const [salaireBase, setSalaireBase] = useState<number>(0)
  const [avantage, setAvantage] = useState<number>(0)
  const [indemnite, setIndemnite] = useState<number>(0)
  const [mois, setMois] = useState(new Date().getMonth() + 1)
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [modePaiement, setModePaiement] = useState("ESPECES")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const montantNet = salaireBase + avantage + indemnite

  useEffect(() => {
    if (selectedEmployeId) {
      const employe = employes.find((e) => e.id.toString() === selectedEmployeId)
      if (employe) {
        setSalaireBase(employe.salaire)
      }
    } else {
      setSalaireBase(0)
    }
  }, [selectedEmployeId, employes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployeId) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un employé.", variant: "destructive" })
      return
    }

    if (salaireBase <= 0) {
      toast({
        title: "Erreur",
        description: "Le salaire de base doit être supérieur à 0",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const data: CreateSalairePaiementDto = {
        employeId: Number(selectedEmployeId),
        montant: salaireBase,
        avantage,
        indemnite,
        datePaiement: new Date().toISOString(),
        modePaiement,
        periode: `${annee}-${mois.toString().padStart(2, "0")}-01`,
      }

      await salairePaiementService.create(data)

      toast({
        title: "Succès",
        description: "Le paiement de salaire a été enregistré avec succès",
      })

      onPaiementCreated()
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement du salaire:", error)
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'enregistrer le paiement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employe">Employé</Label>
              <AppSelect
                placeholder="Sélectionner un employé"
                value={selectedEmployeId ? { value: selectedEmployeId, label: employes.find(e => e.id.toString() === selectedEmployeId) ? `${employes.find(e => e.id.toString() === selectedEmployeId)!.user?.prenom} ${employes.find(e => e.id.toString() === selectedEmployeId)!.user?.nom}` : selectedEmployeId } : null}
                onChange={(opt: any) => setSelectedEmployeId(opt?.value ?? "")}
                options={employes.map(e => ({ value: e.id.toString(), label: `${e.user?.prenom} ${e.user?.nom}` }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaireBase">Salaire de base (FCFA)</Label>
              <Input id="salaireBase" type="number" min="0" value={salaireBase} onChange={(e) => setSalaireBase(Number(e.target.value))} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avantage">Avantages (FCFA)</Label>
              <Input id="avantage" type="number" min="0" value={avantage} onChange={(e) => setAvantage(Number(e.target.value))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indemnite">Indemnités (FCFA)</Label>
              <Input id="indemnite" type="number" min="0" value={indemnite} onChange={(e) => setIndemnite(Number(e.target.value))} />
            </div>

            <div className="space-y-2">
              <Label>Net à payer (FCFA)</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 font-semibold text-green-700">
                {montantNet.toLocaleString()} FCFA
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mois">Mois</Label>
              <Input
                id="mois"
                type="number"
                min="1"
                max="12"
                value={mois}
                onChange={(e) => setMois(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                type="number"
                min="2020"
                max="2100"
                value={annee}
                onChange={(e) => setAnnee(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="modePaiement">Mode de Paiement</Label>
              <AppSelect
                value={{ value: modePaiement, label: { ESPECES: "Espèces", VIREMENT: "Virement", MOBILE_MONEY: "Mobile Money" }[modePaiement] ?? modePaiement }}
                onChange={(opt: any) => setModePaiement(opt?.value ?? "ESPECES")}
                options={[
                  { value: "ESPECES", label: "Espèces" },
                  { value: "VIREMENT", label: "Virement" },
                  { value: "MOBILE_MONEY", label: "Mobile Money" },
                ]}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer le paiement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
