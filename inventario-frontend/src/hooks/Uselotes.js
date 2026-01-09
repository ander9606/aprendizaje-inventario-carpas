// ============================================
// CUSTOM HOOKS: useLotes
// Maneja tracking por cantidad agrupada
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lotesAPI } from '../api'

/**
 * ¿CUÁNDO USAR ESTOS HOOKS?
 * 
 * Solo para elementos con requiere_series = FALSE
 * 
 * Ejemplos:
 * - Sillas (50 unidades en Bodega A)
 * - Reatas (100 metros en Bodega B)
 * - Estacas (200 unidades en buen estado)
 * - Vasos plásticos (500 unidades)
 */

/**
 * ============================================
 * HOOKS DE LECTURA (useQuery)
 * ============================================
 */

/**
 * Hook: Obtener todos los lotes de un elemento
 * 
 * @param {number} elementoId - ID del elemento
 * @returns {Object} { lotes, elemento, estadisticas, lotes_por_ubicacion, cantidad_total, cantidad_disponible, isLoading, error, refetch }
 * 
 * @example
 * const { lotes, estadisticas, lotes_por_ubicacion, cantidad_total, cantidad_disponible } = useGetLotes(2)
 * 
 * // lotes es un array:
 * [
 *   { id: 1, cantidad: 50, estado: "nuevo", ubicacion: "Bodega A" },
 *   { id: 2, cantidad: 30, estado: "bueno", ubicacion: "Bodega B" },
 *   { id: 3, cantidad: 20, estado: "bueno", ubicacion: "Evento X" }
 * ]
 * 
 * // estadisticas (calculado automáticamente):
 * {
 *   nuevo: 50,
 *   bueno: 50,
 *   regular: 20,
 *   malo: 10,
 *   alquilado: 20
 * }
 * 
 * // lotes_por_ubicacion (calculado automáticamente):
 * {
 *   "Bodega A": 70,
 *   "Bodega B": 50,
 *   "Taller": 10,
 *   "Sin ubicación": 20
 * }
 * 
 * // cantidad_total: 150 (suma de todos los lotes)
 * // cantidad_disponible: 100 (nuevo + bueno, listas para alquilar)
 */
export const useGetLotes = (elementoId) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lotes', 'elemento', elementoId],
    queryFn: () => lotesAPI.obtenerPorElemento(elementoId),
    enabled: !!elementoId,
    
    // Transformar datos para agregar estadísticas
    select: (response) => {
      // El backend retorna: { success, elemento, estadisticas, lotes, total_lotes }
      const lotesRaw = response?.lotes || []
      const elemento = response?.elemento || null
      const estadisticasBackend = response?.estadisticas || {}

      // FILTRAR LOTES VACÍOS (cantidad <= 0)
      // Los lotes con cantidad 0 deberían haberse eliminado en el backend,
      // pero este filtro actúa como defensa adicional
      const lotes = lotesRaw.filter(lote => lote.cantidad > 0)

      // Calcular cantidad total
      const cantidad_total = lotes.reduce(
        (total, lote) => total + (lote.cantidad || 0),
        0
      )

      // Calcular estadísticas por estado (manualmente desde los lotes)
      const estadisticas = lotes.reduce((stats, lote) => {
        const estado = lote.estado || 'sin_estado'
        stats[estado] = (stats[estado] || 0) + (lote.cantidad || 0)
        return stats
      }, {
        nuevo: 0,
        bueno: 0,
        mantenimiento: 0,
        danado: 0,
        alquilado: 0
      })

      // Calcular distribución por ubicación (agrupando lotes en array)
      const ubicacionesMap = {}
      lotes.forEach(lote => {
        const ubicacion = lote.ubicacion || 'Sin ubicación'
        if (!ubicacionesMap[ubicacion]) {
          ubicacionesMap[ubicacion] = {
            nombre: ubicacion,
            lotes: [],
            cantidad_total: 0
          }
        }
        ubicacionesMap[ubicacion].lotes.push(lote)
        ubicacionesMap[ubicacion].cantidad_total += (lote.cantidad || 0)
      })
      const lotes_por_ubicacion = Object.values(ubicacionesMap)

      // Calcular cantidad disponible para alquilar (nuevo + bueno)
      const cantidad_disponible = (estadisticas.nuevo || 0) + (estadisticas.bueno || 0)

      return {
        lotes,
        elemento,
        estadisticas,
        estadisticasBackend,
        lotes_por_ubicacion,
        cantidad_total,
        cantidad_disponible
      }
    }
  })
  
  return {
    lotes: data?.lotes || [],
    elemento: data?.elemento || null,
    estadisticas: data?.estadisticas || {
      nuevo: 0,
      bueno: 0,
      regular: 0,
      malo: 0,
      alquilado: 0
    },
    lotes_por_ubicacion: data?.lotes_por_ubicacion || [],
    cantidad_total: data?.cantidad_total || 0,
    cantidad_disponible: data?.cantidad_disponible || 0,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook: Obtener un lote específico
 * 
 * @param {number} loteId - ID del lote
 * @returns {Object} { lote, isLoading, error }
 */
export const useGetLote = (loteId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lotes', loteId],
    queryFn: () => lotesAPI.obtenerPorId(loteId),
    enabled: !!loteId
  })
  
  return {
    lote: data?.data || null,
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
 * const { estadisticas } = useGetEstadisticasLotes(2)
 * 
 * // estadisticas:
 * {
 *   total: 150,
 *   nuevo: 50,
 *   bueno: 70,
 *   regular: 20,
 *   malo: 10
 * }
 */
export const useGetEstadisticasLotes = (elementoId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lotes', 'elemento', elementoId, 'estadisticas'],
    queryFn: () => lotesAPI.obtenerEstadisticas(elementoId),
    enabled: !!elementoId
  })
  
  return {
    estadisticas: data?.data || null,
    isLoading,
    error
  }
}

/**
 * Hook: Obtener lotes filtrados por estado
 * 
 * @param {number} elementoId - ID del elemento
 * @param {string} estado - Estado a filtrar
 * @returns {Object} { lotes, isLoading, error }
 * 
 * @example
 * // Solo lotes nuevos
 * const { lotes: nuevos } = useGetLotesPorEstado(2, 'nuevo')
 * 
 * // Solo lotes en mal estado
 * const { lotes: malos } = useGetLotesPorEstado(2, 'malo')
 */
export const useGetLotesPorEstado = (elementoId, estado) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lotes', 'elemento', elementoId, 'estado', estado],
    queryFn: () => lotesAPI.obtenerPorEstado(elementoId, estado),
    enabled: !!elementoId && !!estado
  })
  
  return {
    lotes: data?.data || [],
    isLoading,
    error
  }
}

/**
 * Hook: Obtener historial de movimientos
 * 
 * @param {number} elementoId - ID del elemento
 * @returns {Object} { historial, isLoading, error }
 * 
 * @example
 * const { historial } = useGetHistorialLotes(2)
 * 
 * // historial es un array de movimientos:
 * [
 *   {
 *     id: 1,
 *     fecha: "2024-01-15T10:00:00Z",
 *     tipo: "traslado",
 *     cantidad: 10,
 *     ubicacion_origen: "Bodega A",
 *     ubicacion_destino: "Bodega B",
 *     motivo: "traslado",
 *     descripcion: "Traslado a bodega secundaria"
 *   },
 *   // ...más movimientos
 * ]
 */
export const useGetHistorialLotes = (elementoId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lotes', 'elemento', elementoId, 'historial'],
    queryFn: () => lotesAPI.obtenerHistorial(elementoId),
    enabled: !!elementoId
  })
  
  return {
    historial: data?.data || [],
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
 * Hook: Mover cantidad entre lotes (LA MÁS IMPORTANTE) ⭐
 * 
 * @returns {Object} { moverCantidad, isLoading, error }
 * 
 * Esta es la operación central del sistema de lotes.
 * El backend maneja automáticamente:
 * - Restar del lote origen
 * - Eliminar lote origen si queda en 0
 * - Crear lote destino si no existe
 * - Consolidar con lote existente si ya existe
 * - Registrar en historial
 * 
 * @example
 * const { moverCantidad } = useMoverCantidad()
 * 
 * // CASO 1: Traslado entre bodegas
 * await moverCantidad({
 *   lote_origen_id: 1,
 *   cantidad: 10,
 *   ubicacion_destino: "Bodega B",
 *   estado_destino: "bueno",
 *   motivo: "traslado",
 *   descripcion: "Traslado a bodega secundaria"
 * })
 * 
 * @example
 * // CASO 2: Alquilar
 * await moverCantidad({
 *   lote_origen_id: 1,
 *   cantidad: 20,
 *   ubicacion_destino: null,        // Sin ubicación
 *   estado_destino: "alquilado",
 *   motivo: "alquiler",
 *   descripcion: "Alquiler para evento X"
 * })
 * 
 * @example
 * // CASO 3: Devolver de alquiler
 * await moverCantidad({
 *   lote_origen_id: 5,               // Lote "alquilado"
 *   cantidad: 15,
 *   ubicacion_destino: "Bodega A",
 *   estado_destino: "bueno",         // Vuelven en buen estado
 *   motivo: "devolucion",
 *   descripcion: "Devolución de evento X"
 * })
 * 
 * @example
 * // CASO 4: Cambiar estado (ej: bueno → malo)
 * await moverCantidad({
 *   lote_origen_id: 1,
 *   cantidad: 5,
 *   ubicacion_destino: "Bodega A",   // Misma ubicación
 *   estado_destino: "malo",          // Cambiar estado
 *   motivo: "deterioro",
 *   descripcion: "5 sillas rotas"
 * })
 * 
 * @example
 * // CASO 5: Enviar a reparación
 * await moverCantidad({
 *   lote_origen_id: 1,
 *   cantidad: 5,
 *   ubicacion_destino: "Taller",
 *   estado_destino: "mantenimiento",
 *   motivo: "reparacion",
 *   descripcion: "Sillas por reparar",
 *   costo_reparacion: 5000          // Opcional
 * })
 * 
 * MAGIA DEL BACKEND:
 * 1. Si mueves 10 unidades de "Bodega A" (bueno) a "Bodega B" (bueno)
 * 2. Y ya existe un lote en "Bodega B" (bueno)
 * 3. Backend automáticamente SUMA las 10 al lote existente
 * 4. ¡No crea lote duplicado!
 * 
 * DESPUÉS DE MOVER:
 * - Invalida cache de lotes del elemento
 * - Invalida estadísticas
 * - Invalida historial
 * - Todo se actualiza automáticamente en la UI
 */
export const useMoverCantidad = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: lotesAPI.moverCantidad,
    retry: 0,

    onSuccess: (response) => {
      const elementoId = response.data?.elemento_id

      // Invalidar lotes del elemento
      queryClient.invalidateQueries({
        queryKey: ['lotes', 'elemento', elementoId]
      })

      // Invalidar elemento (para actualizar cantidad total)
      queryClient.invalidateQueries({
        queryKey: ['elementos', elementoId]
      })

      // Invalidar lista de elementos (para actualizar stats)
      queryClient.invalidateQueries({
        queryKey: ['elementos', 'subcategoria']
      })

      console.log('✅ Cantidad movida exitosamente')
    },

    onError: (error) => {
      console.error('❌ Error al mover cantidad:', error)
    }
  })

  return {
    moverCantidad: mutation,
    isLoading: mutation.isPending,
    error: mutation.error
  }
}

/**
 * Hook: Ajustar inventario (incrementar/decrementar)
 * 
 * @returns {Object} { ajustarLote, isLoading, error }
 * 
 * Usa esto para:
 * - Compras (incrementar)
 * - Pérdidas/robos (decrementar)
 * - Ajustes de inventario
 * 
 * @example
 * const { ajustarLote } = useAjustarLote()
 * 
 * // INCREMENTAR: Compra de 20 sillas nuevas
 * await ajustarLote({
 *   loteId: 1,
 *   cantidad: 20,                    // Positivo = incrementa
 *   motivo: "compra",
 *   descripcion: "Compra de 20 unidades nuevas"
 * })
 * 
 * // DECREMENTAR: 5 sillas rotas sin reparación
 * await ajustarLote({
 *   loteId: 1,
 *   cantidad: -5,                    // Negativo = decrementa
 *   motivo: "perdida",
 *   descripcion: "5 sillas rotas sin reparación posible"
 * })
 * 
 * VALIDACIÓN:
 * - No puede quedar cantidad negativa
 * - Si queda en 0, backend elimina el lote
 */
export const useAjustarLote = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: ({ loteId, ...data }) => lotesAPI.ajustar(loteId, data),
    retry: 0,
    
    onSuccess: () => {
      // Invalidar todo el cache de lotes y elementos
      queryClient.invalidateQueries({ 
        queryKey: ['lotes'] 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: ['elementos'] 
      })
      
      console.log('✅ Lote ajustado exitosamente')
    },
    
    onError: (error) => {
      console.error('❌ Error al ajustar lote:', error)
    }
  })
  
  return {
    ajustarLote: mutateAsync,
    isLoading,
    error
  }
}

/**
 * Hook: Eliminar un lote
 * 
 * @returns {Object} { deleteLote, isLoading, error }
 * 
 * @example
 * const { deleteLote } = useDeleteLote()
 * 
 * await deleteLote(1)
 * 
 * VALIDACIÓN:
 * - Solo se puede eliminar si cantidad = 0
 * - Normalmente los lotes en 0 se eliminan automáticamente
 * - Este hook es para casos excepcionales
 */
export const useDeleteLote = () => {
  const queryClient = useQueryClient()
  
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: lotesAPI.eliminar,
    retry: 0,
    
    onSuccess: () => {
      // Invalidar todo el cache de lotes y elementos
      queryClient.invalidateQueries({ 
        queryKey: ['lotes'] 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: ['elementos'] 
      })
      
      console.log('✅ Lote eliminado exitosamente')
    },
    
    onError: (error) => {
      console.error('❌ Error al eliminar lote:', error)
    }
  })
  
  return {
    deleteLote: mutateAsync,
    isLoading,
    error
  }
}

/**
 * ============================================
 * HOOK POR DEFECTO
 * ============================================
 */

const useLotes = useGetLotes
export default useLotes

/**
 * ============================================
 * RESUMEN DE EXPORTS
 * ============================================
 * 
 * LECTURA:
 * - useGetLotes(elementoId)
 * - useGetLote(loteId)
 * - useGetEstadisticasLotes(elementoId)
 * - useGetLotesPorEstado(elementoId, estado)
 * - useGetHistorialLotes(elementoId)
 * 
 * ESCRITURA:
 * - useMoverCantidad()           ⭐ LA MÁS IMPORTANTE
 * - useAjustarLote()
 * - useDeleteLote()
 * 
 * DEFAULT:
 * - useLotes() → alias de useGetLotes()
 * 
 * ============================================
 * EJEMPLO COMPLETO DE USO
 * ============================================
 * 
 * import { useGetLotes, useMoverCantidad } from '@/hooks/UseLotes'
 * 
 * function LotesManager({ elementoId }) {
 *   const { lotes, isLoading } = useGetLotes(elementoId)
 *   const { moverCantidad, isLoading: isMoving } = useMoverCantidad()
 *   
 *   const handleAlquilar = async (loteId, cantidad) => {
 *     await moverCantidad({
 *       lote_origen_id: loteId,
 *       cantidad,
 *       ubicacion_destino: null,
 *       estado_destino: "alquilado",
 *       motivo: "alquiler",
 *       descripcion: "Alquiler para evento"
 *     })
 *     // Lista se actualiza automáticamente
 *   }
 *   
 *   const handleDevolver = async (cantidad) => {
 *     // Buscar lote "alquilado"
 *     const loteAlquilado = lotes.find(l => l.estado === 'alquilado')
 *     
 *     if (loteAlquilado) {
 *       await moverCantidad({
 *         lote_origen_id: loteAlquilado.id,
 *         cantidad,
 *         ubicacion_destino: "Bodega A",
 *         estado_destino: "bueno",
 *         motivo: "devolucion",
 *         descripcion: "Devolución de evento"
 *       })
 *     }
 *   }
 *   
 *   if (isLoading) return <Spinner />
 *   
 *   return (
 *     <div>
 *       <h2>Lotes del elemento</h2>
 *       
 *       {lotes.map(lote => (
 *         <div key={lote.id} className="border p-4 rounded">
 *           <div>
 *             <strong>{lote.ubicacion || 'Sin ubicación'}</strong>
 *             <span className="ml-2">({lote.estado})</span>
 *           </div>
 *           <div>Cantidad: {lote.cantidad}</div>
 *           
 *           {lote.estado !== 'alquilado' && (
 *             <button 
 *               onClick={() => handleAlquilar(lote.id, 10)}
 *               disabled={isMoving}
 *             >
 *               Alquilar 10 unidades
 *             </button>
 *           )}
 *         </div>
 *       ))}
 *       
 *       <button 
 *         onClick={() => handleDevolver(10)}
 *         disabled={isMoving}
 *       >
 *         Devolver 10 unidades
 *       </button>
 *     </div>
 *   )
 * }
 * 
 * ============================================
 * FLUJOS COMUNES
 * ============================================
 * 
 * 1. ALQUILAR:
 *    - Origen: Lote en bodega (disponible)
 *    - Destino: Sin ubicación + estado "alquilado"
 * 
 * 2. DEVOLVER:
 *    - Origen: Lote "alquilado"
 *    - Destino: Bodega + estado "bueno"
 * 
 * 3. TRASLADAR:
 *    - Origen: Bodega A
 *    - Destino: Bodega B (mismo estado)
 * 
 * 4. DETERIORO:
 *    - Origen: Lote "bueno"
 *    - Destino: Mismo lugar + estado "malo"
 * 
 * 5. REPARACIÓN:
 *    - Origen: Lote "malo"
 *    - Destino: Taller + estado "mantenimiento"
 * 
 * 6. REPARADO:
 *    - Origen: Lote "mantenimiento"
 *    - Destino: Bodega + estado "bueno"
 */