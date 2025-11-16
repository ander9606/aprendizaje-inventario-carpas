// ============================================
// CUSTOM HOOK: useCategorias
// Maneja todas las operaciones con categorías
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasAPI } from '../api'

// Mensajes de éxito
const SUCCESS_MESSAGES = {
  CATEGORIA_CREADA: 'Categoría creada exitosamente',
  CATEGORIA_ACTUALIZADA: 'Categoría actualizada exitosamente',
  CATEGORIA_ELIMINADA: 'Categoría eliminada exitosamente'
}

// ============================================
// HOOK PRINCIPAL: useGetCategorias
// Obtiene todas las categorías
// ============================================

export const useGetCategorias = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasAPI.obtenerTodas
  })
  
  return {
    categorias: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetCategoria
// Obtiene UNA categoría específica por ID
// ============================================

export const useGetCategoria = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categorias', id],
    queryFn: () => categoriasAPI.obtenerPorId(id),
    enabled: !!id
  })
  
  return {
    categoria: data?.data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useGetCategoriasPadre
// Obtiene solo las categorías padre
// ============================================

export const useGetCategoriasPadre = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias', 'padres'],
    queryFn: categoriasAPI.obtenerPadres
  })
  
  return {
    categoriasPadre: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetSubcategorias
// Obtiene subcategorías de una categoría padre
// ============================================

export const useGetSubcategorias = (padreId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias', 'subcategorias', padreId],
    queryFn: () => categoriasAPI.obtenerHijas(padreId),  // ✅ CORREGIDO: usar obtenerHijas
    enabled: !!padreId
  })
  
  return {
    subcategorias: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useCreateCategoria
// Crea una nueva categoría
// ============================================

export const useCreateCategoria = () => {
  const queryClient = useQueryClient()
  
  const { mutate, mutateAsync, isLoading, error } = useMutation({
    mutationFn: categoriasAPI.crear,
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias', 'padres'] })
      console.log('✅', SUCCESS_MESSAGES.CATEGORIA_CREADA)
    },
    
    onError: (error) => {
      console.error('❌ Error al crear categoría:', error)
    }
  })
  
  return {
    createCategoria: mutateAsync,
    createCategoriaSync: mutate,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useUpdateCategoria
// Actualiza una categoría existente
// ============================================

export const useUpdateCategoria = () => {
  const queryClient = useQueryClient()
  
  const { mutate, mutateAsync, isLoading, error } = useMutation({
    mutationFn: ({ id, ...data }) => categoriasAPI.actualizar(id, data),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias', 'padres'] })
      queryClient.invalidateQueries({ queryKey: ['categorias', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['categorias', 'subcategorias'] })
      
      console.log('✅', SUCCESS_MESSAGES.CATEGORIA_ACTUALIZADA)
    },
    
    onError: (error) => {
      console.error('❌ Error al actualizar categoría:', error)
    }
  })
  
  return { mutate, mutateAsync, isLoading, error }
}

// ============================================
// HOOK: useDeleteCategoria
// Elimina una categoría
// ============================================

export const useDeleteCategoria = () => {
  const queryClient = useQueryClient()
  
  const { mutate, mutateAsync, isLoading, error } = useMutation({
    mutationFn: categoriasAPI.eliminar,
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias', 'padres'] })
      
      console.log('✅', SUCCESS_MESSAGES.CATEGORIA_ELIMINADA)
    },
    
    onError: (error) => {
      console.error('❌ Error al eliminar categoría:', error)
    }
  })
  
  return {
    deleteCategoria: mutateAsync,
    deleteCategoriaSync: mutate,
    isLoading,
    error
  }
}

// Exportación por defecto
const useCategorias = useGetCategorias
export default useCategorias