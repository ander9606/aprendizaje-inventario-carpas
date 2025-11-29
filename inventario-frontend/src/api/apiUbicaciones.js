// ============================================
// API: UBICACIONES
// ============================================

import api from './Axios.config'

const ubicacionesAPI = {
  // ============================================
  // OBTENER UBICACIONES
  // ============================================

  // Obtener todas las ubicaciones
  obtenerTodas: async () => {
    const response = await api.get('/ubicaciones')
    return response.data
  },

  // Obtener ubicaciones activas
  obtenerActivas: async () => {
    const response = await api.get('/ubicaciones/activas')
    return response.data
  },

  // Obtener una ubicación por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/ubicaciones/${id}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nueva ubicación
  crear: async (data) => {
    const response = await api.post('/ubicaciones', data)
    return response.data
  },

  // Actualizar ubicación
  actualizar: async (id, data) => {
    const response = await api.put(`/ubicaciones/${id}`, data)
    return response.data
  },

  // Eliminar ubicación
  eliminar: async (id) => {
    const response = await api.delete(`/ubicaciones/${id}`)
    return response.data
  },
}

export default ubicacionesAPI
