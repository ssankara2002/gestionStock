import type { Produit } from "./produit"

export interface LigneCommande {
  id: number
  quantiteCommande: number
  montant: number
  commandeId: number
  produitId: number
  produit?: Produit
}

export interface LigneCommandeCreateData {
  quantiteCommande: number
  montant: number
  commandeId: number
  produitId: number
}

export interface LigneCommandeUpdateData extends Partial<LigneCommandeCreateData> {}
