// ============================================
// API: LOTES
// Gestión de cantidades agrupadas por ubicación y estado
// ============================================

import api from './Axios.config'

/**
 * ¿QUÉ ES UN LOTE?
 * 
 * Un lote es una agrupación de unidades con el mismo
 * estado y ubicación de un elemento que NO requiere
 * tracking individual.
 * 
 * Ejemplo:
 * Elemento: "Silla Plástica"
 * Lotes:
 * - Lote A: 50 unidades → Bodega A → Estado: nuevo
 * - Lote B: 30 unidades → Bodega B → Estado: bueno
 * - Lote C: 20 unidades → Evento X → Estado: bueno
 * 
 * IMPORTANTE:
 * - Los lotes se crean/eliminan dinámicamente
 * - Si un lote queda en 0, se elimina automáticamente
 * - Si mueves cantidad a ubicación/estado existente, se consolida
 */

const lotesAPI = {
  // ============================================
  // OBTENER LOTES
  // ============================================
  
  /**
   * Obtener todos los lotes de un elemento
   * 
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Array de lotes
   * 
   * @example
   * const lotes = await lotesAPI.obtenerPorElemento(2)
   * 
   * Respuesta:
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: 1,
   *       id_elemento: 2,
   *       cantidad: 50,
   *       estado: "nuevo",
   *       ubicacion: "Bodega A",
   *       fecha_creacion: "2024-01-15",
   *       created_at: "2024-01-15T10:00:00Z"
   *     },
   *     {
   *       id: 2,
   *       id_elemento: 2,
   *       cantidad: 30,
   *       estado: "bueno",
   *       ubicacion: "Bodega B",
   *       fecha_creacion: "2024-01-10"
   *     }
   *   ],
   *   elemento: {
   *     id: 2,
   *     nombre: "Silla Plástica",
   *     cantidad_total: 80
   *   }
   * }
   */
  obtenerPorElemento: async (elementoId) => {
    const response = await api.get(`/lotes/elemento/${elementoId}`)
    return response.data
  },

  /**
   * Obtener un lote específico por ID
   * 
   * @param {number} loteId - ID del lote
   * @returns {Promise} - Datos del lote
   */
  obtenerPorId: async (loteId) => {
    const response = await api.get(`/lotes/${loteId}`)
    return response.data
  },

  /**
   * Obtener lotes por ubicación
   * 
   * @param {string} ubicacion - Ubicación a filtrar
   * @returns {Promise} - Lotes en esa ubicación
   * 
   * @example
   * const lotes = await lotesAPI.obtenerPorUbicacion("Bodega A")
   */
  obtenerPorUbicacion: async (ubicacion) => {
    const response = await api.get(`/lotes/ubicacion/${ubicacion}`)
    return response.data
  },

  // ============================================
  // MOVER CANTIDAD
  // ============================================
  
  /**
   * Mover cantidad entre lotes
   * 
   * Esta es la operación MÁS IMPORTANTE de los lotes.
   * Permite mover cantidad de un lote a otro, creando
   * o consolidando lotes automáticamente.
   * 
   * @param {Object} data - Datos del movimiento
   * @returns {Promise} - Resultado del movimiento
   * 
   * @example
   * // CASO 1: Mover de Bodega A a Bodega B
   * await lotesAPI.moverCantidad({
   *   lote_origen_id: 1,           // Lote de origen
   *   cantidad: 10,                 // Cantidad a mover
   *   ubicacion_destino: "Bodega B",
   *   estado_destino: "bueno",     // Puede cambiar estado
   *   motivo: "traslado",          // traslado, venta, alquiler, reparacion, otro
   *   descripcion: "Traslado a bodega secundaria"
   * })
   * 
   * LÓGICA DEL BACKEND:
   * 1. Valida que lote origen tenga suficiente cantidad
   * 2. Resta cantidad del lote origen
   * 3. Si lote origen queda en 0 → LO ELIMINA
   * 4. Busca si ya existe lote con misma ubicación + estado
   * 5. Si existe → SUMA la cantidad (consolidación)
   * 6. Si no existe → CREA nuevo lote
   * 7. Guarda en historial de movimientos
   * 
   * @example
   * // CASO 2: Alquilar (cambiar estado a "alquilado")
   * await lotesAPI.moverCantidad({
   *   lote_origen_id: 1,
   *   cantidad: 20,
   *   ubicacion_destino: null,     // Sin ubicación al alquilar
   *   estado_destino: "alquilado",
   *   motivo: "alquiler",
   *   descripcion: "Alquiler para evento X"
   * })
   * 
   * @example
   * // CASO 3: Devolver de alquiler
   * await lotesAPI.moverCantidad({
   *   lote_origen_id: 5,           // Lote "alquilado"
   *   cantidad: 15,
   *   ubicacion_destino: "Bodega A",
   *   estado_destino: "bueno",     // Vuelven en buen estado
   *   motivo: "devolucion",
   *   descripcion: "Devolución de evento X"
   * })
   * 
   * @example
   * // CASO 4: Enviar a reparación
   * await lotesAPI.moverCantidad({
   *   lote_origen_id: 1,
   *   cantidad: 5,
   *   ubicacion_destino: "Taller",
   *   estado_destino: "mantenimiento",
   *   motivo: "reparacion",
   *   descripcion: "Sillas rotas por reparar",
   *   costo_reparacion: 5000      // Opcional
   * })
   */
  moverCantidad: async (data) => {
    const response = await api.post('/lotes/mover', data)
    return response.data
  },

  // ============================================
  // AJUSTAR INVENTARIO
  // ============================================
  
  /**
   * Ajustar cantidad de un lote (incrementar/decrementar)
   * 
   * @param {number} loteId - ID del lote
   * @param {Object} data - Datos del ajuste
   * @returns {Promise} - Lote actualizado
   * 
   * @example
   * // Incrementar inventario (compra/ingreso)
   * await lotesAPI.ajustar(1, {
   *   cantidad: 20,                // Cantidad positiva = incrementa
   *   motivo: "compra",
   *   descripcion: "Compra de 20 unidades nuevas"
   * })
   * 
   * @example
   * // Decrementar inventario (pérdida/robo/daño)
   * await lotesAPI.ajustar(1, {
   *   cantidad: -5,                // Cantidad negativa = decrementa
   *   motivo: "perdida",
   *   descripcion: "5 sillas rotas sin reparación"
   * })
   * 
   * VALIDACIÓN:
   * - No puede quedar cantidad negativa
   * - Si queda en 0, elimina el lote
   */
  ajustar: async (loteId, data) => {
    const response = await api.patch(`/lotes/${loteId}/ajustar`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR LOTE
  // ============================================
  
  /**
   * Eliminar un lote manualmente
   * 
   * @param {number} id - ID del lote
   * @returns {Promise} - Confirmación
   * 
   * VALIDACIÓN:
   * - Solo se puede eliminar si cantidad = 0
   * - Normalmente los lotes en 0 se eliminan automáticamente
   * 
   * @example
   * await lotesAPI.eliminar(1)
   */
  eliminar: async (id) => {
    const response = await api.delete(`/lotes/${id}`)
    return response.data
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  
  /**
   * Obtener estadísticas por estado de un elemento
   * 
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Conteo por estado
   * 
   * @example
   * const stats = await lotesAPI.obtenerEstadisticas(2)
   * 
   * {
   *   success: true,
   *   data: {
   *     total: 150,
   *     nuevo: 50,
   *     bueno: 70,
   *     regular: 20,
   *     malo: 10,
   *     alquilado: 0
   *   }
   * }
   */
  obtenerEstadisticas: async (elementoId) => {
    const response = await api.get(`/lotes/elemento/${elementoId}/estadisticas`)
    return response.data
  },

  /**
   * Obtener lotes por estado
   * 
   * @param {number} elementoId - ID del elemento
   * @param {string} estado - Estado a filtrar
   * @returns {Promise} - Lotes filtrados
   * 
   * @example
   * // Obtener solo lotes nuevos
   * const nuevos = await lotesAPI.obtenerPorEstado(2, "nuevo")
   * 
   * // Obtener lotes en mal estado
   * const malos = await lotesAPI.obtenerPorEstado(2, "malo")
   */
  obtenerPorEstado: async (elementoId, estado) => {
    const response = await api.get(`/lotes/elemento/${elementoId}/estado/${estado}`)
    return response.data
  },

  // ============================================
  // HISTORIAL
  // ============================================
  
  /**
   * Obtener historial de movimientos de un elemento
   * 
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Historial de movimientos
   * 
   * @example
   * const historial = await lotesAPI.obtenerHistorial(2)
   * 
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: 1,
   *       fecha: "2024-01-15T10:00:00Z",
   *       tipo: "traslado",
   *       cantidad: 10,
   *       ubicacion_origen: "Bodega A",
   *       ubicacion_destino: "Bodega B",
   *       estado_origen: "bueno",
   *       estado_destino: "bueno",
   *       motivo: "traslado",
   *       descripcion: "Traslado a bodega secundaria",
   *       usuario: "admin"
   *     },
   *     // ...más movimientos
   *   ]
   * }
   */
  obtenerHistorial: async (elementoId) => {
    const response = await api.get(`/lotes/elemento/${elementoId}/historial`)
    return response.data
  },
}

export default lotesAPI