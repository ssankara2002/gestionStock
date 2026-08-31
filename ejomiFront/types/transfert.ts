export type SensTransfert = 'MAGASIN_VERS_BOUTIQUE' | 'BOUTIQUE_VERS_MAGASIN'

export interface TransfertStock {
  id: number
  quantite: number
  sens: SensTransfert
  motif?: string
  dateTransfert: string
  produitId: number
  employeId: number
  produit?: { id: number; libelle: string; image?: string }
  employe?: { user: { nom: string; prenom: string } }
  stockMagasin?: { quantite: number }
  stockBoutique?: { quantite: number }
}

export interface TransfertCreateData {
  produitId: number
  quantite: number
  sens: SensTransfert
  motif?: string
}
