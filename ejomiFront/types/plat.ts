export interface Plat {
  id: number
  libelle: string
  description?: string | null
  image?: string | null
  prixVenteUnitaire: number
  stockPlat?: number
  entrepriseId?: number | null
  createdAt?: string
  updatedAt?: string
}
