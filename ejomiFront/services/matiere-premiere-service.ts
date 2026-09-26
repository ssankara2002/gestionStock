import apiClient from "./api-client"
import type { MatierePremiere } from "@/types/matierePremiere"

interface PaginatedResponse<T> {
  data: T[]
  currentPage: number
  totalPages: number
  totalItems: number
}

export const getAllMatieresPremieres = (page = 1, limit = 10) => {
  return apiClient
    .get<PaginatedResponse<MatierePremiere>>("/matieres-premieres", { params: { page, limit } })
    .then((res) => res.data)
}

export const getMatierePremiereById = (id: string | number) => {
  return apiClient.get<{ data: MatierePremiere }>(`/matieres-premieres/${id}`).then((res) => res.data.data)
}

export const createMatierePremiere = (data: Partial<MatierePremiere>) => {
  return apiClient.post<{ data: MatierePremiere }>("/matieres-premieres", data).then((res) => res.data)
}

export const updateMatierePremiere = (id: string | number, data: Partial<MatierePremiere>) => {
  return apiClient.put<{ data: MatierePremiere }>(`/matieres-premieres/${id}`, data).then((res) => res.data)
}

export const deleteMatierePremiere = (id: string | number) => {
  return apiClient.delete(`/matieres-premieres/${id}`)
}

export const getMatierePremiereStatistics = () => {
  return apiClient.get("/matieres-premieres/statistics").then((res) => res.data)
}

export const matierePremiereService = {
  getAllMatieresPremieres,
  getMatierePremiereById,
  createMatierePremiere,
  updateMatierePremiere,
  deleteMatierePremiere,
  getMatierePremiereStatistics,
}