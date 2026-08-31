import apiClient from "./api-client"
import type { Produit, ProduitCreateData, ProduitUpdateData } from "../types/produit"

export const produitService = {
  getAll: () => apiClient.get<Produit[]>("/produits"),

  getById: (id: string) => apiClient.get<Produit>(`/produits/${id}`),

  create: (data: ProduitCreateData | FormData) => {
    // Do not set Content-Type manually for FormData: let the browser/axios set the boundary
    return apiClient.post<{ data: Produit }>("/produits", data)
  },

  update: (id: string, data: ProduitUpdateData | FormData) => {
    // Let axios set Content-Type for FormData automatically
    return apiClient.put<Produit>(`/produits/${id}`, data)
  },

  delete: (id: string) => apiClient.delete(`/produits/${id}`),
}

export default produitService