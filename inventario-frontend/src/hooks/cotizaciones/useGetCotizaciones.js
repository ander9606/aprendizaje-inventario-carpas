// ============================================
// HOOKS: Queries de listado de cotizaciones
// ============================================

import { useQuery } from '@tanstack/react-query'
import apiCotizaciones from '../../api/apiCotizaciones'

/**
 * Hook para obtener todas las cotizaciones
 */
export const useGetCotizaciones = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: apiCotizaciones.obtenerTodas
  })

  return {
    cotizaciones: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook para obtener cotizaciones por estado
 */
export const useGetCotizacionesPorEstado = (estado) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotizaciones', 'estado', estado],
    queryFn: () => apiCotizaciones.obtenerPorEstado(estado),
    enabled: !!estado
  })

  return {
    cotizaciones: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook para obtener una cotizacion basica por ID
 */
export const useGetCotizacion = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotizaciones', id],
    queryFn: () => apiCotizaciones.obtenerPorId(id),
    enabled: !!id
  })

  return {
    cotizacion: data?.data || null,
    isLoading,
    error,
    refetch
  }
}
