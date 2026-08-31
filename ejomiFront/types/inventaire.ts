import { Produit } from './produit'
import { Employe } from './employe'

export interface AjustementStock {
  produitId: number
  quantiteTheorique: number
  quantitePhysique: number
  ecart: number
  commentaire?: string
}

export interface InventaireInput {
  employeId: number
  ajustements: AjustementStock[]
}

export interface HistoriqueInventaire {
  id: number
  dateInventaire: string
  employeId: number
  produitId: number
  quantiteTheorique: number
  quantitePhysique: number
  ecart: number
  commentaire?: string
  produit?: Produit
  employe?: Employe
}

export interface StatistiqueInventaire {
  produit: Produit | null
  nombreInventaires: number
  ecartTotal: number
}

export interface ProduitInventaire {
  id: number
  libelle: string
  quantiteStock: number
  prixDeVenteUnitaire: string
  prixAchatUnitaire: number
}
