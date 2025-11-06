// ============================================
// CUSTOM HOOK: useCategorias
// Maneja todas las operaciones con categorías
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasAPI } from '../api'
import { SUCCESS_MESSAGES } from '../utils/constants'

// ============================================
// HOOK PRINCIPAL: useGetCategorias
// Obtiene todas las categorías
// ============================================

/**
 * Hook para obtener todas las categorías
 * 
 * @returns {Object} - { categorias, isLoading, error, refetch }
 * 
 * @example
 * const { categorias, isLoading } = useGetCategorias()
 * 
 * EXPLICACIÓN:
 * - useQuery es un hook de React Query que maneja el fetching de datos
 * - queryKey: identificador único para el cache
 * - queryFn: función que obtiene los datos
 * - React Query automáticamente:
 *   ✅ Cachea los datos
 *   ✅ Maneja el estado de carga
 *   ✅ Maneja errores
 *   ✅ Revalida cuando es necesario
 */
export const useGetCategorias = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias'],           // Identificador para el cache
    queryFn: categoriasAPI.obtenerTodas // Función que llama a la API
  })
  
  return {
    categorias: data || [],   // Si data es null/undefined, devolver array vacío
    isLoading,                // true mientras carga, false cuando termina
    error,                    // null si todo OK, objeto de error si falla
    refetch                   // Función para recargar manualmente
  }
}

// ============================================
// HOOK: useGetCategoria
// Obtiene UNA categoría específica por ID
// ============================================

/**
 * Hook para obtener una categoría específica
 * 
 * @param {number} id - ID de la categoría
 * @returns {Object} - { categoria, isLoading, error }
 * 
 * @example
 * const { categoria, isLoading } = useGetCategoria(1)
 */
export const useGetCategoria = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categorias', id],      // Cache específico por ID
    queryFn: () => categoriasAPI.obtenerPorId(id),
    enabled: !!id                      // Solo ejecutar si hay un ID válido
  })
  
  return {
    categoria: data || null,
    isLoading,
    error
  }
}

// ============================================
// HOOK: useGetCategoriasPadre
// Obtiene solo las categorías padre (sin padre_id)
// ============================================

/**
 * Hook para obtener solo categorías padre
 * 
 * @returns {Object} - { categoriasPadre, isLoading, error, refetch }
 * 
 * @example
 * const { categoriasPadre, isLoading } = useGetCategoriasPadre()
 * 
 * EXPLICACIÓN:
 * - Categorías padre son las que NO tienen padre_id
 * - Son las que se muestran en el Dashboard principal
 * - Las subcategorías tienen un padre_id que apunta a una categoría padre
 * 
 * IMPORTANTE:
 * - El queryKey debe ser ['categorias', 'padres'] (plural)
 * - Esto coincide con la invalidación en useUpdateCategoria
 */
export const useGetCategoriasPadre = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias', 'padres'],  // ✅ CORREGIDO: 'padres' en plural
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

/**
 * Hook para obtener subcategorías
 * 
 * @param {number} padreId - ID de la categoría padre
 * @returns {Object} - { subcategorias, isLoading, error, refetch }
 * 
 * @example
 * const { subcategorias, isLoading } = useGetSubcategorias(1)
 * 
 * EXPLICACIÓN:
 * - Obtiene las categorías que tienen padre_id = padreId
 * - Se usa en la página de Subcategorías (Nivel 2)
 */
export const useGetSubcategorias = (padreId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias', 'subcategorias', padreId],
    queryFn: () => categoriasAPI.obtenerSubcategorias(padreId),
    enabled: !!padreId  // Solo ejecutar si hay un padreId válido
  })
  
  return {
    subcategorias: data || [],
    isLoading,
    error,
    refetch
  }
}

// ============================================
// HOOK: useCreateCategoria
// Crea una nueva categoría
// ============================================

/**
 * Hook para crear una nueva categoría
 * 
 * @returns {Object} - { createCategoria, createCategoriaSync, isLoading, error }
 * 
 * @example
 * const { createCategoria, isLoading } = useCreateCategoria()
 * 
 * // Luego en un formulario:
 * const handleSubmit = async (data) => {
 *   await createCategoria(data)
 * }
 * 
 * EXPLICACIÓN DE useMutation:
 * - useMutation es para operaciones que MODIFICAN datos (POST, PUT, DELETE)
 * - mutationFn: función que hace la operación
 * - onSuccess: se ejecuta cuando la operación es exitosa
 * - onError: se ejecuta si hay un error
 */
export const useCreateCategoria = () => {
  const queryClient = useQueryClient()
  
  const { mutate, mutateAsync, isLoading, error } = useMutation({
    mutationFn: categoriasAPI.crear,
    
    onSuccess: () => {
      // ✅ Invalidar el cache para que se recarguen las categorías
      // Esto hace que useGetCategorias se ejecute automáticamente de nuevo
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias', 'padres'] })
      
      // Mostrar mensaje de éxito
      console.log('✅', SUCCESS_MESSAGES.CATEGORIA_CREADA)
    },
    
    onError: (error) => {
      // ❌ Manejar error
      console.error('❌ Error al crear categoría:', error)
    }
  })
  
  return {
    createCategoria: mutateAsync,  // Versión async (con await)
    createCategoriaSync: mutate,   // Versión sync (sin await)
    isLoading,
    error
  }
}

// ============================================
// HOOK: useUpdateCategoria
// Actualiza una categoría existente
// ============================================

/**
 * Hook para actualizar una categoría
 * 
 * @returns {Object} - { mutate, mutateAsync, isLoading, error }
 * 
 * @example
 * const updateCategoria = useUpdateCategoria()
 * 
 * // Opción 1: Con mutate (callbacks)
 * updateCategoria.mutate(
 *   { id: 1, nombre: 'Nuevo', emoji: '🎉' },
 *   {
 *     onSuccess: () => console.log('Listo'),
 *     onError: (err) => console.error(err)
 *   }
 * )
 * 
 * // Opción 2: Con mutateAsync (async/await)
 * await updateCategoria.mutateAsync({ id: 1, nombre: 'Nuevo' })
 * 
 * IMPORTANTE:
 * - Debe enviar TODOS los campos: { id, nombre, emoji, padre_id }
 * - El backend requiere 'nombre' como obligatorio
 * - Invalida automáticamente el cache para actualizar la UI
 */
export const useUpdateCategoria = () => {
  const queryClient = useQueryClient()
  
  const { mutate, mutateAsync, isLoading, error } = useMutation({
    mutationFn: ({ id, ...data }) => categoriasAPI.actualizar(id, data),
    
    onSuccess: (data, variables) => {
      // ✅ Invalidar TODAS las queries relacionadas con categorías
      // Esto asegura que todos los componentes se actualicen
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias', 'padres'] })
      queryClient.invalidateQueries({ queryKey: ['categorias', variables.id] })
      
      console.log('✅', SUCCESS_MESSAGES.CATEGORIA_ACTUALIZADA)
      console.log('🔄 Cache invalidado - categorías actualizadas')
    },
    
    onError: (error) => {
      console.error('❌ Error al actualizar categoría:', error)
    }
  })
  
  // ✅ Devolver el objeto completo con mutate y mutateAsync
  return { mutate, mutateAsync, isLoading, error }
}

// ============================================
// HOOK: useDeleteCategoria
// Elimina una categoría
// ============================================

/**
 * Hook para eliminar una categoría
 * 
 * @returns {Object} - { deleteCategoria, deleteCategoriaSync, isLoading, error }
 * 
 * @example
 * const { deleteCategoria, isLoading } = useDeleteCategoria()
 * 
 * // Luego:
 * if (confirm('¿Estás seguro?')) {
 *   await deleteCategoria(1)
 * }
 * 
 * NOTA IMPORTANTE:
 * - Antes de eliminar, verificar que no tenga subcategorías
 * - El backend debería manejar esta validación también
 */
export const useDeleteCategoria = () => {
  const queryClient = useQueryClient()
  
  const { mutate, mutateAsync, isLoading, error } = useMutation({
    mutationFn: categoriasAPI.eliminar,
    
    onSuccess: () => {
      // ✅ Invalidar cache para actualizar la lista
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

// ============================================
// EXPORTACIÓN POR DEFECTO
// Hook principal más común
// ============================================

/**
 * Hook principal - Alias de useGetCategorias
 * 
 * @example
 * import useCategorias from './hooks/useCategorias'
 * 
 * const { categorias, isLoading } = useCategorias()
 */
const useCategorias = useGetCategorias

export default useCategorias

/**
 * ============================================
 * RESUMEN DE EXPORTS
 * ============================================
 * 
 * QUERIES (lectura):
 * - useGetCategorias()         → Todas las categorías
 * - useGetCategoria(id)        → Una categoría por ID
 * - useGetCategoriasPadre()    → Solo categorías padre
 * - useGetSubcategorias(id)    → Subcategorías de una padre
 * 
 * MUTATIONS (escritura):
 * - useCreateCategoria()       → Crear nueva categoría
 * - useUpdateCategoria()       → Actualizar categoría (devuelve {mutate, mutateAsync})
 * - useDeleteCategoria()       → Eliminar categoría
 * 
 * DEFAULT:
 * - useCategorias()            → Alias de useGetCategorias()
 * 
 * ============================================
 * NOTAS SOBRE REACT QUERY
 * ============================================
 * 
 * 1. QUERY KEYS:
 *    - ['categorias'] → Todas las categorías
 *    - ['categorias', 'padres'] → Solo categorías padre
 *    - ['categorias', id] → Categoría específica
 *    - ['categorias', 'subcategorias', padreId] → Subcategorías
 * 
 * 2. INVALIDACIÓN DE CACHE:
 *    Cuando invalidas ['categorias'], React Query también invalida:
 *    - ['categorias', 'padres']
 *    - ['categorias', 123]
 *    - ['categorias', 'subcategorias', 456]
 *    
 *    Porque todas empiezan con ['categorias']
 * 
 * 3. mutate vs mutateAsync:
 *    - mutate: Usa callbacks (onSuccess, onError)
 *    - mutateAsync: Devuelve Promise (usa async/await)
 *    
 *    Ambos hacen lo mismo, elige el que prefieras.
 * 
 * 4. OPTIMISTIC UPDATES:
 *    Si quieres que la UI se actualice antes de que responda el servidor,
 *    usa onMutate para actualizar el cache manualmente.
 *    (Ver documentación avanzada de React Query)
 */