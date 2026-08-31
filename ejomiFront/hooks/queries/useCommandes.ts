import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { commandeService } from "@/services/commande-service"
import type { CommandeCreateData } from "@/types/commande"

export function useCommandes(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['commandes', page, limit],
    queryFn: async () => {
      const response = await commandeService.getCommandes(page, limit)
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useCommande(id: number) {
  return useQuery({
    queryKey: ['commande', id],
    queryFn: async () => {
      const response = await commandeService.getCommande(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateCommande() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CommandeCreateData) => {
      const response = await commandeService.createCommande(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateCommande() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await commandeService.updateCommande(id, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      queryClient.invalidateQueries({ queryKey: ['commande', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useDeleteCommande() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await commandeService.deleteCommande(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
