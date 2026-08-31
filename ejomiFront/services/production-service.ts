import apiClient from './api-client';
import { Production, ProductionCreateData, ProductionUpdateData } from '@/types/production';

export const productionService = {
  getAll: async (): Promise<Production[]> => {
    const response = await apiClient.get('/productions');
    return response.data.data;
  },

  getById: async (id: string): Promise<Production> => {
    const response = await apiClient.get(`/productions/${id}`);
    return response.data.data;
  },

  create: async (data: ProductionCreateData & { consommations?: Array<{ matierePremiereId: string; quantite: number }> }): Promise<Production> => {
    const response = await apiClient.post('/productions', data);
    return response.data.data;
  },

  update: async (id: string, data: ProductionUpdateData): Promise<Production> => {
    const response = await apiClient.put(`/productions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/productions/${id}`);
  },

  getByProduit: async (produitId: string): Promise<Production[]> => {
    const response = await apiClient.get(`/productions/produit/${produitId}`);
    return response.data.data;
  },

  getByEmploye: async (employeId: string): Promise<Production[]> => {
    const response = await apiClient.get(`/productions/employe/${employeId}`);
    return response.data.data;
  },

  getStatistics: async () => {
    const response = await apiClient.get('/productions/statistics');
    return response.data.data;
  },
};
