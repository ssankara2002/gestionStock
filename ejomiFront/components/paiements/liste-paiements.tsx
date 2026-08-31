"use client"
import { useEffect, useState } from "react"
import { paiementsService } from "@/services/paiement-service"

export function ListePaiements({ paiements, commande }: { paiements: any[]; commande: any }) {
  if (!paiements || paiements.length === 0) return <p>Aucun paiement enregistré</p>

  return (
    <ul className="space-y-2">
      {paiements.map((p) => (
        <li key={p.id} className="border p-2 rounded">
          <div>Montant: {p.montant}</div>
          <div>Créance: {p.creance}</div>
          <div>Mode: {p.modePaiement}</div>
          <div>Statut: {p.statut}</div>
        </li>
      ))}
    </ul>
  )
}
