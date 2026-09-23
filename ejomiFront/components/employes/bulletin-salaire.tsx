"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { SalairePaiement } from "@/types"

interface Entreprise {
  nom?: string
  adresse?: string
  tel?: string
  email?: string
}

interface BulletinSalaireProps {
  paiement: SalairePaiement
  employeNom: string
  employePrenom: string
  entreprise?: Entreprise
}

export function BulletinSalaire({ paiement, employeNom, employePrenom, entreprise }: BulletinSalaireProps) {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-12 mx-auto shadow-lg print:shadow-none">
      {/* En-tête */}
      <div className="border-b-2 border-gray-800 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">BULLETIN DE PAIE</h1>
        <p className="text-center text-gray-600">
          Période: {format(new Date(paiement.datePaiement), "MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* Informations entreprise et employé */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-bold text-lg mb-3 border-b border-gray-300 pb-2">EMPLOYEUR</h2>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{entreprise?.nom || "—"}</p>
            {entreprise?.adresse && <p>{entreprise.adresse}</p>}
            {entreprise?.tel && <p>Tél: {entreprise.tel}</p>}
            {entreprise?.email && <p>{entreprise.email}</p>}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg mb-3 border-b border-gray-300 pb-2">EMPLOYÉ</h2>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">
              {employePrenom} {employeNom}
            </p>
            <p>Matricule: EMP-{paiement.employeId.toString().padStart(4, "0")}</p>
            <p>Date de paiement: {format(new Date(paiement.datePaiement), "dd MMMM yyyy", { locale: fr })}</p>
          </div>
        </div>
      </div>

      {/* Détails du salaire */}
      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">DÉTAILS DE LA RÉMUNÉRATION</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 border border-gray-300">Libellé</th>
              <th className="text-right p-3 border border-gray-300">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-gray-300">Salaire de base</td>
              <td className="text-right p-3 border border-gray-300">
                {(Number(paiement.montant) - Number(paiement.avantage ?? 0) - Number(paiement.indemnite ?? 0)).toLocaleString()} FCFA
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-3 border border-gray-300">Avantages</td>
              <td className="text-right p-3 border border-gray-300">{Number(paiement.avantage ?? 0).toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-300">Indemnités</td>
              <td className="text-right p-3 border border-gray-300">{Number(paiement.indemnite ?? 0).toLocaleString()} FCFA</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-3 border border-gray-300 font-semibold">NET À PAYER</td>
              <td className="text-right p-3 border border-gray-300 font-semibold">
                {Number(paiement.montant).toLocaleString()} FCFA
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net à payer */}
      <div className="bg-gray-800 text-white p-6 rounded-lg mb-8">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold">NET À PAYER</span>
          <span className="text-3xl font-bold">{Number(paiement.montant).toLocaleString()} FCFA</span>
        </div>
        <p className="text-sm mt-2 text-gray-300">Mode de paiement: {paiement.modePaiement}</p>
      </div>

      {/* Pied de page */}
      <div className="text-xs text-gray-600 text-center border-t border-gray-300 pt-4">
        <p>Ce bulletin de paie est conforme à la législation en vigueur.</p>
        <p className="mt-1">Document généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
      </div>
    </div>
  )
}
