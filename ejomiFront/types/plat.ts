export type CategoriePlat = 'LIQUIDE' | 'SNACK' | 'REPAS'

export interface Plat {
  id: number
  libelle: string
  description?: string | null
  image?: string | null
  prixVenteUnitaire: number
  categorie?: CategoriePlat | null
  stockPlat?: number
  entrepriseId?: number | null
  createdAt?: string
  updatedAt?: string
}
