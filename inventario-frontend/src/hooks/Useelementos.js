// ============================================
// CUSTOM HOOKS: useElementos
// Maneja todas las operaciones con elementos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { elementosAPI } from '../api'

/**
 * ============================================
 * HOOKS DE LECTURA (useQuery)
 * ============================================
 */

/**
 * Hook: Obtener elementos de una subcategoría
 * 
 * @param {number} subcategoriaId - ID de la subcategoría
 * @returns {Object} { elementos, isLoading, error, refetch }
 * 
 * @example
 * const { elementos, isLoading } = useGetElementos(5)
 * 
 * EXPLICACIÓN:
 * - useQuery ejecuta la petición automáticamente
 * - queryKey identifica esta petición en el cache
 * - Si vuelves a llamar con el mismo ID, usa el cache
 * - enabled: solo ejecuta si hay subcategoriaId
 * - select: transforma los datos para agregar totales calculados
 * 
 * CACHE:
 * - Se guarda en: ['elementos', 'subcategoria', 5]
 * - Dura 5 minutos (configurado en App.jsx)
 * - Se revalida automáticamente en ciertas situaciones
 * 
 * RESPUESTA:
 * Cada elemento incluye:
 * - Si requiere_series = TRUE: 
 *   - total_series (cantidad de series)
 *   - series_disponibles, series_alquiladas, etc.
 * 
 * - Si requiere_series = FALSE:
 *   - cantidad_total (suma de todos los lotes)
 *   - cantidad_por_estado { nuevo: X, bueno: Y, ... }
 */
export const useGetElementos = (subcategoriaId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elementos', 'subcategoria', subcategoriaId],
    queryFn: () => elementosAPI.obtenerPorSubcategoria(subcategoriaId),
    enabled: !!subcategoriaId,  // Solo ejecuta si hay ID

    // Transformar los datos antes de devolverlos
    select: (response) => {
      console.log('🔍 [UseElementos] Respuesta completa:', response)
      const elementos = response?.data || []
      const subcategoria = response?.subcategoria || null
      console.log('🔍 [UseElementos] Elementos extraídos:', elementos)
      console.log('🔍 [UseElementos] Subcategoría extraída:', subcategoria)

      // Enriquecer cada elemento con totales calculados
      const elementosEnriquecidos = elementos.map(elemento => {
        // ============================================
        // ELEMENTOS CON LOTES
        // ============================================
        if (!elemento.requiere_series) {
          // Si el backend ya envía lotes, calcular totales
          if (elemento.lotes && Array.isArray(elemento.lotes)) {
            const cantidad_total = elemento.lotes.reduce(
              (total, lote) => total + (lote.cantidad || 0),
              0
            )
            
            const cantidad_por_estado = elemento.lotes.reduce((stats, lote) => {
              const estado = lote.estado || 'sin_estado'
              stats[estado] = (stats[estado] || 0) + (lote.cantidad || 0)
              return stats
            }, {})
            
            return {
              ...elemento,
              cantidad_total,
              cantidad_por_estado
            }
          }
          
          // Si el backend solo envía resumen, usar esos valores
          return {
            ...elemento,
            cantidad_total: elemento.cantidad_total || elemento.total_cantidad || 0
          }
        }
        
        // ============================================
        // ELEMENTOS CON SERIES
        // ============================================
        if (elemento.requiere_series) {
          // Si el backend ya envía series, calcular estadísticas
          if (elemento.series && Array.isArray(elemento.series)) {
            const total_series = elemento.series.length
            
            const series_por_estado = elemento.series.reduce((stats, serie) => {
              const estado = serie.estado || 'sin_estado'
              stats[estado] = (stats[estado] || 0) + 1
              return stats
            }, {
              disponible: 0,
              alquilado: 0,
              mantenimiento: 0,
              dañado: 0,
              nuevo: 0
            })
            
            const series_disponibles = (series_por_estado.disponible || 0) + (series_por_estado.nuevo || 0)
            
            return {
              ...elemento,
              total_series,
              series_por_estado,
              series_disponibles
            }
          }
          
          // Si el backend solo envía resumen, usar esos valores
          return {
            ...elemento,
            total_series: elemento.total_series || elemento.cantidad || 0,
            series_disponibles: elemento.series_disponibles || elemento.disponibles || 0
          }
        }

        return elemento
      })

      return {
        elementos: elementosEnriquecidos,
        subcategoria
      }
    }
  })

  return {
    elementos: data?.elementos || [],
    subcategoria: data?.subcategoria || null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook: Obtener un elemento específico con detalles completos
 * 
 * @param {number} elementoId - ID del elemento
 * @returns {Object} { elemento, isLoading, error }
 * 
 * @example
 * const { elemento, isLoading } = useGetElemento(1)
 * 
 * RESPUESTA INCLUYE:
 * - Si requiere_series = TRUE: array de series + cantidad total
 * - Si requiere_series = FALSE: array de lotes + cantidad total + estadísticas
 * - Información completa del elemento
 * 
 * @example
 * // Elemento con series:
 * {
 *   id: 1,
 *   nombre: "Carpa Doite 3x3",
 *   requiere_series: true,
 *   cantidad: 5,  // ← Total de series
 *   series: [
 *     { id: 1, numero_serie: "DOITE-001", estado: "disponible" },
 *     { id: 2, numero_serie: "DOITE-002", estado: "alquilado" },
 *     { id: 3, numero_serie: "DOITE-003", estado: "disponible" },
 *     { id: 4, numero_serie: "DOITE-004", estado: "mantenimiento" },
 *     { id: 5, numero_serie: "DOITE-005", estado: "disponible" }
 *   ]
 * }
 * 
 * // Elemento con lotes:
 * {
 *   id: 2,
 *   nombre: "Silla Plástica",
 *   requiere_series: false,
 *   cantidad_total: 150,  // ← TOTAL calculado (suma de lotes)
 *   lotes: [
 *     { id: 1, cantidad: 50, estado: "nuevo", ubicacion: "Bodega A" },
 *     { id: 2, cantidad: 70, estado: "bueno", ubicacion: "Bodega B" },
 *     { id: 3, cantidad: 20, estado: "regular", ubicacion: "Bodega A" },
 *     { id: 4, cantidad: 10, estado: "malo", ubicacion: "Taller" }
 *   ],
 *   estadisticas_lotes: {  // ← Calculado automáticamente
 *     nuevo: 50,
 *     bueno: 70,
 *     regular: 20,
 *     malo: 10
 *   }
 * }
 */
export const useGetElemento = (elementoId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['elementos', elementoId],
    queryFn: () => elementosAPI.obtenerPorId(elementoId),
    enabled: !!elementoId,
    
    // Transformar los datos antes de devolverlos
    select: (response) => {
      const elemento = response?.data
      
      if (!elemento) return null
      
      // ============================================
      // ELEMENTOS CON LOTES
      // ============================================
      if (!elemento.requiere_series && elemento.lotes) {
        // Calcular cantidad total (suma de todos los lotes)
        const cantidad_total = elemento.lotes.reduce(
          (total, lote) => total + (lote.cantidad || 0), 
          0
        )
        
        // Calcular estadísticas por estado
        const estadisticas_lotes = elemento.lotes.reduce((stats, lote) => {
          const estado = lote.estado || 'sin_estado'
          stats[estado] = (stats[estado] || 0) + (lote.cantidad || 0)
          return stats
        }, {})
        
        // Calcular distribución por ubicación
        const lotes_por_ubicacion = elemento.lotes.reduce((ubicaciones, lote) => {
          const ubicacion = lote.ubicacion || 'Sin ubicación'
          ubicaciones[ubicacion] = (ubicaciones[ubicacion] || 0) + (lote.cantidad || 0)
          return ubicaciones
        }, {})
        
        return {
          ...elemento,
          cantidad_total,
          estadisticas_lotes,
          lotes_por_ubicacion
        }
      }
      
      // ============================================
      // ELEMENTOS CON SERIES
      // ============================================
      if (elemento.requiere_series && elemento.series) {
        // Total de series
        const total_series = elemento.series.length
        
        // Estadísticas por estado
        const estadisticas_series = elemento.series.reduce((stats, serie) => {
          const estado = serie.estado || 'sin_estado'
          stats[estado] = (stats[estado] || 0) + 1
          return stats
        }, {
          disponible: 0,
          alquilado: 0,
          mantenimiento: 0,
          dañado: 0,
          nuevo: 0
        })
        
        // Distribución por ubicación
        const series_por_ubicacion = elemento.series.reduce((ubicaciones, serie) => {
          const ubicacion = serie.ubicacion || 'Sin ubicación'
          ubicaciones[ubicacion] = (ubicaciones[ubicacion] || 0) + 1
          return ubicaciones
        }, {})
        
        // Series disponibles para alquilar (disponible + nuevo)
        const series_disponibles = (estadisticas_series.disponible || 0) + (estadisticas_series.nuevo || 0)
        
        return {
          ...elemento,
          total_series,
          estadisticas_series,
          series_por_ubicacion,
          series_disponibles  // ← Útil para validar si hay stock
        }
      }
      
      return elemento
    }
  })
  
  return {
    elemento: data || null,
    isLoading,
    error
  }
}

/**
 * Hook: Obtener estadísticas de un elemento
 * 
 * @param {number} elementoId - ID del elemento
 * @returns {Object} { estadisticas, isLoading, error }
 * 
 * @example
 * const { estadisticas, isLoading } = useGetEstadisticasElemento(1)
 * 
 * // Si es por series:
 * estadisticas = {
 *   total: 10,
 *   disponible: 7,
 *   alquilado: 2,
 *   mantenimiento: 1
 * }
 * 
 * // Si es por lotes:
 * estadisticas = {
 *   total: 150,
 *   nuevo: 50,
 *   bueno: 70,
 *   regular: 20,
 *   malo: 10
 * }
 */
export const useGetEstadisticasElemento = (elementoId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['elementos', elementoId, 'estadisticas'],
    queryFn: () => elementosAPI.obtenerEstadisticas(elementoId),
    enabled: !!elementoId
  })
  
  return {
    estadisticas: data?.data || null,
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
 * Hook: Crear un nuevo elemento
 * 
 * @returns {Object} { createElemento, isLoading, error }
 * 
 * @example
 * const { createElemento, isLoading } = useCreateElemento()
 * 
 * // Crear elemento POR SERIE:
 * await createElemento({
 *   nombre: "Carpa Doite 3x3",
 *   descripcion: "Carpa impermeable...",
 *   requiere_series: true,
 *   categoria_id: 5,
 *   material_id: 1,
 *   unidad_id: 3
 * })
 * 
 * // Crear elemento POR LOTE:
 * await createElemento({
 *   nombre: "Silla Plástica",
 *   requiere_series: false,
 *   categoria_id: 5,
 *   cantidad_inicial: 50,      // ← Requerido para lotes
 *   estado_inicial: "nuevo",
 *   ubicacion_inicial: "Bodega A"
 * })
 * 
 * DESPUÉS DE CREAR:
 * - Invalida el cache de elementos de esa subcategoría
 * - La lista se actualiza automáticamente
 * - El componente se re-renderiza con los nuevos datos
 */
export const useCreateElemento = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => elementosAPI.crear(data),
    onSuccess: (_, data) => {
      // Invalida lista de elementos de la subcategoría correspondiente
      queryClient.invalidateQueries({
        queryKey: ['elementos', 'subcategoria', data.categoria_id]
      })
    }
  })
}

/**
 * Hook: Actualizar un elemento existente
 * 
 * @returns {Object} { updateElemento, isLoading, error }
 * 
 * @example
 * const { updateElemento } = useUpdateElemento()
 * 
 * await updateElemento({
0000 *   id: 1,
 *   nombre: "Carpa Doite 3x3 Premium",
 *   descripcion: "Nueva descripción..."
 * })
 * 
 * IMPORTANTE:
 * - NO se puede cambiar requiere_series después de crear
 * - Backend valida esto
 * 
 * DESPUÉS DE ACTUALIZAR:
 * - Invalida el cache del elemento específico
 * - Invalida la lista de elementos de la subcategoría
 * - Componentes se actualizan automáticamente
 */
export const useUpdateElemento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => elementosAPI.actualizar(data.id, data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: ['elementos', 'subcategoria', data.categoria_id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elemento', data.id]
      })
    }
  })
}

/**
 * Hook: Eliminar un elemento
 * 
 * @returns {Object} { deleteElemento, isLoading, error }
 * 
 * @example
 * const { deleteElemento } = useDeleteElemento()
 * 
 * if (confirm('¿Estás seguro?')) {
 *   await deleteElemento(1)
 * }
 * 
 * VALIDACIONES DEL BACKEND:
 * - No se puede eliminar si tiene series activas
 * - No se puede eliminar si tiene lotes con cantidad > 0
 * - Debe estar "vacío" para eliminar
 * 
 * DESPUÉS DE ELIMINAR:
 * - Invalida todas las queries de elementos
 * - El elemento desaparece de la lista automáticamente
 */
export const useDeleteElemento = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: elementosAPI.eliminar,
    
    onSuccess: () => {
      // Invalidar todo el cache de elementos
      queryClient.invalidateQueries({ 
        queryKey: ['elementos'] 
      })
      
      console.log('✅ Elemento eliminado exitosamente')
    },
    
    onError: (error) => {
      console.error('❌ Error al eliminar elemento:', error)
    }
  })
  
  return {
    deleteElemento: mutateAsync,
    isLoading,
    error
  }
}

/**
 * ============================================
 * HOOK POR DEFECTO
 * ============================================
 */

// Export por defecto (alias de useGetElementos)
const useElementos = useGetElementos
export default useElementos

/**
 * ============================================
 * RESUMEN DE EXPORTS
 * ============================================
 * 
 * LECTURA:
 * - useGetElementos(subcategoriaId)
 * - useGetElemento(elementoId)
 * - useGetEstadisticasElemento(elementoId)
 * 
 * ESCRITURA:
 * - useCreateElemento()
 * - useUpdateElemento()
 * - useDeleteElemento()
 * 
 * DEFAULT:
 * - useElementos() → alias de useGetElementos()
 * 
 * ============================================
 * EJEMPLO DE USO EN COMPONENTE
 * ============================================
 * 
 * import { useGetElementos, useCreateElemento } from '@/hooks/UseElementos'
 * 
 * function Elementos() {
 *   const { elementos, isLoading } = useGetElementos(5)
 *   const { createElemento } = useCreateElemento()
 *   
 *   const handleCreate = async (data) => {
 *     await createElemento(data)
 *     // Lista se actualiza automáticamente
 *   }
 *   
 *   if (isLoading) return <Spinner />
 *   
 *   return (
 *     <div>
 *       {elementos.map(elemento => (
 *         <ElementoCard key={elemento.id} elemento={elemento} />
 *       ))}
 *     </div>
 *   )
 * }
 */