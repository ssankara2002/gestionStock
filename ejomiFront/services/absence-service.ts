import apiClient from "./api-client"
import type { Absence, AbsenceCreateData, AbsenceUpdateData } from "../types/absence"

interface AbsenceListResponse {
  data: Absence[]
  page: number
  totalPages: number
  total: number
  limit: number
}

export const absenceService = {
  getAll: (params?: Record<string, any>) => apiClient.get<AbsenceListResponse>("/absences", { params }),

  getById: (id: string | number) => apiClient.get<{ success: boolean; data: Absence }>(`/absences/${id}`),

  getByEmployeId: (employeId: string | number) => apiClient.get<AbsenceListResponse>(`/absences/employe/${employeId}`),

  create: (data: AbsenceCreateData) => apiClient.post<{ success: boolean; data: Absence }>("/absences", data),

  update: (id: string | number, data: AbsenceUpdateData) => apiClient.put<{ success: boolean; data: Absence }>(`/absences/${id}`, data),

  delete: (id: string | number) => apiClient.delete(`/absences/${id}`),
}
