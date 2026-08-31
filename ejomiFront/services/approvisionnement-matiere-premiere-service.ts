import apiClient from "./api-client"

interface LigneData {
  matierePremiereId: number
  quantite: number
  montant: number
}

interface ApprovisionnementMatierePremiereCreateData {
  fournisseurId: number
  lignes: LigneData[]
}

interface ApprovisionnementMatierePremiereUpdateData {
  fournisseurId?: number
  employeId?: number
  lignes?: LigneData[]
}

const create = (data: ApprovisionnementMatierePremiereCreateData) => {
  return apiClient.post("/approvisionnements-matieres-premieres", data)
}

const getAll = async (page = 1, limit = 10) => {
  const response = await apiClient.get("/approvisionnements-matieres-premieres", {
    params: { page, limit },
  })
  return response.data
}

const getById = (id: number) => {
  return apiClient.get(`/approvisionnements-matieres-premieres/${id}`)
}

const update = (id: number, data: ApprovisionnementMatierePremiereUpdateData) => {
  return apiClient.put(`/approvisionnements-matieres-premieres/${id}`, data)
}

const deleteById = (id: number) => {
  return apiClient.delete(`/approvisionnements-matieres-premieres/${id}`)
}


export const approvisionnementMatierePremiereService = { create, getAll, getById, update, deleteById }