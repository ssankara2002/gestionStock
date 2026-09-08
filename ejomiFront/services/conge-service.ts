import apiClient from "./api-client"
import type { Conge, CongeCreateData, CongeUpdateData } from "../types/conge"

export const congeService = {
  getAll: () => apiClient.get<{ success: boolean; data: Conge[] }>("/conges"),

  getById: (id: string | number) => apiClient.get<{ success: boolean; data: Conge }>(`/conges/${id}`),

  getByEmployeId: (employeId: string | number) => apiClient.get<{ success: boolean; data: Conge[] }>(`/conges/employe/${employeId}`),

  create: (data: CongeCreateData) => apiClient.post<{ success: boolean; data: Conge }>("/conges", data),

  update: (id: string | number, data: CongeUpdateData) => apiClient.put<{ success: boolean; data: Conge }>(`/conges/${id}`, data),

  delete: (id: string | number) => apiClient.delete(`/conges/${id}`),

  approuver: (id: string | number) => apiClient.put<{ success: boolean; data: Conge }>(`/conges/${id}/approuver`, {}),

  refuser: (id: string | number) => apiClient.put<{ success: boolean; data: Conge }>(`/conges/${id}/refuser`, {}),
}
