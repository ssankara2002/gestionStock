import type { Produit } from "./produit"
import type { Approvisionnement } from "./approvisionnement"

export interface LigneApprovisionnement {
  id: string
  quantite: number
  montant: number
  dateFabrication?: string
  datePeremption?: string
  produitId: string
  produit?: Produit
  approvisionnementId: string
  approvisionnement?: Approvisionnement
}

export interface LigneApprovisionnementCreateData {
  quantite: number
  montant: number
  dateFabrication?: string
  datePeremption?: string
  produitId: string
  approvisionnementId: string
}

export interface LigneApprovisionnementUpdateData extends Partial<LigneApprovisionnementCreateData> {}
