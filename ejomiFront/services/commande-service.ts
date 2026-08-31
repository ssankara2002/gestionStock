import apiClient from "./api-client"
import type { Commande, CommandeCreateData, CommandeUpdateData } from "../types"

export const commandesService = {
  // Récupérer toutes les commandes
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get<any>(`/commandes${query}`)
  },

  // Récupérer une commande par ID
  getById: (id: string) => apiClient.get<Commande>(`/commandes/${id}`),

  // Créer une nouvelle commande
  create: (data: CommandeCreateData) => apiClient.post<Commande>("/commandes", data),

  // Mettre à jour une commande
  update: (id: string, data: CommandeUpdateData) => apiClient.put<Commande>(`/commandes/${id}`, data),

  // Supprimer une commande
  delete: (id: string) => apiClient.delete(`/commandes/${id}`),

  // Récupérer les commandes par client
  getByClient: (clientId: string) => apiClient.get<Commande[]>(`/commandes/client/${clientId}`),

  // Récupérer les commandes par vendeur
  getByVendeur: (vendeurId: string) => apiClient.get<Commande[]>(`/commandes/vendeur/${vendeurId}`),

  // Récupérer les statistiques des commandes
  getStatistics: () => apiClient.get<{
    totalCommandes: number;
    totalMontant: number;
    commandesParMois: Array<{ mois: string; count: number; montant: number }>;
    commandesParStatut: Array<{ statut: string; count: number }>;
    commandesRecentes: Commande[];
  }>("/commandes/statistics")
}