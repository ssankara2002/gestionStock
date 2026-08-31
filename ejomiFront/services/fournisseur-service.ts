import apiClient from "./api-client"
import type { Fournisseur, FournisseurCreateData, FournisseurUpdateData } from "../types/fournisseur"

export const fournisseurService = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get<any>(`/fournisseurs${query}`)
  },

  getById: (id: number) => apiClient.get<{ data: Fournisseur }>(`/fournisseurs/${id}`),

  create: (data: FournisseurCreateData) => apiClient.post<{ data: Fournisseur }>("/fournisseurs", data),

  update: (id: number, data: FournisseurUpdateData) => apiClient.put<{ data: Fournisseur }>(`/fournisseurs/${id}`, data),

  delete: (id: number) => apiClient.delete(`/fournisseurs/${id}`),
}

export default fournisseurService