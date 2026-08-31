import apiClient from "./api-client"
import type { Absence, AbsenceCreateData, AbsenceUpdateData } from "../types/absence"

export const absenceService = {
  getAll: () => apiClient.get<Absence[]>("/absences"),

  getById: (id: string | number) => apiClient.get<Absence>(`/absences/${id}`),

  create: (data: AbsenceCreateData) => apiClient.post<Absence>("/absences", data),

  update: (id: string | number, data: AbsenceUpdateData) => apiClient.put<Absence>(`/absences/${id}`, data),

  delete: (id: string | number) => apiClient.delete(`/absences/${id}`),
}
