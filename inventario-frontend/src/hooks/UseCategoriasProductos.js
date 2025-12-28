// ============================================
// CUSTOM HOOK: useCategoriasProductos
// Maneja operaciones con categorías de productos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasProductosAPI } from '../api'

// ============================================
// HOOK: useGetCategoriasProductos
// Obtiene todas las categorías de productos
// ============================================

export const useGetCategoriasProductos = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias-productos'],
    queryFn: categoriasProductosAPI.obtenerTodas
  })

  return {
    categorias: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCategoriaProducto
// Obtiene una categoría por ID
// ============================================

export const useGetCategoriaProducto = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categorias-productos', id],
    queryFn: () => categoriasProductosAPI.obtenerPorId(id),
    enabled: !!id
  })

  return {
    categoria: data?.data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useCreateCategoriaProducto
// Crea una nueva categoría de productos
// ============================================

export const useCreateCategoriaProducto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: categoriasProductosAPI.crear,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] })
      console.log('✅ Categoría de productos creada')
    },

    onError: (error) => {
      console.error('❌ Error al crear categoría de productos:', error)
    }
  })

  return {
    createCategoria: mutateAsync,
    createCategoriaSync: mutate,
    isLoading: isPending,
    error
  }
}

// ============================================
// HOOK: useUpdateCategoriaProducto
// Actualiza una categoría de productos
// ============================================

export const useUpdateCategoriaProducto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ id, ...data }) => categoriasProductosAPI.actualizar(id, data),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-productos', variables.id] })
      console.log('✅ Categoría de productos actualizada')
    },

    onError: (error) => {
      console.error('❌ Error al actualizar categoría de productos:', error)
    }
  })

  return {
    updateCategoria: mutateAsync,
    updateCategoriaSync: mutate,
    isLoading: isPending,
    error
  }
}

// ============================================
// HOOK: useDeleteCategoriaProducto
// Elimina una categoría de productos
// ============================================

export const useDeleteCategoriaProducto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: categoriasProductosAPI.eliminar,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] })
      console.log('✅ Categoría de productos eliminada')
    },

    onError: (error) => {
      console.error('❌ Error al eliminar categoría de productos:', error)
    }
  })

  return {
    deleteCategoria: mutateAsync,
    deleteCategoriaSync: mutate,
    isLoading: isPending,
    error
  }
}

// Exportación por defecto
export default useGetCategoriasProductos
