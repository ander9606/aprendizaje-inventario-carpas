// ============================================
// CUSTOM HOOK: useTarifasTransporte
// Maneja operaciones con tarifas de transporte
// ============================================

import { useQuery } from '@tanstack/react-query'
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
