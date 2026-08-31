import { Approvisionnement } from "./approvisionnement"
import { Commande } from "./commande"
import { SalairePaiement } from "./salairePaiement"

export type TransactionType = "DEPENSE" | "RECETTE"

export interface Transaction {
  id: string
  type: TransactionType
  libelle: string
  montant: number
  date: string
  commandeId?: string
  commande?: Commande
  approvisionnementId?: string
  approvisionnement?: Approvisionnement
  salairePaiementId?: string
  salairePaiement?: SalairePaiement
}

export interface TransactionCreateData {
  type: TransactionType
  libelle: string
  montant: number
  date: string
  commandeId?: string
  approvisionnementId?: string
  salairePaiementId?: string
}

export interface TransactionUpdateData extends Partial<TransactionCreateData> {}
