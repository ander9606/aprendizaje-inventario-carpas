// ============================================
// HOOKS: Mutations de cotizaciones
// Crear, actualizar, aprobar, eliminar, etc.
// ============================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiCotizaciones from '../../api/apiCotizaciones'

/**
 * Hook para crear una nueva cotizacion
 */
export const useCreateCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCotizaciones.crear,
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

/**
 * Hook para actualizar una cotizacion existente
 */
export const useUpdateCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiCotizaciones.actualizar(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['cotizaciones'])
      queryClient.invalidateQueries(['cotizaciones', variables.id, 'completa'])
    }
  })
}

/**
 * Hook para aprobar una cotizacion (crea un alquiler)
 */
export const useAprobarCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, opciones }) => apiCotizaciones.aprobar(id, opciones),
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
      queryClient.invalidateQueries(['alquileres'])
    }
  })
}

/**
 * Hook para cambiar el estado de una cotizacion
 */
export const useCambiarEstadoCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }) => apiCotizaciones.cambiarEstado(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['cotizaciones'])
      queryClient.invalidateQueries(['cotizaciones', variables.id, 'completa'])
    }
  })
}

/**
 * Hook para duplicar una cotizacion
 */
export const useDuplicarCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCotizaciones.duplicar,
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

/**
 * Hook para eliminar una cotizacion
 */
export const useDeleteCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCotizaciones.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}
