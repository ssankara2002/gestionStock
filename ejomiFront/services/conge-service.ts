import apiClient from "./api-client"
import type { Conge, CongeCreateData, CongeUpdateData } from "../types/conge"

export const congeService = {
  getAll: () => apiClient.get<Conge[]>("/conges"),

  getById: (id: string | number) => apiClient.get<Conge>(`/conges/${id}`),

  getByEmployeId: (employeId: string | number) => apiClient.get<Conge[]>(`/conges/employe/${employeId}`),

  create: (data: CongeCreateData) => apiClient.post<Conge>("/conges", data),

  update: (id: string | number, data: CongeUpdateData) => apiClient.put<Conge>(`/conges/${id}`, data),

  delete: (id: string | number) => apiClient.delete(`/conges/${id}`),

  approuver: (id: string | number) => apiClient.put<Conge>(`/conges/${id}/approuver`, {}),

  refuser: (id: string | number) => apiClient.put<Conge>(`/conges/${id}/refuser`, {}),
}
