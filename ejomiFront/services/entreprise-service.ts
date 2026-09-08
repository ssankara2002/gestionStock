import apiClient from "./api-client"

export const entrepriseService = {
  getAll: () => apiClient.get(`/entreprise`),
  getById: (id: number) => apiClient.get(`/entreprise/${id}`),
  create: (data: { entreprise: any; admin: any }) => apiClient.post(`/entreprise`, data),
  update: (id: number, data: any) => apiClient.put(`/entreprise/${id}`, data),
  delete: (id: number) => apiClient.delete(`/entreprise/${id}`),
}
