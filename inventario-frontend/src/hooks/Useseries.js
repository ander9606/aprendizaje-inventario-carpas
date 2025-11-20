// ============================================
// CUSTOM HOOKS: useSeries
// Maneja tracking individual con números de serie
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seriesAPI } from '../api'

/**
 * ¿CUÁNDO USAR ESTOS HOOKS?
 * 
 * Solo para elementos con requiere_series = TRUE
 * 
 * Ejemplos:
 * - Carpas (cada una tiene número único)
 * - Proyectores
 * - Equipos de sonido
 * - Herramientas especializadas
 */

/**
 * ============================================
 * HOOKS DE LECTURA (useQuery)
 * ============================================
 */

/**
 * Hook: Obtener todas las series de un elemento
 * 
 * @param {number} elementoId - ID del elemento
 * @returns {Object} { series, elemento, estadisticas, series_por_ubicacion, total, disponibles, isLoading, error, refetch }
 * 
 * @example
 * const { series, estadisticas, series_por_ubicacion, total, disponibles } = useGetSeries(1)
 * 
 * // series es un array:
 * [
 *   { id: 1, numero_serie: "DOITE-001", estado: "disponible", ubicacion: "Bodega A" },
 *   { id: 2, numero_serie: "DOITE-002", estado: "alquilado", ubicacion: null },
 *   { id: 3, numero_serie: "DOITE-003", estado: "mantenimiento", ubicacion: "Taller" }
 * ]
 * 
 * // estadisticas (calculado automáticamente):
 * {
 *   disponible: 6,
 *   nuevo: 1,
 *   alquilado: 2,
 *   mantenimiento: 1,
 *   dañado: 0
 * }
 * 
 * // series_por_ubicacion (calculado automáticamente):
 * {
 *   "Bodega A": 5,
 *   "Bodega B": 2,
 *   "Taller": 1,
 *   "Sin ubicación": 2
 * }
 * 
 * // total: 10 (total de series)
 * // disponibles: 7 (disponible + nuevo, listas para alquilar)
 */
export const useGetSeries = (elementoId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['series', 'elemento', elementoId],
    queryFn: () => seriesAPI.obtenerPorElemento(elementoId),
    enabled: !!elementoId,
    
    // Transformar datos para agregar estadísticas
    select: (response) => {
      const series = response?.data || []
      const elemento = response?.elemento || null
      
      // Calcular total
      const total = series.length
      
      // Calcular estadísticas por estado
      const estadisticas = series.reduce((stats, serie) => {
        const estado = serie.estado || 'sin_estado'
        stats[estado] = (stats[estado] || 0) + 1
        return stats
      }, {
        disponible: 0,
        nuevo: 0,
        alquilado: 0,
        mantenimiento: 0,
        dañado: 0
      })
      
      // Calcular distribución por ubicación
      const series_por_ubicacion = series.reduce((ubicaciones, serie) => {
        const ubicacion = serie.ubicacion || 'Sin ubicación'
        ubicaciones[ubicacion] = (ubicaciones[ubicacion] || 0) + 1
        return ubicaciones
      }, {})
      
      // Calcular series disponibles para alquilar
      const disponibles = (estadisticas.disponible || 0) + (estadisticas.nuevo || 0)
      
      return {
        series,
        elemento,
        estadisticas,
        series_por_ubicacion,
        total,
        disponibles
      }
    }
  })
  
  return {
    series: data?.series || [],
    elemento: data?.elemento || null,
    estadisticas: data?.estadisticas || {
      disponible: 0,
      nuevo: 0,
      alquilado: 0,
      mantenimiento: 0,
      dañado: 0
    },
    series_por_ubicacion: data?.series_por_ubicacion || {},
    total: data?.total || 0,
    disponibles: data?.disponibles || 0,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook: Obtener una serie específica
 * 
 * @param {number} serieId - ID de la serie
 * @returns {Object} { serie, isLoading, error }
 * 
 * @example
 * const { serie, isLoading } = useGetSerie(1)
 */
export const useGetSerie = (serieId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['series', serieId],
    queryFn: () => seriesAPI.obtenerPorId(serieId),
    enabled: !!serieId
  })
  
  return {
    serie: data?.data || null,
    isLoading,
    error
  }
}

/**
 * Hook: Obtener estadísticas por estado
 * 
 * @param {number} elementoId - ID del elemento
 * @returns {Object} { estadisticas, isLoading, error }
 * 
 * @example
 * const { estadisticas } = useGetEstadisticasSeries(1)
 * 
 * // estadisticas:
 * {
 *   total: 10,
 *   disponible: 7,
 *   alquilado: 2,
 *   mantenimiento: 1,
 *   dañado: 0,
 *   nuevo: 0
 * }
 */
export const useGetEstadisticasSeries = (elementoId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['series', 'elemento', elementoId, 'estadisticas'],
    queryFn: () => seriesAPI.obtenerEstadisticas(elementoId),
    enabled: !!elementoId
  })
  
  return {
    estadisticas: data?.data || null,
    isLoading,
    error
  }
}

/**
 * Hook: Obtener series filtradas por estado
 * 
 * @param {number} elementoId - ID del elemento
 * @param {string} estado - Estado a filtrar
 * @returns {Object} { series, isLoading, error }
 * 
 * @example
 * // Solo series disponibles
 * const { series: disponibles } = useGetSeriesPorEstado(1, 'disponible')
 * 
 * // Solo series alquiladas
 * const { series: alquiladas } = useGetSeriesPorEstado(1, 'alquilado')
 */
export const useGetSeriesPorEstado = (elementoId, estado) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['series', 'elemento', elementoId, 'estado', estado],
    queryFn: () => seriesAPI.obtenerPorEstado(elementoId, estado),
    enabled: !!elementoId && !!estado
  })
  
  return {
    series: data?.data || [],
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
 * Hook: Crear una serie individual
 * 
 * @returns {Object} { createSerie, isLoading, error }
 * 
 * @example
 * const { createSerie } = useCreateSerie()
 * 
 * await createSerie({
 *   id_elemento: 1,
 *   numero_serie: "DOITE-001",
 *   estado: "disponible",
 *   ubicacion: "Bodega A",
 *   fecha_ingreso: "2024-01-15"
 * })
 * 
 * DESPUÉS DE CREAR:
 * - Backend valida que numero_serie sea único
 * - Incrementa automáticamente la cantidad del elemento
 * - Cache se invalida y lista se actualiza
 */
export const useCreateSerie = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: seriesAPI.crear,
    
    onSuccess: (response) => {
      const elementoId = response.data?.id_elemento
      
      // Invalidar series del elemento
      queryClient.invalidateQueries({ 
        queryKey: ['series', 'elemento', elementoId] 
      })
      
      // Invalidar elemento (para actualizar cantidad)
      queryClient.invalidateQueries({ 
        queryKey: ['elementos', elementoId] 
      })
      
      // Invalidar lista de elementos (para actualizar stats)
      queryClient.invalidateQueries({ 
        queryKey: ['elementos', 'subcategoria'] 
      })
      
      console.log('✅ Serie creada exitosamente')
    },
    
    onError: (error) => {
      console.error('❌ Error al crear serie:', error)
    }
  })
  
  return {
    createSerie: mutateAsync,
    isLoading,
    error
  }
}

/**
 * Hook: Crear múltiples series a la vez
 * 
 * @returns {Object} { createSeriesMultiples, isLoading, error }
 * 
 * @example
 * const { createSeriesMultiples } = useCreateSeriesMultiples()
 * 
 * await createSeriesMultiples({
 *   id_elemento: 1,
 *   cantidad: 5,                  // Crear 5 series
 *   prefijo: "DOITE",             // Prefijo
 *   inicio: 1,                    // Empezar en 001
 *   estado: "disponible",
 *   ubicacion: "Bodega A",
 *   fecha_ingreso: "2024-01-15"
 * })
 * 
 * BACKEND GENERA:
 * - DOITE-001
 * - DOITE-002
 * - DOITE-003
 * - DOITE-004
 * - DOITE-005
 * 
 * ¡Perfecto para ingresar inventario masivo!
 */
export const useCreateSeriesMultiples = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: seriesAPI.crearMultiples,
    
    onSuccess: (response) => {
      const elementoId = response.data?.id_elemento
      
      // Invalidar todo relacionado al elemento
      queryClient.invalidateQueries({ 
        queryKey: ['series', 'elemento', elementoId] 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: ['elementos', elementoId] 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: ['elementos', 'subcategoria'] 
      })
      
      console.log(`✅ ${response.data?.cantidad || 0} series creadas exitosamente`)
    },
    
    onError: (error) => {
      console.error('❌ Error al crear series múltiples:', error)
    }
  })
  
  return {
    createSeriesMultiples: mutateAsync,
    isLoading,
    error
  }
}

/**
 * Hook: Actualizar una serie
 * 
 * @returns {Object} { updateSerie, isLoading, error }
 * 
 * @example
 * const { updateSerie } = useUpdateSerie()
 * 
 * await updateSerie({
 *   id: 1,
 *   numero_serie: "DOITE-001-A",  // Cambiar número
 *   estado: "mantenimiento",
 *   ubicacion: "Taller"
 * })
 */
export const useUpdateSerie = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: ({ id, ...data }) => seriesAPI.actualizar(id, data),
    
    onSuccess: (response, variables) => {
      // Invalidar serie específica
      queryClient.invalidateQueries({ 
        queryKey: ['series', variables.id] 
      })
      
      // Invalidar lista de series del elemento
      queryClient.invalidateQueries({ 
        queryKey: ['series', 'elemento'] 
      })
      
      console.log('✅ Serie actualizada exitosamente')
    },
    
    onError: (error) => {
      console.error('❌ Error al actualizar serie:', error)
    }
  })
  
  return {
    updateSerie: mutateAsync,
    isLoading,
    error
  }
}

/**
 * Hook: Cambiar estado de una serie (shortcut)
 * 
 * @returns {Object} { cambiarEstado, isLoading, error }
 * 
 * @example
 * const { cambiarEstado } = useCambiarEstadoSerie()
 * 
 * // Alquilar serie
 * await cambiarEstado({
 *   id: 1,
 *   estado: "alquilado",
 *   ubicacion: null
 * })
 * 
 * // Devolver a bodega
 * await cambiarEstado({
 *   id: 1,
 *   estado: "disponible",
 *   ubicacion: "Bodega A"
 * })
 * 
 * // Enviar a mantenimiento
 * await cambiarEstado({
 *   id: 1,
 *   estado: "mantenimiento",
 *   ubicacion: "Taller"
 * })
 * 
 * USO COMÚN:
 * - Al alquilar: estado = "alquilado", ubicacion = null
 * - Al devolver: estado = "disponible", ubicacion = "Bodega X"
 * - Al reparar: estado = "mantenimiento", ubicacion = "Taller"
 */
export const useCambiarEstadoSerie = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: ({ id, estado, ubicacion }) => 
      seriesAPI.cambiarEstado(id, estado, ubicacion),
    
    onSuccess: () => {
      // Invalidar todas las queries de series
      // (porque el estado afecta las estadísticas)
      queryClient.invalidateQueries({ 
        queryKey: ['series'] 
      })
      
      // Invalidar elementos (para actualizar contadores)
      queryClient.invalidateQueries({ 
        queryKey: ['elementos'] 
      })
      
      console.log('✅ Estado de serie cambiado exitosamente')
    },
    
    onError: (error) => {
      console.error('❌ Error al cambiar estado:', error)
    }
  })
  
  return {
    cambiarEstado: mutateAsync,
    isLoading,
    error
  }
}

/**
 * Hook: Eliminar una serie
 * 
 * @returns {Object} { deleteSerie, isLoading, error }
 * 
 * @example
 * const { deleteSerie } = useDeleteSerie()
 * 
 * if (confirm('¿Eliminar serie DOITE-001?')) {
 *   await deleteSerie(1)
 * }
 * 
 * VALIDACIÓN DEL BACKEND:
 * - No se puede eliminar si está alquilada
 * - Decrementa automáticamente la cantidad del elemento
 */
export const useDeleteSerie = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: seriesAPI.eliminar,
    
    onSuccess: () => {
      // Invalidar todo el cache de series y elementos
      queryClient.invalidateQueries({ 
        queryKey: ['series'] 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: ['elementos'] 
      })
      
      console.log('✅ Serie eliminada exitosamente')
    },
    
    onError: (error) => {
      console.error('❌ Error al eliminar serie:', error)
    }
  })
  
  return {
    deleteSerie: mutateAsync,
    isLoading,
    error
  }
}

/**
 * ============================================
 * HOOK POR DEFECTO
 * ============================================
 */

const useSeries = useGetSeries
export default useSeries

/**
 * ============================================
 * RESUMEN DE EXPORTS
 * ============================================
 * 
 * LECTURA:
 * - useGetSeries(elementoId)
 * - useGetSerie(serieId)
 * - useGetEstadisticasSeries(elementoId)
 * - useGetSeriesPorEstado(elementoId, estado)
 * 
 * ESCRITURA:
 * - useCreateSerie()
 * - useCreateSeriesMultiples()
 * - useUpdateSerie()
 * - useCambiarEstadoSerie()
 * - useDeleteSerie()
 * 
 * DEFAULT:
 * - useSeries() → alias de useGetSeries()
 * 
 * ============================================
 * EJEMPLO DE USO EN COMPONENTE
 * ============================================
 * 
 * import { useGetSeries, useCambiarEstadoSerie } from '@/hooks/UseSeries'
 * 
 * function SeriesList({ elementoId }) {
 *   const { series, isLoading } = useGetSeries(elementoId)
 *   const { cambiarEstado } = useCambiarEstadoSerie()
 *   
 *   const handleAlquilar = async (serieId) => {
 *     await cambiarEstado({
 *       id: serieId,
 *       estado: "alquilado",
 *       ubicacion: null
 *     })
 *     // Lista se actualiza automáticamente
 *   }
 *   
 *   if (isLoading) return <Spinner />
 *   
 *   return (
 *     <div>
 *       {series.map(serie => (
 *         <div key={serie.id}>
 *           <span>{serie.numero_serie}</span>
 *           <span>{serie.estado}</span>
 *           <button onClick={() => handleAlquilar(serie.id)}>
 *             Alquilar
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 */