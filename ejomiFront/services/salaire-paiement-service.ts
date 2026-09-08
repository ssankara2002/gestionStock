import apiClient from "./api-client"
import type { SalairePaiement, SalairePaiementCreateData, SalairePaiementUpdateData, CreateSalairePaiementDto } from "../types/salairePaiement"

export const salairePaiementService = {
  getAll: () => apiClient.get<{ success: boolean; data: SalairePaiement[] }>("/salaire-paiements"),

  getById: (id: string | number) => apiClient.get<{ success: boolean; data: SalairePaiement }>(`/salaire-paiements/${id}`),

  getByEmployeId: (employeId: string | number) =>
    apiClient.get<{ success: boolean; data: SalairePaiement[] }>(`/salaire-paiements/employe/${employeId}`),

  create: (data: SalairePaiementCreateData | CreateSalairePaiementDto) => apiClient.post<{ success: boolean; data: SalairePaiement }>("/salaire-paiements", data),

  update: (id: string | number, data: SalairePaiementUpdateData) =>
    apiClient.put<{ success: boolean; data: SalairePaiement }>(`/salaire-paiements/${id}`, data),

  delete: (id: string | number) => apiClient.delete(`/salaire-paiements/${id}`),

  // Ancien endpoint (peut-être à supprimer si inutilisé)
  getBulletinPaie: (id: string | number) =>
    apiClient.get(`/salaire-paiements/${id}/bulletin`, { responseType: "blob" }),

  // Nouveau endpoint pour télécharger le bulletin de paie PDF A5
  downloadBulletinPaie: (id: string | number) =>
    apiClient.get(`/salaire-paiements/${id}/download-bulletin`, { responseType: "blob" }),

  getByMoisAnnee: (employeId: string | number, mois: number, annee: number) =>
    apiClient.get<SalairePaiement>(`/salaire-paiements/employe/${employeId}/mois/${mois}/annee/${annee}`),
}
