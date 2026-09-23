import apiClient from "./api-client"
import type { Plat } from "@/types/plat"

export const platService = {
  getAll: (page = 1, limit = 100) => {
    const entrepriseId = typeof window !== "undefined" ? localStorage.getItem("entrepriseId") : null
    const params: Record<string, any> = { page, limit }
    if (entrepriseId) params.entrepriseId = parseInt(entrepriseId)
    return apiClient.get<{ success: boolean; data: { data: Plat[]; total: number; page: number; totalPages: number; limit: number } }>("/plats", { params })
  },
  getById: (id: string) => apiClient.get<{ success: boolean; data: Plat }>(`/plats/${id}`),
  create: (data: FormData) => apiClient.post<{ success: boolean; data: Plat }>("/plats", data),
  update: (id: string, data: FormData) => apiClient.put<{ success: boolean; data: Plat }>(`/plats/${id}`, data),
  delete: (id: string) => apiClient.delete(`/plats/${id}`),
}
