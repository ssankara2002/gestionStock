import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { employeService } from "@/services/employe-service"

export function useEmployes() {
  return useQuery({
    queryKey: ['employes'],
    queryFn: async () => {
      const response = await employeService.getEmployes()
      return response.data
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useEmploye(id: number) {
  return useQuery({
    queryKey: ['employe', id],
    queryFn: async () => {
      const response = await employeService.getEmploye(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useCreateEmploye() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await employeService.createEmploye(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateEmploye() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await employeService.updateEmploye(id, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employes'] })
      queryClient.invalidateQueries({ queryKey: ['employe', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useDeleteEmploye() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await employeService.deleteEmploye(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
