// ============================================
// HOOKS: Eventos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiEventos from '../api/apiEventos'

/**
 * Hook para obtener todos los eventos
 */
export const useGetEventos = () => {
  return useQuery({
    queryKey: ['eventos'],
    queryFn: apiEventos.obtenerTodos,
    select: (data) => data.data
  })
}

/**
 * Hook para obtener evento por ID
 */
export const useGetEvento = (id) => {
  return useQuery({
    queryKey: ['eventos', id],
    queryFn: () => apiEventos.obtenerPorId(id),
    enabled: !!id,
    select: (data) => data.data
  })
}

/**
 * Hook para obtener eventos por cliente
 */
export const useGetEventosPorCliente = (clienteId) => {
  return useQuery({
    queryKey: ['eventos', 'cliente', clienteId],
    queryFn: () => apiEventos.obtenerPorCliente(clienteId),
    enabled: !!clienteId,
    select: (data) => data.data
  })
}

/**
 * Hook para obtener eventos por estado
 */
export const useGetEventosPorEstado = (estado) => {
  return useQuery({
    queryKey: ['eventos', 'estado', estado],
    queryFn: () => apiEventos.obtenerPorEstado(estado),
    enabled: !!estado,
    select: (data) => data.data
  })
}

/**
 * Hook para obtener cotizaciones de un evento
 */
export const useGetCotizacionesEvento = (eventoId) => {
  return useQuery({
    queryKey: ['eventos', eventoId, 'cotizaciones'],
    queryFn: () => apiEventos.obtenerCotizaciones(eventoId),
    enabled: !!eventoId,
    select: (data) => data.data
  })
}

/**
 * Hook para crear un evento
 */
export const useCreateEvento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiEventos.crear,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries(['eventos'])
    }
  })
}

/**
 * Hook para actualizar un evento
 */
export const useUpdateEvento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiEventos.actualizar(id, data),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['eventos'])
      queryClient.invalidateQueries(['eventos', variables.id])
    }
  })
}

/**
 * Hook para cambiar estado de un evento
 */
export const useCambiarEstadoEvento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }) => apiEventos.cambiarEstado(id, estado),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['eventos'])
      queryClient.invalidateQueries(['eventos', variables.id])
    }
  })
}

/**
 * Hook para eliminar un evento
 */
export const useDeleteEvento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiEventos.eliminar,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries(['eventos'])
    }
  })
}
