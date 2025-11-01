// ============================================
// API: LOTES
// Gestión de elementos por lotes
// ============================================

import api from './Axios.config'

const lotesAPI = {
  // ============================================
  // OBTENER LOTES
  // ============================================

  // Obtener todos los lotes
  obtenerTodos: async () => {
    const response = await api.get('/lotes')
    return response.data
  },

  // Obtener resumen de disponibilidad de todos los elementos
  obtenerResumen: async () => {
    const response = await api.get('/lotes/resumen')
    return response.data
  },

  // Obtener lotes por estado
  obtenerPorEstado: async (estado) => {
    const response = await api.get(`/lotes/estado/${estado}`)
    return response.data
  },

  // Obtener lotes de un elemento específico
  obtenerPorElemento: async (elementoId) => {
    const response = await api.get(`/lotes/elemento/${elementoId}`)
    return response.data
  },

  // Obtener un lote por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/lotes/${id}`)
    return response.data
  },

  // Obtener historial de movimientos de un lote
  obtenerHistorial: async (id) => {
    const response = await api.get(`/lotes/${id}/historial`)
    return response.data
  },

  // ============================================
  // OPERACIÓN PRINCIPAL: MOVER CANTIDAD
  // ============================================

  /**
   * Mover cantidad entre lotes
   * Esta es la operación más importante para gestión por lotes
   * 
   * @param {Object} data - Datos del movimiento
   * @param {number} data.lote_origen_id - ID del lote origen
   * @param {number} data.elemento_id - ID del elemento (opcional, se obtiene del lote)
   * @param {number} data.cantidad - Cantidad a mover
   * @param {string} data.estado_destino - Estado destino (nuevo, bueno, alquilado, mantenimiento, dañado)
   * @param {string} data.ubicacion_destino - Ubicación destino (puede ser null)
   * @param {string} data.motivo - Motivo del movimiento (alquiler, devolucion, reparacion, limpieza, traslado)
   * @param {string} data.descripcion - Descripción detallada (opcional)
   * @param {number} data.costo_reparacion - Costo si aplica (opcional)
   */
  moverCantidad: async (data) => {
    const response = await api.post('/lotes/movimiento', data)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear lote manualmente (normalmente se crean automáticamente)
  crear: async (data) => {
    const response = await api.post('/lotes', data)
    return response.data
  },

  // Actualizar lote (cantidad, ubicación)
  actualizar: async (id, data) => {
    const response = await api.put(`/lotes/${id}`, data)
    return response.data
  },

  // Eliminar lote (solo si cantidad = 0)
  eliminar: async (id) => {
    const response = await api.delete(`/lotes/${id}`)
    return response.data
  },
}

export default lotesAPI