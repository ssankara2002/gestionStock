import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { produitService } from "@/services/produit-service"

export function useProduits() {
  return useQuery({
    queryKey: ['produits'],
    queryFn: async () => {
      const response = await produitService.getProduits()
      return response.data
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useProduit(id: number) {
  return useQuery({
    queryKey: ['produit', id],
    queryFn: async () => {
      const response = await produitService.getProduit(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useCreateProduit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await produitService.createProduit(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateProduit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await produitService.updateProduit(id, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['produit', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useDeleteProduit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await produitService.deleteProduit(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
