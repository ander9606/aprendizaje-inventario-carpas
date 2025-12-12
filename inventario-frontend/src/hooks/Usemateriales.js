// ============================================
// CUSTOM HOOK: useMateriales
// Maneja todas las operaciones con materiales
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import materialesAPI from '../api/apiMateriales'

/**
 * ============================================
 * HOOKS DE LECTURA (useQuery)
 * ============================================
 */

/**
 * Hook: Obtener todos los materiales
 *
 * @returns {Object} { materiales, isLoading, error, refetch }
 *
 * @example
 * const { materiales, isLoading } = useGetMateriales()
 */
export const useGetMateriales = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['materiales'],
    queryFn: materialesAPI.obtenerTodos
  })

  return {
    materiales: data?.data || [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook: Obtener un material específico
 *
 * @param {number} materialId - ID del material
 * @returns {Object} { material, isLoading, error }
 *
 * @example
 * const { material, isLoading } = useGetMaterial(1)
 */
export const useGetMaterial = (materialId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['materiales', materialId],
    queryFn: () => materialesAPI.obtenerPorId(materialId),
    enabled: !!materialId
  })

  return {
    material: data?.data || null,
    isLoading,
    error
  }
}

/**
 * ============================================
 * HOOKS DE ESCRITURA (useMutation)
 * ============================================
 */

/**
 * Hook: Crear un nuevo material
 *
 * @returns {Object} { createMaterial, isLoading, error }
 *
 * @example
 * const { createMaterial } = useCreateMaterial()
 *
 * await createMaterial({
 *   nombre: "Lona",
 *   descripcion: "Material impermeable"
 * })
 */
export const useCreateMaterial = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: materialesAPI.crear,

    onSuccess: () => {
      // Invalidar cache de materiales
      queryClient.invalidateQueries({
        queryKey: ['materiales']
      })

      console.log('✅ Material creado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al crear material:', error)
    }
  })

  return {
    createMaterial: mutateAsync,
    isLoading,
    error
  }
}

/**
 * Hook: Actualizar un material existente
 *
 * @returns {Object} { updateMaterial, isLoading, error }
 *
 * @example
 * const { updateMaterial } = useUpdateMaterial()
 *
 * await updateMaterial({
 *   id: 1,
 *   nombre: "Lona Premium"
 * })
 */
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: ({ id, ...data }) => materialesAPI.actualizar(id, data),

    onSuccess: (_, variables) => {
      // Invalidar cache del material específico
      queryClient.invalidateQueries({
        queryKey: ['materiales', variables.id]
      })

      // Invalidar lista de materiales
      queryClient.invalidateQueries({
        queryKey: ['materiales']
      })

      console.log('✅ Material actualizado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al actualizar material:', error)
    }
  })

  return {
    updateMaterial: mutateAsync,
    isLoading,
    error
  }
}

/**
 * Hook: Eliminar un material
 *
 * @returns {Object} { deleteMaterial, isLoading, error }
 *
 * @example
 * const { deleteMaterial } = useDeleteMaterial()
 *
 * if (confirm('¿Eliminar material?')) {
 *   await deleteMaterial(1)
 * }
 */
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: materialesAPI.eliminar,

    onSuccess: () => {
      // Invalidar cache de materiales
      queryClient.invalidateQueries({
        queryKey: ['materiales']
      })

      console.log('✅ Material eliminado exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al eliminar material:', error)
    }
  })

  return {
    deleteMaterial: mutateAsync,
    isLoading,
    error
  }
}

/**
 * ============================================
 * HOOK POR DEFECTO
 * ============================================
 */

const useMateriales = useGetMateriales
export default useMateriales
