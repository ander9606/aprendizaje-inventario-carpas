// ============================================
// HOOKS: Mutations de descuentos
// Crear, actualizar, eliminar, aplicar a cotización
// ============================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiDescuentos from '../../api/apiDescuentos'

/**
 * Hook para crear un nuevo descuento en el catálogo
 */
export const useCreateDescuento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiDescuentos.crear,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries(['descuentos'])
    }
  })
}

/**
 * Hook para actualizar un descuento del catálogo
 */
export const useUpdateDescuento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiDescuentos.actualizar(id, data),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['descuentos'])
      queryClient.invalidateQueries(['descuentos', variables.id])
    }
  })
}

/**
 * Hook para eliminar un descuento del catálogo (soft delete)
 */
export const useDeleteDescuento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiDescuentos.eliminar,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries(['descuentos'])
    }
  })
}

/**
 * Hook para aplicar un descuento a una cotización
 */
export const useAplicarDescuento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cotizacionId, datos }) => apiDescuentos.aplicarACotizacion(cotizacionId, datos),
    retry: 0,
    onSuccess: (_, variables) => {
      // Invalidar cotización completa y descuentos de la cotización
      queryClient.invalidateQueries(['cotizaciones', variables.cotizacionId, 'completa'])
      queryClient.invalidateQueries(['cotizaciones', variables.cotizacionId, 'descuentos'])
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

/**
 * Hook para eliminar un descuento aplicado de una cotización
 */
export const useEliminarDescuentoCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cotizacionId, descuentoAplicadoId }) =>
      apiDescuentos.eliminarDeCotizacion(cotizacionId, descuentoAplicadoId),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['cotizaciones', variables.cotizacionId, 'completa'])
      queryClient.invalidateQueries(['cotizaciones', variables.cotizacionId, 'descuentos'])
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}
