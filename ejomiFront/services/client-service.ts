import apiClient from "./api-client"

export interface Client {
  id: number
  nom: string
  prenom: string
  email?: string
  tel: string
  adresse: string
  password?: string
  roleId?: number
  role?: {
    id: number
    name: string
    description?: string
  }
}

export interface ClientCreateData {
  nom: string
  prenom: string
  email?: string
  tel: string
  adresse: string
  password?: string
}

export interface ClientUpdateData {
  nom?: string
  prenom?: string
  email?: string
  tel?: string
  adresse?: string
  password?: string
}

export const clientService = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get<any>(`/users${query}`)
  },

  getById: (id: number) => apiClient.get<{ data: Client }>(`/users/${id}`),

  create: (data: ClientCreateData) => apiClient.post<{ data: Client }>("/users", data),

  update: (id: number, data: ClientUpdateData) => apiClient.put<{ data: Client }>(`/users/${id}`, data),

  delete: (id: number) => apiClient.delete(`/users/${id}`),
}

export default clientService
