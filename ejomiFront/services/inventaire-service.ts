import apiClient from "./api-client"
import type { InventaireInput } from "../types/inventaire"

export const inventaireService = {
  // Récupérer la liste des produits pour l'inventaire
  getProduits: (lieu?: "MAGASIN" | "BOUTIQUE") =>
    apiClient.get("/inventaire/produits", { params: lieu ? { lieu } : undefined }),

  // Effectuer un inventaire et ajuster les stocks
  ajusterStock: (data: InventaireInput & { lieu?: string }) =>
    apiClient.post("/inventaire/ajuster", data),

  // Récupérer l'historique des inventaires avec filtres optionnels
  getHistorique: (params?: {
    produitId?: number
    employeId?: number
    dateDebut?: string
    dateFin?: string
  }) => apiClient.get("/inventaire/historique", { params }),

  // Récupérer les statistiques d'inventaire
  getStatistiques: () => apiClient.get("/inventaire/statistiques"),
}

export default inventaireService
