import type { Produit } from "./produit"

export interface LigneCommande {
  id: number
  quantiteCommande: number
  montant: number
  commandeId: number
  produitId: number
  produitId?: number
  platId?: number
  produit?: Produit
  plat?: { id: number; libelle: string; description?: string; prixVenteUnitaire: number }
  produitId?: number
  platId?: number
}

export interface LigneCommandeCreateData {
  quantiteCommande: number
  montant: number
  commandeId: number
  produitId: number
}

export interface LigneCommandeUpdateData extends Partial<LigneCommandeCreateData> {}
