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

  const mutation = useMutation({
    mutationFn: ({ productos, fechaMontaje, fechaDesmontaje }) =>
      apiDisponibilidad.verificarProductos(productos, fechaMontaje, fechaDesmontaje),
    retry: 0,
    onSuccess: (data) => {
      console.debug('useVerificarDisponibilidad - onSuccess response:', data)
      // Aceptar tanto respuesta completa { data: ... } como payload directo
      setResultado(data?.data || data)
    },
    onError: () => {
      setResultado(null)
    }
  })

  // Debounce control (evita llamadas repetidas en corto periodo)
  const debounceTimer = useRef(null)

  const verificar = useCallback((productos, fechaMontaje, fechaDesmontaje) => {
    if (!productos || productos.length === 0 || !fechaMontaje) {
      setResultado(null)
      return
    }

    // Limpiar timer previo
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Esperar 500ms antes de ejecutar la mutación
    debounceTimer.current = setTimeout(() => {
      mutation.mutate({ productos, fechaMontaje, fechaDesmontaje })
    }, 500)
  }, [mutation])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const limpiar = useCallback(() => {
    setResultado(null)
  }, [])

  return {
    verificar,
    limpiar,
    resultado,
    isLoading: mutation.isPending,
    error: mutation.error
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
