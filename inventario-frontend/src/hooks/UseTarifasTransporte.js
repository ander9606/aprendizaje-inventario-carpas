// ============================================
// CUSTOM HOOK: useTarifasTransporte
// Maneja operaciones con tarifas de transporte
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiTarifasTransporte from '../api/apiTarifasTransporte'

// ============================================
// HOOK: useGetTarifasTransporte
// ============================================

export const useGetTarifasTransporte = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tarifas-transporte'],
    queryFn: apiTarifasTransporte.obtenerTodas
  })

  return {
    tarifas: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCiudadesTransporte
// ============================================

export const useGetCiudadesTransporte = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tarifas-transporte', 'ciudades'],
    queryFn: apiTarifasTransporte.obtenerCiudades
  })

  return {
    ciudades: data?.data || [],
    isLoading,
    error
  }
}

// ============================================
// HOOK: useGetTiposCamion
// ============================================

export const useGetTiposCamion = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tarifas-transporte', 'tipos'],
    queryFn: apiTarifasTransporte.obtenerTiposCamion
  })

  return {
    tipos: data?.data || [],
    isLoading,
    error
  }
}

// ============================================
// HOOK: useGetTarifasPorCiudad
// ============================================

export const useGetTarifasPorCiudad = (ciudad) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tarifas-transporte', 'ciudad', ciudad],
    queryFn: () => apiTarifasTransporte.obtenerPorCiudad(ciudad),
    enabled: !!ciudad
  })

  return {
    tarifas: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useCreateTarifa
// ============================================

export const useCreateTarifa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiTarifasTransporte.crear,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifas-transporte'] })
    }
  })
}

// ============================================
// HOOK: useUpdateTarifa
// ============================================

export const useUpdateTarifa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiTarifasTransporte.actualizar(id, data),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifas-transporte'] })
    }
  })
}

// ============================================
// HOOK: useDeleteTarifa
// ============================================

export const useDeleteTarifa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiTarifasTransporte.eliminar,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifas-transporte'] })
    }
  })
}
