import apiClient from "./api-client"
import type { Plat } from "@/types/plat"

export const platService = {
  getAll: () => apiClient.get<{ success: boolean; data: Plat[] }>("/plats"),
  getById: (id: string) => apiClient.get<{ success: boolean; data: Plat }>(`/plats/${id}`),
  create: (data: FormData) => apiClient.post<{ success: boolean; data: Plat }>("/plats", data),
  update: (id: string, data: FormData) => apiClient.put<{ success: boolean; data: Plat }>(`/plats/${id}`, data),
  delete: (id: string) => apiClient.delete(`/plats/${id}`),
}
