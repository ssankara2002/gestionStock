import apiClient from "./api-client"

export const avoirService = {
  getAll: () => apiClient.get<any>("/avoirs"),
  getById: (id: string) => apiClient.get<any>(`/avoirs/${id}`),
  getByCommande: (commandeId: string) => apiClient.get<any>(`/avoirs/commande/${commandeId}`),
  create: (data: any) => apiClient.post<any>("/avoirs", data),
  delete: (id: string) => apiClient.delete(`/avoirs/${id}`),
  downloadPdf: (id: number) => apiClient.get(`/avoirs/recu?id=${id}`, { responseType: "blob" }),
  getClientCredit: (clientId: string) => apiClient.get<any>(`/commandes/client/${clientId}/credit`),
}
