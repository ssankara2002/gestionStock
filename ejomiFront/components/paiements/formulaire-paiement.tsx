"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppSelect } from "@/components/ui/app-select"
import { paiementsService } from "@/services/paiement-service"
import { ModePaiement, MODES_PAIEMENT_COMMANDE, MODE_PAIEMENT_LABELS } from "@/types/paiement"

export function FormulairePaiement({ commandeId, montantRestant, onPaiementEnregistre }: { commandeId: number; montantRestant?: number; onPaiementEnregistre?: () => void }) {
  const [montant, setMontant] = useState<string>((montantRestant || 0).toString())
  const [mode, setMode] = useState<string>(ModePaiement.ESPECES)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await paiementsService.createPaiementPartiel({ commandeId: commandeId.toString(), montant: Number(montant), modePaiement: mode } as any)
      setMontant("")
      if (onPaiementEnregistre) onPaiementEnregistre()
    } catch (e) {
      console.error(e)
      alert("Erreur en enregistrant le paiement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant payé" />
        <AppSelect
          className="w-40"
          value={{ value: mode, label: MODE_PAIEMENT_LABELS[mode] ?? mode }}
          onChange={(opt: any) => setMode(opt?.value ?? ModePaiement.ESPECES)}
          options={MODES_PAIEMENT_COMMANDE}
        />
      </div>
      <Button onClick={submit} loading={loading}>Enregistrer paiement</Button>
    </div>
  )
}
