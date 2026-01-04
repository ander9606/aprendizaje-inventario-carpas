// ============================================
// CUSTOM HOOK: useCiudades
// Maneja operaciones con ciudades
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiCiudades from '../api/apiCiudades'

// ============================================
// HOOK: useGetCiudades
// ============================================

export const useGetCiudades = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ciudades'],
    queryFn: apiCiudades.obtenerTodas
  })

  return {
    ciudades: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCiudadesActivas
// ============================================

export const useGetCiudadesActivas = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ciudades', 'activas'],
    queryFn: apiCiudades.obtenerActivas
  })

  return {
    ciudades: data?.data || [],
    isLoading,
    error
  }
}

// ============================================
// HOOK: useCreateCiudad
// ============================================

export const useCreateCiudad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCiudades.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciudades'] })
      queryClient.invalidateQueries({ queryKey: ['tarifas-transporte'] })
    }
  })
}

// ============================================
// HOOK: useUpdateCiudad
// ============================================

export const useUpdateCiudad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiCiudades.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciudades'] })
      queryClient.invalidateQueries({ queryKey: ['tarifas-transporte'] })
    }
  })
}

// ============================================
// HOOK: useDeleteCiudad
// ============================================

export const useDeleteCiudad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCiudades.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciudades'] })
      queryClient.invalidateQueries({ queryKey: ['tarifas-transporte'] })
    }
  })
}
