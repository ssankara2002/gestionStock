import apiClient from "./api-client"

export const entrepriseService = {
  getById: (id: number) => apiClient.get(`/entreprise/${id}`),
  update: (id: number, data: any) => apiClient.put(`/entreprise/${id}`, data),
}
