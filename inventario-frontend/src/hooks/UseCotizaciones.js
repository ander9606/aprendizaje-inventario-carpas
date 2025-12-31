// ============================================
// CUSTOM HOOK: useCotizaciones
// Maneja todas las operaciones con cotizaciones
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiCotizaciones from '../api/apiCotizaciones'

// ============================================
// HOOK: useGetCotizaciones
// ============================================

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

// ============================================
// HOOK: useGetCotizacionesPorEstado
// ============================================

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

// ============================================
// HOOK: useGetCotizacion
// ============================================

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

// ============================================
// HOOK: useGetCotizacionCompleta
// ============================================

export const useGetCotizacionCompleta = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotizaciones', id, 'completa'],
    queryFn: () => apiCotizaciones.obtenerCompleta(id),
    enabled: !!id
  })

  return {
    cotizacion: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useCreateCotizacion
// ============================================

export const useCreateCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCotizaciones.crear,
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

// ============================================
// HOOK: useUpdateCotizacion
// ============================================

export const useUpdateCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiCotizaciones.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

// ============================================
// HOOK: useAprobarCotizacion
// ============================================

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

// ============================================
// HOOK: useCambiarEstadoCotizacion
// ============================================

export const useCambiarEstadoCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }) => apiCotizaciones.cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

// ============================================
// HOOK: useDuplicarCotizacion
// ============================================

export const useDuplicarCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCotizaciones.duplicar,
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

// ============================================
// HOOK: useDeleteCotizacion
// ============================================

export const useDeleteCotizacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiCotizaciones.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries(['cotizaciones'])
    }
  })
}

// ============================================
// HOOK: useVerificarDisponibilidad
// ============================================

export const useVerificarDisponibilidad = (id, fechaInicio, fechaFin) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotizaciones', id, 'disponibilidad', fechaInicio, fechaFin],
    queryFn: () => apiCotizaciones.verificarDisponibilidad(id, fechaInicio, fechaFin),
    enabled: !!id
  })

  return {
    disponibilidad: data?.data || null,
    isLoading,
    error,
    refetch
  }
}
