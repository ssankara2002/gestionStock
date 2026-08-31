import type { Employe } from "./employe"
import type { LigneCommande } from "./ligneCommande"
import type { Paiement } from "./paiement"
import type { Transaction } from "./transaction"
import { Livraison } from "./livraison"
import { User } from "./user"

export interface LigneCommandeInput {
  produitId: number
  quantite: number
  prixUnitaire: number
  reduction: number
}

export interface Commande {
  id: number
  dateCommande: string
  montant: number
  reduction: number
  statut: string
  clientId: number
  client?: User
  vendeurId?: number
  vendeur?: Employe
  lignes?: LigneCommande[]
  livraisons?: Livraison[]
  paiements?: Paiement[]
  transactions?: Transaction[]
}

export interface CommandeCreateData {
  dateCommande: Date | string
  clientId: number
  vendeurId?: number
  reduction: number
  statut: string
  lignes: LigneCommandeInput[]
  montantPaye?: number
  modePaiement?: string
}

export interface CommandeUpdateData extends Partial<CommandeCreateData> {}
