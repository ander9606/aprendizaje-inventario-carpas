// ============================================
// CUSTOM HOOK: useProductosAlquiler
// Maneja operaciones con productos de alquiler
// ============================================

import { useQuery } from '@tanstack/react-query'
import apiProductosAlquiler from '../api/apiProductosAlquiler'

// ============================================
// HOOK: useGetProductosAlquiler
// ============================================

export const useGetProductosAlquiler = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['productos-alquiler'],
    queryFn: apiProductosAlquiler.obtenerTodos
  })

  return {
    productos: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetProductoAlquiler
// ============================================

export const useGetProductoAlquiler = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['productos-alquiler', id],
    queryFn: () => apiProductosAlquiler.obtenerPorId(id),
    enabled: !!id
  })

  return {
    producto: data?.data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useGetProductoCompleto
// ============================================

export const useGetProductoCompleto = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['productos-alquiler', id, 'completo'],
    queryFn: () => apiProductosAlquiler.obtenerCompleto(id),
    enabled: !!id
  })

  return {
    producto: data?.data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useGetProductosPorCategoria
// ============================================

export const useGetProductosPorCategoria = (categoriaId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['productos-alquiler', 'categoria', categoriaId],
    queryFn: () => apiProductosAlquiler.obtenerPorCategoria(categoriaId),
    enabled: !!categoriaId
  })

  return {
    productos: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useBuscarProductos
// ============================================

export const useBuscarProductos = (termino) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['productos-alquiler', 'buscar', termino],
    queryFn: () => apiProductosAlquiler.buscar(termino),
    enabled: termino?.length >= 2
  })

  return {
    productos: data?.data || [],
    isLoading,
    error,
    refetch
  }
}
