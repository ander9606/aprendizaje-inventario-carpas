// ============================================
// HOOK: useDisponibilidad
// Verificación de disponibilidad de elementos
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiDisponibilidad from '../api/apiDisponibilidad'

/**
 * Hook para verificar disponibilidad de productos (sin cotización)
 * Útil en el formulario de cotización antes de guardar
 */
export const useVerificarDisponibilidadProductos = () => {
  const [resultado, setResultado] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refs para evitar dependencias cambiantes
  const debounceTimer = useRef(null)
  const lastRequestId = useRef(0)

  // Función estable de verificación (sin dependencias que cambien)
  const verificar = useCallback((productos, fechaMontaje, fechaDesmontaje) => {
    // Validar inputs
    if (!productos || productos.length === 0 || !fechaMontaje) {
      setResultado(null)
      return
    }

    // Limpiar timer previo
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Debounce de 600ms
    debounceTimer.current = setTimeout(async () => {
      const requestId = ++lastRequestId.current
      setIsLoading(true)

      try {
        const response = await apiDisponibilidad.verificarProductos(
          productos,
          fechaMontaje,
          fechaDesmontaje
        )

        // Solo actualizar si es la última petición
        if (requestId === lastRequestId.current) {
          setResultado(response?.data || response)
        }
      } catch (error) {
        console.error('Error verificando disponibilidad:', error)
        if (requestId === lastRequestId.current) {
          setResultado(null)
        }
      } finally {
        if (requestId === lastRequestId.current) {
          setIsLoading(false)
        }
      }
    }, 600)
  }, []) // Sin dependencias - función estable

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const limpiar = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    setResultado(null)
    setIsLoading(false)
  }, [])

  return {
    verificar,
    limpiar,
    resultado,
    isLoading
  }
}

/**
 * Hook para verificar disponibilidad de una cotización existente
 * @param {number} cotizacionId - ID de la cotización
 * @param {boolean} enabled - Si debe ejecutar la query automáticamente
 */
export const useVerificarDisponibilidadCotizacion = (cotizacionId, enabled = true) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['disponibilidad', 'cotizacion', cotizacionId],
    queryFn: () => apiDisponibilidad.verificarCotizacion(cotizacionId),
    enabled: !!cotizacionId && enabled,
    staleTime: 1000 * 30 // 30 segundos
  })

  return {
    disponibilidad: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook para obtener calendario de ocupación
 * @param {string} fechaInicio
 * @param {string} fechaFin
 * @param {Array} elementoIds
 */
export const useCalendarioOcupacion = (fechaInicio, fechaFin, elementoIds = null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['disponibilidad', 'calendario', fechaInicio, fechaFin, elementoIds],
    queryFn: () => apiDisponibilidad.obtenerCalendario(fechaInicio, fechaFin, elementoIds),
    enabled: !!fechaInicio && !!fechaFin,
    staleTime: 1000 * 60 // 1 minuto
  })

  return {
    calendario: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook para descomponer productos en elementos
 */
export const useDescomponerProductos = () => {
  const mutation = useMutation({
    mutationFn: (productos) => apiDisponibilidad.descomponerProductos(productos),
    retry: 0
  })


  return {
    descomponer: mutation.mutate,
    elementos: mutation.data?.data || [],
    isLoading: mutation.isPending,
    error: mutation.error
  }
}
