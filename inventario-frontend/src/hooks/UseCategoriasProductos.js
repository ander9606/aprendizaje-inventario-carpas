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
// HOOK: useGetCategoriasProductosActivas
// Obtiene categorías activas (lista plana)
// ============================================

export const useGetCategoriasProductosActivas = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias-productos', 'activas'],
    queryFn: categoriasProductosAPI.obtenerActivas
  })

  return {
    categorias: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCategoriasProductosArbol
// Obtiene categorías en estructura de árbol
// ============================================

export const useGetCategoriasProductosArbol = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias-productos', 'arbol'],
    queryFn: categoriasProductosAPI.obtenerArbol
  })

  return {
    categorias: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCategoriasProductosActivasArbol
// Obtiene categorías activas en árbol
// ============================================

export const useGetCategoriasProductosActivasArbol = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias-productos', 'activas', 'arbol'],
    queryFn: categoriasProductosAPI.obtenerActivasArbol
  })

  return {
    categorias: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCategoriasConConteo
// Obtiene categorías con conteo de productos (para selector)
// ============================================

export const useGetCategoriasConConteo = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias-productos', 'con-conteo'],
    queryFn: categoriasProductosAPI.obtenerConConteo
  })

  // DEBUG
  console.log('useGetCategoriasConConteo - raw data:', data)
  console.log('useGetCategoriasConConteo - data.data:', data?.data)

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
// HOOK: useGetSubcategorias
// Obtiene subcategorías de una categoría padre
// ============================================

export const useGetSubcategorias = (categoriaId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias-productos', categoriaId, 'hijos'],
    queryFn: () => categoriasProductosAPI.obtenerHijos(categoriaId),
    enabled: !!categoriaId
  })

  return {
    subcategorias: data?.data || [],
    isLoading,
    error,
    refetch
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
    retry: 0,

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
    retry: 0,

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
    retry: 0,

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
