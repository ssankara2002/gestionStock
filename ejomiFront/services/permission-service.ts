import apiClient from "./api-client"
import type { Permission, PermissionCreateData, PermissionUpdateData, ApiResponse } from "../types"

export const permissionsService = {
  getAll: () => apiClient.get<ApiResponse<Permission[]>>("/permissions"),

  getById: (id: string) => apiClient.get<ApiResponse<Permission>>(`/permissions/${id}`),

  create: (data: PermissionCreateData) => apiClient.post<ApiResponse<Permission>>("/permissions", data),

  update: (id: string, data: PermissionUpdateData) => apiClient.put<ApiResponse<Permission>>(`/permissions/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/permissions/${id}`),
}
