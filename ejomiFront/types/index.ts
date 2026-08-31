export * from "./auth"
export * from "./employe"
export * from "./paiement"
export * from "./absence"
export * from "./commande"
export * from "./role"
export * from "./permission"
export * from "./user"
export * from "./produit"
export * from "./fournisseur"
export * from "./approvisionnement"
export * from "./livraison"
export * from "./conge"
export * from "./contact"
export * from "./inventaire"
export * from "./production"
export * from "./matierePremiere"
export * from "./transaction"
export * from "./salairePaiement"

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  error?: string
}

export interface ApiError {
  success: false
  message: string
  error?: string
}
