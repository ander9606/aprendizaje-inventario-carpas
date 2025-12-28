// ============================================
// CUSTOM HOOK: useElementosCompuestos
// Maneja operaciones con elementos compuestos (plantillas de productos)
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
// Obtiene elementos compuestos filtrados por categoría
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
// Obtiene un elemento compuesto por ID
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
// HOOK: useCreateElementoCompuesto
// Crea un nuevo elemento compuesto
// ============================================

export const useCreateElementoCompuesto = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: elementosCompuestosAPI.crear,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      console.log('✅ Elemento compuesto creado')
    },

    onError: (error) => {
      console.error('❌ Error al crear elemento compuesto:', error)
    }
  })

  return {
    createElemento: mutateAsync,
    createElementoSync: mutate,
    isLoading: isPending,
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

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos', variables.id] })
      console.log('✅ Elemento compuesto actualizado')
    },

    onError: (error) => {
      console.error('❌ Error al actualizar elemento compuesto:', error)
    }
  })

  return {
    updateElemento: mutateAsync,
    updateElementoSync: mutate,
    isLoading: isPending,
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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elementos-compuestos'] })
      console.log('✅ Elemento compuesto eliminado')
    },

    onError: (error) => {
      console.error('❌ Error al eliminar elemento compuesto:', error)
    }
  })

  return {
    deleteElemento: mutateAsync,
    deleteElementoSync: mutate,
    isLoading: isPending,
    error
  }
}

// ============================================
// HOOKS PARA COMPONENTES DEL ELEMENTO COMPUESTO
// ============================================

// ============================================
// HOOK: useGetComponentes
// Obtiene los componentes de un elemento (agrupados por tipo)
// ============================================

export const useGetComponentes = (elementoId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elementos-compuestos', elementoId, 'componentes'],
    queryFn: () => elementosCompuestosAPI.obtenerComponentes(elementoId),
    enabled: !!elementoId
  })

  // Los componentes vienen agrupados por tipo: { fijos, alternativas, adicionales }
  return {
    componentes: data?.data || { fijos: [], alternativas: [], adicionales: [] },
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useAddComponente
// Agrega un componente a un elemento
// ============================================

export const useAddComponente = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ elementoId, componente }) =>
      elementosCompuestosAPI.agregarComponente(elementoId, componente),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId, 'componentes']
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId]
      })
      console.log('✅ Componente agregado')
    },

    onError: (error) => {
      console.error('❌ Error al agregar componente:', error)
    }
  })

  return {
    addComponente: mutateAsync,
    addComponenteSync: mutate,
    isLoading: isPending,
    error
  }
}

// ============================================
// HOOK: useUpdateComponente
// Actualiza un componente específico
// ============================================

export const useUpdateComponente = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ elementoId, componenteId, data }) =>
      elementosCompuestosAPI.actualizarComponente(elementoId, componenteId, data),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId, 'componentes']
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId]
      })
      console.log('✅ Componente actualizado')
    },

    onError: (error) => {
      console.error('❌ Error al actualizar componente:', error)
    }
  })

  return {
    updateComponente: mutateAsync,
    updateComponenteSync: mutate,
    isLoading: isPending,
    error
  }
}

// ============================================
// HOOK: useDeleteComponente
// Elimina un componente específico
// ============================================

export const useDeleteComponente = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ elementoId, componenteId }) =>
      elementosCompuestosAPI.eliminarComponente(elementoId, componenteId),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId, 'componentes']
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId]
      })
      console.log('✅ Componente eliminado')
    },

    onError: (error) => {
      console.error('❌ Error al eliminar componente:', error)
    }
  })

  return {
    deleteComponente: mutateAsync,
    deleteComponenteSync: mutate,
    isLoading: isPending,
    error
  }
}

// ============================================
// HOOK: useReplaceComponentes
// Reemplaza todos los componentes de un elemento
// ============================================

export const useReplaceComponentes = () => {
  const queryClient = useQueryClient()

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ elementoId, componentes }) =>
      elementosCompuestosAPI.reemplazarComponentes(elementoId, componentes),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId, 'componentes']
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos-compuestos', variables.elementoId]
      })
      console.log('✅ Componentes reemplazados')
    },

    onError: (error) => {
      console.error('❌ Error al reemplazar componentes:', error)
    }
  })

  return {
    replaceComponentes: mutateAsync,
    replaceComponentesSync: mutate,
    isLoading: isPending,
    error
  }
}

// Exportación por defecto
export default useGetElementosCompuestos
