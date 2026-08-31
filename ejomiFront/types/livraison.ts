import type { Commande } from "./commande"
import type { Employe } from "./employe"

export type LivraisonStatut = "EN_ATTENTE" | "EN_COURS" | "LIVREE" | "ECHEC"

export interface Livraison {
  id: number
  dateLivraison: string
  statut: LivraisonStatut
  adresse: string
  commandeId: number
  commande?: Commande
  livreurId?: number
  livreur?: Employe
}

export interface LivraisonCreateData {
  dateLivraison?: string
  statut?: LivraisonStatut
  adresse: string
  commandeId: number
  livreurId?: number
}

export interface LivraisonUpdateData extends Partial<LivraisonCreateData> {}

export interface LivraisonStatistics {
  total: number
  byStatut: Array<{
    statut: LivraisonStatut
    _count: {
      id: number
    }
  }>
  byLivreur: Array<{
    livreurId: number | null
    _count: {
      id: number
    }
  }>
}
