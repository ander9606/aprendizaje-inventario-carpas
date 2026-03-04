// ============================================
// HOOK: Obtener descuentos del catálogo
// ============================================

import { useQuery } from '@tanstack/react-query'
import apiDescuentos from '../../api/apiDescuentos'

/**
 * Hook para obtener todos los descuentos del catálogo
 * @param {boolean} incluirInactivos - Si se incluyen descuentos inactivos
 */
export const useGetDescuentos = (incluirInactivos = false) => {
  return useQuery({
    queryKey: ['descuentos', { incluirInactivos }],
    queryFn: () => apiDescuentos.obtenerTodos(incluirInactivos),
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => data.data
  })
}

/**
 * Hook para obtener un descuento por ID
 * @param {number} id - ID del descuento
 */
export const useGetDescuento = (id) => {
  return useQuery({
    queryKey: ['descuentos', id],
    queryFn: () => apiDescuentos.obtenerPorId(id),
    enabled: !!id,
    select: (data) => data.data
  })
}

/**
 * Hook para obtener descuentos aplicados a una cotización
 * @param {number} cotizacionId - ID de la cotización
 */
export const useGetDescuentosCotizacion = (cotizacionId) => {
  return useQuery({
    queryKey: ['cotizaciones', cotizacionId, 'descuentos'],
    queryFn: () => apiDescuentos.obtenerDeCotizacion(cotizacionId),
    enabled: !!cotizacionId,
    select: (data) => data.data
  })
}
