// ============================================
// API: Disponibilidad
// Verificación de disponibilidad de elementos
// ============================================

import api from '@shared/api/Axios.config'

const apiDisponibilidad = {
  /**
   * Verificar disponibilidad de productos (sin cotización existente)
   * @param {Array} productos - [{ compuesto_id, cantidad, configuracion }]
   * @param {string} fechaMontaje - Fecha de montaje YYYY-MM-DD
   * @param {string} fechaDesmontaje - Fecha de desmontaje YYYY-MM-DD
   */
  verificarProductos: async (productos, fechaMontaje, fechaDesmontaje) => {
    const response = await api.post('/disponibilidad/verificar', {
      productos,
      fecha_montaje: fechaMontaje,
      fecha_desmontaje: fechaDesmontaje
    })
    return response.data
  },

  /**
   * Verificar disponibilidad de una cotización existente
   * @param {number} cotizacionId - ID de la cotización
   * @param {string} fechaInicio - Fecha inicio opcional
   * @param {string} fechaFin - Fecha fin opcional
   */
  verificarCotizacion: async (cotizacionId, fechaInicio = null, fechaFin = null) => {
    const params = {}
    if (fechaInicio) params.fecha_inicio = fechaInicio
    if (fechaFin) params.fecha_fin = fechaFin

    const response = await api.get(`/disponibilidad/cotizacion/${cotizacionId}`, { params })
    return response.data
  },

  /**
   * Obtener calendario de ocupación
   * @param {string} fechaInicio - Fecha inicio YYYY-MM-DD
   * @param {string} fechaFin - Fecha fin YYYY-MM-DD
   * @param {Array} elementoIds - IDs de elementos (opcional)
   */
  obtenerCalendario: async (fechaInicio, fechaFin, elementoIds = null) => {
    const params = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    }
    if (elementoIds && elementoIds.length > 0) {
      params.elementos = elementoIds.join(',')
    }

    const response = await api.get('/disponibilidad/calendario', { params })
    return response.data
  },

  /**
   * Descomponer productos en elementos individuales
   * @param {Array} productos - [{ compuesto_id, cantidad, configuracion }]
   */
  descomponerProductos: async (productos) => {
    const response = await api.post('/disponibilidad/descomponer', { productos })
    return response.data
  }
}

export default apiDisponibilidad
