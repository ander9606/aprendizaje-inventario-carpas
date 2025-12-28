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
// Obtiene UNA categoría específica por ID
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
// Crea una nueva categoría de producto
// ============================================

export const useCreateCategoriaProducto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: categoriasProductosAPI.crear,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] })
      console.log('✅ Categoría de producto creada exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al crear categoría de producto:', error)
    }
  })

  return {
    createCategoria: mutateAsync,
    createCategoriaSync: mutate,
    isPending,
    error
  }
}

// ============================================
// HOOK: useUpdateCategoriaProducto
// Actualiza una categoría de producto
// ============================================

export const useUpdateCategoriaProducto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ id, ...data }) => categoriasProductosAPI.actualizar(id, data),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-productos', variables.id] })
      console.log('✅ Categoría de producto actualizada exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al actualizar categoría de producto:', error)
    }
  })

  return {
    updateCategoria: mutateAsync,
    updateCategoriaSync: mutate,
    isPending,
    error
  }
}

// ============================================
// HOOK: useDeleteCategoriaProducto
// Elimina una categoría de producto
// ============================================

export const useDeleteCategoriaProducto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: categoriasProductosAPI.eliminar,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] })
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      console.log('✅ Categoría de producto eliminada exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al eliminar categoría de producto:', error)
    }
  })

  return {
    deleteCategoria: mutateAsync,
    deleteCategoriaSync: mutate,
    isPending,
    error
  }
}

// Exportación por defecto
export default useGetCategoriasProductos
