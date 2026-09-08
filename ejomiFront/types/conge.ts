import type { Employe } from "./employe"

export type CongeStatut = "EN_ATTENTE" | "APPROUVE" | "REFUSE"

export interface Conge {
  id: string
  employeId: string
  employe?: Employe
  type: string // payé, sans solde, maladie...
  dateDebut: string
  dateFin: string
  statut: CongeStatut
  description: string
}

export interface CongeCreateData {
  employeId?: number
  type: string
  dateDebut: string
  dateFin: string
  description: string
  statut: CongeStatut
}

export interface CongeUpdateData extends Partial<CongeCreateData> {}
