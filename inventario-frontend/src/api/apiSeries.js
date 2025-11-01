// ============================================
// API: SERIES
// ============================================

import api from './Axios.config'

const seriesAPI = {
  // ============================================
  // OBTENER SERIES
  // ============================================

  // Obtener todas las series
  obtenerTodas: async () => {
    const response = await api.get('/series')
    return response.data
  },

  // Obtener series disponibles
  obtenerDisponibles: async () => {
    const response = await api.get('/series/disponibles')
    return response.data
  },

  // Obtener series alquiladas
  obtenerAlquiladas: async () => {
    const response = await api.get('/series/alquiladas')
    return response.data
  },

  // Obtener series por estado
  obtenerPorEstado: async (estado) => {
    const response = await api.get(`/series/estado/${estado}`)
    return response.data
  },

  // Obtener series de un elemento específico
  obtenerPorElemento: async (elementoId) => {
    const response = await api.get(`/series/elemento/${elementoId}`)
    return response.data
  },

  // Obtener serie por número de serie
  obtenerPorNumeroSerie: async (numeroSerie) => {
    const response = await api.get(`/series/numero/${numeroSerie}`)
    return response.data
  },

  // Obtener una serie por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/series/${id}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nueva serie
  crear: async (data) => {
    const response = await api.post('/series', data)
    return response.data
  },

  // Actualizar serie
  actualizar: async (id, data) => {
    const response = await api.put(`/series/${id}`, data)
    return response.data
  },

  // Cambiar solo el estado de una serie
  cambiarEstado: async (id, estado) => {
    const response = await api.patch(`/series/${id}/estado`, { estado })
    return response.data
  },

  // Eliminar serie
  eliminar: async (id) => {
    const response = await api.delete(`/series/${id}`)
    return response.data
  },
}

export default seriesAPI