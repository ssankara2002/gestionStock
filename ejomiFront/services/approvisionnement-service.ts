import apiClient from './api-client'
import type { Approvisionnement, ApprovisionnementCreateData, ApprovisionnementUpdateData } from '@/types/approvisionnement'

export const approvisionnementService = {
  // Récupérer tous les approvisionnements
  getAll: async (page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await apiClient.get<any>(`/approvisionnements${query}`)
    return response
  },

  // Récupérer un approvisionnement par ID
  getById: async (id: number) => {
    const response = await apiClient.get<{ data: Approvisionnement }>(`/approvisionnements/${id}`)
    return response
  },

  // Créer un nouvel approvisionnement
  create: async (data: ApprovisionnementCreateData) => {
    const response = await apiClient.post<{ data: Approvisionnement }>('/approvisionnements', data)
    return response
  },

  // Mettre à jour un approvisionnement
  update: async (id: number, data: ApprovisionnementUpdateData) => {
    const response = await apiClient.put<{ data: Approvisionnement }>(`/approvisionnements/${id}`, data)
    return response
  },

  // Supprimer un approvisionnement
  delete: async (id: number) => {
    const response = await apiClient.delete(`/approvisionnements/${id}`)
    return response
  },

  // Récupérer les approvisionnements par fournisseur
  getByFournisseur: async (fournisseurId: number) => {
    const response = await apiClient.get<{ data: Approvisionnement[] }>(`/approvisionnements/fournisseur/${fournisseurId}`)
    return response
  },

  // Récupérer les approvisionnements par fournisseur avec pagination
  getApprovisionnementsByFournisseur: async (fournisseurId: number, page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await apiClient.get<any>(`/approvisionnements/fournisseur/${fournisseurId}${query}`)
    return response
  },

  // Récupérer les approvisionnements par employé
  getByEmploye: async (employeId: number) => {
    const response = await apiClient.get<{ data: Approvisionnement[] }>(`/approvisionnements/employe/${employeId}`)
    return response
  },

  // Récupérer les statistiques des approvisionnements
  getStatistics: async () => {
    const response = await apiClient.get('/approvisionnements/statistics')
    return response
  },
}
