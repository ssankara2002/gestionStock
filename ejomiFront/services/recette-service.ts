import apiClient from "./api-client"

export const recetteService = {
  getRecette: (platId: number) =>
    apiClient.get(`/plats/${platId}/recette`),

  upsertIngredient: (platId: number, data: { matierePremiereId: number; quantiteParPortion: number; unite: string }) =>
    apiClient.post(`/plats/${platId}/recette`, data),

  deleteIngredient: (platId: number, matierePremiereId: number) =>
    apiClient.delete(`/plats/${platId}/recette/${matierePremiereId}`),

  getCapacite: (platId: number) =>
    apiClient.get(`/plats/${platId}/capacite`),

  getCapaciteTousPlats: () =>
    apiClient.get(`/plats/capacite`),

  preparer: (platId: number, data: { nombrePortions: number; lignes: { matierePremiereId: number; quantiteUtilisee: number }[]; note?: string }) =>
    apiClient.post(`/plats/${platId}/preparer`, data),

  getPreparations: (platId: number) =>
    apiClient.get(`/plats/${platId}/preparations`),

  getPreparationsJour: () =>
    apiClient.get(`/plats/preparations/jour`),
}
