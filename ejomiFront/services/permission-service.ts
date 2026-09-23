import apiClient from "./api-client"
import type { Permission, PermissionCreateData, PermissionUpdateData, ApiResponse } from "../types"

export const permissionsService = {
  getAll: (entrepriseId?: number | null) => {
    if (entrepriseId === undefined || entrepriseId === null) {
      return apiClient.get<ApiResponse<Permission[]>>("/permissions")
    }

    return apiClient.get<ApiResponse<Permission[]>>("/permissions", {
      params: { entrepriseId },
    })
  },

  getById: (id: string) => apiClient.get<ApiResponse<Permission>>(`/permissions/${id}`),

  create: (data: PermissionCreateData) => apiClient.post<ApiResponse<Permission>>("/permissions", data),

  update: (id: string, data: PermissionUpdateData) => apiClient.put<ApiResponse<Permission>>(`/permissions/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/permissions/${id}`),
}
