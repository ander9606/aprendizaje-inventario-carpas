// ============================================
// CUSTOM HOOK: useElementosCompuestos
// Maneja operaciones con elementos compuestos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { elementosCompuestosAPI } from '../api'

// ============================================
// HOOK: useGetElementosCompuestos
// Obtiene todos los elementos compuestos
// ============================================

export const useGetElementosCompuestos = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elementos-compuestos'],
    queryFn: elementosCompuestosAPI.obtenerTodos
  })

  return {
    elementos: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetElementosCompuestosPorCategoria
// Obtiene elementos compuestos por categoría
// ============================================

export const useGetElementosCompuestosPorCategoria = (categoriaId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elementos-compuestos', 'categoria', categoriaId],
    queryFn: () => elementosCompuestosAPI.obtenerPorCategoria(categoriaId),
    enabled: !!categoriaId
  })

  return {
    elementos: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetElementoCompuesto
// Obtiene UN elemento compuesto por ID
// ============================================

export const useGetElementoCompuesto = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elementos-compuestos', id],
    queryFn: () => elementosCompuestosAPI.obtenerPorId(id),
    enabled: !!id
  })

  return {
    elemento: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetElementoCompuestoConComponentes
// Obtiene elemento con todos sus componentes
// ============================================

export const useGetElementoCompuestoConComponentes = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elementos-compuestos', id, 'completo'],
    queryFn: () => elementosCompuestosAPI.obtenerConComponentes(id),
    enabled: !!id
  })

  return {
    elemento: data?.data || null,
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useGetComponentesAgrupados
// Obtiene componentes agrupados por tipo
// ============================================

export const useGetComponentesAgrupados = (elementoId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elementos-compuestos', elementoId, 'componentes'],
    queryFn: () => elementosCompuestosAPI.obtenerComponentesAgrupados(elementoId),
    enabled: !!elementoId
  })

  return {
    componentes: data?.data?.componentes || {
      fijos: [],
      alternativas: [],
      adicionales: []
    },
    elemento: data?.data?.elemento || null,
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useCreateElementoCompuesto
// Crea un nuevo elemento compuesto
// ============================================

export const useCreateElementoCompuesto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: elementosCompuestosAPI.crear,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      console.log('✅ Elemento compuesto creado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al crear elemento compuesto:', error)
    }
  })

  return {
    createElemento: mutateAsync,
    createElementoSync: mutate,
    isPending,
    error
  }
}

// ============================================
// HOOK: useUpdateElementoCompuesto
// Actualiza un elemento compuesto
// ============================================

export const useUpdateElementoCompuesto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ id, ...data }) => elementosCompuestosAPI.actualizar(id, data),
    retry: 0,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.id] })
      console.log('✅ Elemento compuesto actualizado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al actualizar elemento compuesto:', error)
    }
  })

  return {
    updateElemento: mutateAsync,
    updateElementoSync: mutate,
    isPending,
    error
  }
}

// ============================================
// HOOK: useDeleteElementoCompuesto
// Elimina un elemento compuesto
// ============================================

export const useDeleteElementoCompuesto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: elementosCompuestosAPI.eliminar,
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      console.log('✅ Elemento compuesto eliminado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al eliminar elemento compuesto:', error)
    }
  })

  return {
    deleteElemento: mutateAsync,
    deleteElementoSync: mutate,
    isPending,
    error
  }
}

// ============================================
// HOOK: useActualizarComponentes
// Actualiza todos los componentes de un elemento
// ============================================

export const useActualizarComponentes = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ elementoId, componentes }) =>
      elementosCompuestosAPI.actualizarComponentes(elementoId, componentes),
    retry: 0,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.elementoId] })
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.elementoId, 'componentes'] })
      console.log('✅ Componentes actualizados exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al actualizar componentes:', error)
    }
  })

  return {
    actualizarComponentes: mutateAsync,
    actualizarComponentesSync: mutate,
    isPending,
    error
  }
}

// ============================================
// HOOK: useAgregarComponente
// Agrega un componente a un elemento
// ============================================

export const useAgregarComponente = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ elementoId, componente }) =>
      elementosCompuestosAPI.agregarComponente(elementoId, componente),
    retry: 0,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.elementoId] })
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.elementoId, 'componentes'] })
      console.log('✅ Componente agregado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al agregar componente:', error)
    }
  })

  return {
    agregarComponente: mutateAsync,
    agregarComponenteSync: mutate,
    isPending,
    error
  }
}

// ============================================
// HOOK: useEliminarComponente
// Elimina un componente de un elemento
// ============================================

export const useEliminarComponente = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ elementoId, componenteId }) =>
      elementosCompuestosAPI.eliminarComponente(elementoId, componenteId),
    retry: 0,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.elementoId] })
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.elementoId, 'componentes'] })
      console.log('✅ Componente eliminado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al eliminar componente:', error)
    }
  })

  return {
    eliminarComponente: mutateAsync,
    eliminarComponenteSync: mutate,
    isPending,
    error
  }
}

// Exportación por defecto
export default useGetElementosCompuestos
