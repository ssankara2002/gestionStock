import apiClient from "./api-client"
import type { Paiement, PaiementCreateData, PaiementUpdateData } from "../types"

export const paiementsService = {
  getAll: () => apiClient.get<Paiement[]>("/paiements"),

  getById: (id: string) => apiClient.get<Paiement>(`/paiements/${id}`),

  create: (data: PaiementCreateData) => apiClient.post<Paiement>("/paiements", data),

  update: (id: string, data: PaiementUpdateData) => apiClient.put<Paiement>(`/paiements/${id}`, data),

  delete: (id: string) => apiClient.delete(`/paiements/${id}`),

  getRecu: (id: string) => apiClient.get(`/paiements/${id}/recu`),
  getRecuMarche: (id: string) => apiClient.get(`/paiements/${id}/recu-marche`),
  getByParticipantId: (participantId: string) => apiClient.get<Paiement[]>(`/participants/${participantId}/paiements`),

  getByMarcheId: (marcheId: string) => apiClient.get<Paiement[]>(`/marches/${marcheId}/paiements`),

  getByRealisationId: (realisationId: string) => apiClient.get<Paiement[]>(`/realisations/${realisationId}/paiements`),

  // Nouveaux endpoints pour solde et paiements partiels
  getSoldeByCommande: (commandeId: string) => apiClient.get<{ success: boolean; data: any }>(`/paiements/commande/${commandeId}/solde`),
  createPaiementPartiel: (payload: { commandeId: number | string; montant: number; modePaiement?: string }) => apiClient.post(`/paiements`, payload),

  // Télécharger le reçu de paiement en PDF A5
  downloadRecuPaiement: (id: string) => {
    return apiClient.get(`/paiements/${id}/download-recu`, {
      responseType: 'blob'
    })
  },
}
