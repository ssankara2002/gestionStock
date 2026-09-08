import apiClient from './api-client'
import type { TransfertStock, TransfertCreateData } from '@/types/transfert'

export const transfertService = {
  getAll: async (page = 1, limit = 20) => {
    return apiClient.get<{ data: { data: TransfertStock[]; total: number; totalPages: number } }>(
      `/transferts?page=${page}&limit=${limit}`
    )
  },

  getById: async (id: number) => {
    return apiClient.get<{ data: TransfertStock }>(`/transferts/${id}`)
  },

  create: async (data: TransfertCreateData) => {
    return apiClient.post<{ data: TransfertStock }>('/transferts', data)
  },

  createBulk: async (data: { lignes: { produitId: number; quantite: number }[]; sens: string; motif?: string }) => {
    return apiClient.post<{ data: TransfertStock[] }>('/transferts/bulk', data)
  },
}
