// ============================================
// CUSTOM HOOK: useDepartamentos
// Maneja operaciones con departamentos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiDepartamentos from '../api/apiDepartamentos'

// ============================================
// HOOK: useGetDepartamentos
// ============================================

export const useGetDepartamentos = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['departamentos'],
    queryFn: apiDepartamentos.obtenerTodos
  })

  return {
    departamentos: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetDepartamentosActivos
// ============================================

export const useGetDepartamentosActivos = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['departamentos', 'activos'],
    queryFn: apiDepartamentos.obtenerActivos
  })

  return {
    departamentos: data?.data || [],
    isLoading,
    error
  }
}

// ============================================
// HOOK: useCreateDepartamento
// ============================================

export const useCreateDepartamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiDepartamentos.crear,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departamentos'] })
    }
  })
}

// ============================================
// HOOK: useUpdateDepartamento
// ============================================

export const useUpdateDepartamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiDepartamentos.actualizar(id, data),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departamentos'] })
    }
  })
}

// ============================================
// HOOK: useDeleteDepartamento
// ============================================

export const useDeleteDepartamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiDepartamentos.eliminar,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departamentos'] })
    }
  })
}
