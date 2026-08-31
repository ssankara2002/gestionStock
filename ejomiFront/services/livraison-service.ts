import apiClient from "./api-client"
import type {
  Livraison,
  LivraisonCreateData,
  LivraisonUpdateData,
  LivraisonStatistics,
  LivraisonStatut
} from "../types/livraison"

export const livraisonService = {
  // Récupérer toutes les livraisons
  getAll: () => apiClient.get<Livraison[]>("/livraisons"),

  // Récupérer une livraison par ID
  getById: (id: number) => apiClient.get<Livraison>(`/livraisons/${id}`),

  // Créer une nouvelle livraison
  create: (data: LivraisonCreateData) =>
    apiClient.post<Livraison>("/livraisons", data),

  // Mettre à jour une livraison
  update: (id: number, data: LivraisonUpdateData) =>
    apiClient.put<Livraison>(`/livraisons/${id}`, data),

  // Supprimer une livraison
  delete: (id: number) => apiClient.delete(`/livraisons/${id}`),

  // Récupérer les livraisons par commande
  getByCommande: (commandeId: number) =>
    apiClient.get<Livraison[]>(`/livraisons/commande/${commandeId}`),

  // Récupérer les livraisons par livreur
  getByLivreur: (livreurId: number) =>
    apiClient.get<Livraison[]>(`/livraisons/livreur/${livreurId}`),

  // Récupérer les livraisons par statut
  getByStatut: (statut: LivraisonStatut) =>
    apiClient.get<Livraison[]>(`/livraisons/statut/${statut}`),

  // Récupérer les statistiques
  getStatistics: () =>
    apiClient.get<LivraisonStatistics>("/livraisons/statistics"),

  // Assigner un livreur
  assignLivreur: (id: number, livreurId: number) =>
    apiClient.patch<Livraison>(`/livraisons/${id}/assign`, { livreurId }),

  // Mettre à jour le statut
  updateStatut: (id: number, statut: LivraisonStatut) =>
    apiClient.patch<Livraison>(`/livraisons/${id}/statut`, { statut }),
}

export default livraisonService
