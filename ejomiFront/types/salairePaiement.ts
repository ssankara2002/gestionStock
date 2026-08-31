// import { Employe } from "./employe" // Éviter la dépendance circulaire

export interface SalairePaiement {
  id: string | number
  montant: number
  datePaiement: string
  modePaiement: string
  periode?: string
  employeId: string | number
  employe?: any
  avantage: number
  indemnite: number
}

export interface SalairePaiementCreateData {
  montant: number
  datePaiement: string
  modePaiement: string
  periode?: string
  employeId: string | number
  avantage?: number
  indemnite?: number
}

export interface SalairePaiementUpdateData extends Partial<SalairePaiementCreateData> {}

export interface CreateSalairePaiementDto {
  employeId: number
  montant: number
  avantage?: number
  indemnite?: number
  datePaiement: string
  modePaiement: string
  periode?: string
}
