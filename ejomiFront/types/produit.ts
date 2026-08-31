export interface StockMagasin {
  id: number
  produitId: number
  quantite: number
  seuilAlerte: number
  updatedAt: string
}

export interface StockBoutique {
  id: number
  produitId: number
  quantite: number
  seuilAlerte: number
  updatedAt: string
}

export interface Produit {
  id: number
  libelle: string
  image?: string
  description?: string
  prixDeVenteUnitaire: number
  prixAchatUnitaire: number
  stockMagasin?: StockMagasin
  stockBoutique?: StockBoutique
  createdAt?: string
  updatedAt?: string
}

export interface ProduitCreateData {
  libelle: string
  image?: string
  description?: string
  prixDeVenteUnitaire: string
  prixAchatUnitaire: number
}

export interface ProduitUpdateData extends Partial<ProduitCreateData> {}