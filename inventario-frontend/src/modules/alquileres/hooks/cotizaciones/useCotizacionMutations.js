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
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
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
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones', variables.id, 'completa'] })
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
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['alquileres'] })
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
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones', variables.id, 'completa'] })
    }
  })
}

/**
 * Hook para confirmar fechas de un borrador (borrador → pendiente)
 */
export const useConfirmarFechasCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, fechas }) => apiCotizaciones.confirmarFechas(id, fechas),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones', variables.id, 'completa'] })
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
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
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
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
    }
  })
}

/**
 * Hook para actualizar cobro de depósito de una cotizacion
 */
export const useActualizarCobrarDeposito = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, cobrarDeposito }) => apiCotizaciones.actualizarCobrarDeposito(id, cobrarDeposito),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones', variables.id, 'completa'] })
    }
  })
}

/**
 * Hook para registrar seguimiento de una cotizacion
 */
export const useRegistrarSeguimiento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notas }) => apiCotizaciones.registrarSeguimiento(id, notas),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones', variables.id, 'completa'] })
      queryClient.invalidateQueries({ queryKey: ['alertas-alquileres'] })
      queryClient.invalidateQueries({ queryKey: ['alertas-resumen'] })
    }
  })
}
