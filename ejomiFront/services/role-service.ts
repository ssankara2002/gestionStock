import apiClient from "./api-client"
import type { Role, RoleCreateData, RoleUpdateData, ApiResponse } from "../types"

export const rolesService = {
  getAll: () => apiClient.get<ApiResponse<Role[]>>("/roles"),

  getById: (id: string) => apiClient.get<ApiResponse<Role>>(`/roles/${id}`),

  create: (data: RoleCreateData) => apiClient.post<ApiResponse<Role>>("/roles", data),

  update: (id: string, data: RoleUpdateData) => apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/roles/${id}`),

  assignPermissions: (id: string, permissionIds: number[]) =>
    apiClient.post<ApiResponse<Role>>(`/roles/${id}/permissions`, { permissionIds }),
}