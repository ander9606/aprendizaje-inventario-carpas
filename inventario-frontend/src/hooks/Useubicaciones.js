// ============================================
// CUSTOM HOOK: useUbicaciones
// Maneja todas las operaciones con ubicaciones
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ubicacionesAPI from '../api/apiUbicaciones'

// Mensajes de éxito
const SUCCESS_MESSAGES = {
  UBICACION_CREADA: 'Ubicación creada exitosamente',
  UBICACION_ACTUALIZADA: 'Ubicación actualizada exitosamente',
  UBICACION_ELIMINADA: 'Ubicación eliminada exitosamente'
}

// ============================================
// HOOK PRINCIPAL: useGetUbicaciones
// Obtiene todas las ubicaciones
// ============================================

export const useGetUbicaciones = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: ubicacionesAPI.obtenerTodas
  })

  return {
    ubicaciones: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetUbicacionesActivas
// Obtiene solo las ubicaciones activas
// ============================================

export const useGetUbicacionesActivas = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ubicaciones', 'activas'],
    queryFn: ubicacionesAPI.obtenerActivas
  })

  return {
    ubicaciones: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetUbicacion
// Obtiene UNA ubicación específica por ID
// ============================================

export const useGetUbicacion = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ubicaciones', id],
    queryFn: () => ubicacionesAPI.obtenerPorId(id),
    enabled: !!id
  })

  return {
    ubicacion: data?.data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useGetUbicacionPrincipal
// Obtiene la ubicación principal
// ============================================

export const useGetUbicacionPrincipal = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ubicaciones', 'principal'],
    queryFn: ubicacionesAPI.obtenerPrincipal
  })

  return {
    ubicacion: data?.data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useCreateUbicacion
// Crea una nueva ubicación
// ============================================

export const useCreateUbicacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ubicacionesAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries(['ubicaciones'])
    }
  })
}

// ============================================
// HOOK: useUpdateUbicacion
// Actualiza una ubicación existente
// ============================================

export const useUpdateUbicacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => ubicacionesAPI.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ubicaciones'])
    }
  })
}

// ============================================
// HOOK: useMarcarComoPrincipal
// Marca una ubicación como principal
// ============================================

export const useMarcarComoPrincipal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ubicacionesAPI.marcarComoPrincipal,
    onSuccess: () => {
      queryClient.invalidateQueries(['ubicaciones'])
    }
  })
}

// ============================================
// HOOK: useDeleteUbicacion
// Elimina una ubicación
// ============================================

export const useDeleteUbicacion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ubicacionesAPI.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries(['ubicaciones'])
    }
  })
}
