// ============================================
// HOOKS: Alquileres
// Queries y mutations para gestión de alquileres
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiAlquileres from '../api/apiAlquileres'

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los alquileres
 */
export const useGetAlquileres = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquileres'],
    queryFn: apiAlquileres.obtenerTodos
  })

  return {
    alquileres: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Obtener alquileres activos
 */
export const useGetAlquileresActivos = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquileres', 'activos'],
    queryFn: apiAlquileres.obtenerActivos
  })

  return {
    alquileres: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Obtener alquileres programados
 */
export const useGetAlquileresProgramados = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquileres', 'programados'],
    queryFn: apiAlquileres.obtenerProgramados
  })

  return {
    alquileres: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Obtener alquileres por estado
 */
export const useGetAlquileresPorEstado = (estado) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquileres', 'estado', estado],
    queryFn: () => apiAlquileres.obtenerPorEstado(estado),
    enabled: !!estado
  })

  return {
    alquileres: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Obtener alquiler por ID
 */
export const useGetAlquiler = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquiler', id],
    queryFn: () => apiAlquileres.obtenerPorId(id),
    enabled: !!id
  })

  return {
    alquiler: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Obtener alquiler completo (con productos y elementos)
 */
export const useGetAlquilerCompleto = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquiler', id, 'completo'],
    queryFn: () => apiAlquileres.obtenerCompleto(id),
    enabled: !!id
  })

  return {
    alquiler: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Obtener estadísticas de alquileres
 */
export const useGetEstadisticasAlquileres = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquileres', 'estadisticas'],
    queryFn: apiAlquileres.obtenerEstadisticas
  })

  return {
    estadisticas: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Marcar salida de alquiler
 */
export const useMarcarSalidaAlquiler = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }) => apiAlquileres.marcarSalida(id, datos),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alquileres'] })
      queryClient.invalidateQueries({ queryKey: ['alquiler'] })
    }
  })
}

/**
 * Marcar retorno de alquiler
 */
export const useMarcarRetornoAlquiler = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }) => apiAlquileres.marcarRetorno(id, datos),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alquileres'] })
      queryClient.invalidateQueries({ queryKey: ['alquiler'] })
    }
  })
}

/**
 * Cancelar alquiler
 */
export const useCancelarAlquiler = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notas }) => apiAlquileres.cancelar(id, notas),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alquileres'] })
      queryClient.invalidateQueries({ queryKey: ['alquiler'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['evento'] })
    }
  })
}

/**
 * Asignar elementos a alquiler
 */
export const useAsignarElementosAlquiler = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, elementos }) => apiAlquileres.asignarElementos(id, elementos),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alquiler', variables.id] })
    }
  })
}
