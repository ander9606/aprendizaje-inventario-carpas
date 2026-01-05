// ============================================
// HOOK: useGetCotizacionCompleta
// Obtiene cotizacion con productos y transporte
// Usado para la vista PDF/detalle
// ============================================

import { useQuery } from '@tanstack/react-query'
import apiCotizaciones from '../../api/apiCotizaciones'

/**
 * Hook para obtener una cotizacion completa con todos sus detalles
 * Incluye: productos, transporte, cliente, totales
 *
 * @param {number|null} id - ID de la cotizacion
 * @returns {Object} { cotizacion, isLoading, error, refetch }
 *
 * @example
 * const { cotizacion, isLoading } = useGetCotizacionCompleta(15)
 *
 * // cotizacion contiene:
 * // - id, estado, fecha_evento, evento_nombre, etc.
 * // - cliente_nombre, cliente_telefono, cliente_email
 * // - productos: [{ producto_nombre, cantidad, precio_base, ... }]
 * // - transporte: [{ tipo_camion, cantidad, precio_unitario, subtotal }]
 * // - total, descuento, subtotal_productos, subtotal_transporte
 */
export const useGetCotizacionCompleta = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotizaciones', id, 'completa'],
    queryFn: () => apiCotizaciones.obtenerCompleta(id),
    enabled: !!id,
    // Mantener datos previos mientras recarga
    staleTime: 1000 * 60, // 1 minuto
  })

  return {
    cotizacion: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook para verificar disponibilidad de productos
 */
export const useVerificarDisponibilidad = (id, fechaInicio, fechaFin) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotizaciones', id, 'disponibilidad', fechaInicio, fechaFin],
    queryFn: () => apiCotizaciones.verificarDisponibilidad(id, fechaInicio, fechaFin),
    enabled: !!id && !!fechaInicio
  })

  return {
    disponibilidad: data?.data || null,
    isLoading,
    error,
    refetch
  }
}
