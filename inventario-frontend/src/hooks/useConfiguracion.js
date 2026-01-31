// ============================================
// HOOKS: Configuración de Alquileres
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiConfiguracion from '../api/apiConfiguracion'

/**
 * Hook para obtener todas las configuraciones
 */
export const useGetConfiguraciones = () => {
  return useQuery({
    queryKey: ['configuracion'],
    queryFn: apiConfiguracion.obtenerTodas,
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => ({
      configuraciones: data.data,
      agrupadas: data.agrupadas
    })
  })
}

/**
 * Hook para obtener configuración completa como objeto
 */
export const useGetConfiguracionCompleta = () => {
  return useQuery({
    queryKey: ['configuracion', 'completa'],
    queryFn: apiConfiguracion.obtenerCompleta,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.data
  })
}

/**
 * Hook para obtener configuración por categoría
 */
export const useGetConfiguracionPorCategoria = (categoria) => {
  return useQuery({
    queryKey: ['configuracion', 'categoria', categoria],
    queryFn: () => apiConfiguracion.obtenerPorCategoria(categoria),
    enabled: !!categoria,
    select: (data) => data.data
  })
}

/**
 * Hook para actualizar un valor de configuración
 */
export const useUpdateConfiguracion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clave, valor }) => apiConfiguracion.actualizarValor(clave, valor),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries(['configuracion'])
    }
  })
}

/**
 * Hook para actualizar múltiples valores de configuración
 */
export const useUpdateConfiguraciones = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiConfiguracion.actualizarValores,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries(['configuracion'])
    }
  })
}
