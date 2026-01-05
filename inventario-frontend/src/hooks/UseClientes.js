// ============================================
// CUSTOM HOOK: useClientes
// Maneja todas las operaciones con clientes
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClientes from '../api/apiClientes'

// ============================================
// HOOK: useGetClientes
// Obtiene todos los clientes
// ============================================

export const useGetClientes = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientes'],
    queryFn: apiClientes.obtenerTodos
  })

  return {
    clientes: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetClientesActivos
// Obtiene solo los clientes activos
// ============================================

export const useGetClientesActivos = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientes', 'activos'],
    queryFn: apiClientes.obtenerActivos
  })

  return {
    clientes: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCliente
// Obtiene un cliente específico por ID
// ============================================

export const useGetCliente = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['clientes', id],
    queryFn: () => apiClientes.obtenerPorId(id),
    enabled: !!id
  })

  return {
    cliente: data?.data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useBuscarClientes
// Busca clientes por término
// ============================================

export const useBuscarClientes = (termino) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientes', 'buscar', termino],
    queryFn: () => apiClientes.buscar(termino),
    enabled: termino?.length >= 2
  })

  return {
    resultados: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useCreateCliente
// Crea un nuevo cliente
// ============================================

export const useCreateCliente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiClientes.crear,
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
    }
  })
}

// ============================================
// HOOK: useUpdateCliente
// Actualiza un cliente existente
// ============================================

export const useUpdateCliente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => apiClientes.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
    }
  })
}

// ============================================
// HOOK: useDeleteCliente
// Elimina un cliente
// ============================================

export const useDeleteCliente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiClientes.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
    }
  })
}
