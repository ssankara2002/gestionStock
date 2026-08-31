import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientService } from "@/services/client-service"

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientService.getClients()
      return response.data
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useClient(id: number) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await clientService.getClient(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await clientService.createClient(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await clientService.updateClient(id, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await clientService.deleteClient(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
