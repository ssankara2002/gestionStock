import apiClient from "./api-client"
import type {
  Contact,
  ContactCreateData,
  ContactUpdateData,
  ContactStatistics,
  ContactStatut
} from "../types/contact"

export const contactService = {
  // Créer un nouveau message de contact (accessible sans authentification)
  create: (data: ContactCreateData) =>
    apiClient.post<Contact>("/contacts", data),

  // Récupérer tous les contacts (admin)
  getAll: (page: number = 1, limit: number = 10) =>
    apiClient.get<Contact[]>("/contacts", { params: { page, limit } }),

  // Récupérer un contact par ID
  getById: (id: number) =>
    apiClient.get<Contact>(`/contacts/${id}`),

  // Mettre à jour un contact
  update: (id: number, data: ContactUpdateData) =>
    apiClient.put<Contact>(`/contacts/${id}`, data),

  // Supprimer un contact
  delete: (id: number) =>
    apiClient.delete(`/contacts/${id}`),

  // Récupérer les statistiques
  getStatistics: () =>
    apiClient.get<ContactStatistics>("/contacts/statistics"),

  // Récupérer par statut
  getByStatut: (statut: ContactStatut) =>
    apiClient.get<Contact[]>(`/contacts/statut/${statut}`),
}

export default contactService
