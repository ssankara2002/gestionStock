import apiClient from "./api-client"
import type { Employe, EmployeCreateData, EmployeUpdateData, EmployeWithUserCreateData, EmployeWithUserUpdateData, ApiResponse } from "../types"

export const employesService = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get<any>(`/employes${query}`)
  },

  getById: (id: string) => apiClient.get<ApiResponse<Employe>>(`/employes/${id}`),

  create: (data: EmployeCreateData) => apiClient.post<ApiResponse<Employe>>("/employes", data),

  // Créer un employé avec les informations utilisateur
  createWithUser: (data: EmployeWithUserCreateData) => apiClient.post<ApiResponse<Employe>>("/employes/with-user", data),

  update: (id: string, data: EmployeUpdateData) => apiClient.put<ApiResponse<Employe>>(`/employes/${id}`, data),

  // Mettre à jour un employé avec les informations utilisateur
  updateWithUser: (id: string, data: EmployeWithUserUpdateData) => apiClient.put<ApiResponse<Employe>>(`/employes/${id}/with-user`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/employes/${id}`),

  // Ajout pour upload de fichier (rapport)
  updateWithFile: (id: string, formData: FormData) =>
    apiClient.put(`/employes/${id}`, formData, {
      headers: { 'Content-Type': undefined }, // Laisser axios gérer le boundary
    }),
}
