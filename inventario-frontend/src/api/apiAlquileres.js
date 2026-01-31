// ============================================
// API: Alquileres
// Endpoints para gestión de alquileres
// ============================================

import api from './Axios.config'

const apiAlquileres = {
  // Obtener todos los alquileres
  obtenerTodos: async () => {
    const response = await api.get('/alquileres')
    return response
  },

  // Obtener alquileres activos
  obtenerActivos: async () => {
    const response = await api.get('/alquileres/activos')
    return response
  },

  // Obtener alquileres programados
  obtenerProgramados: async () => {
    const response = await api.get('/alquileres/programados')
    return response
  },

  // Obtener por estado
  obtenerPorEstado: async (estado) => {
    const response = await api.get(`/alquileres/estado/${estado}`)
    return response
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/alquileres/${id}`)
    return response
  },

  // Obtener completo (con productos y elementos)
  obtenerCompleto: async (id) => {
    const response = await api.get(`/alquileres/${id}/completo`)
    return response
  },

  // Obtener elementos asignados
  obtenerElementos: async (id) => {
    const response = await api.get(`/alquileres/${id}/elementos`)
    return response
  },

  // Estadísticas
  obtenerEstadisticas: async () => {
    const response = await api.get('/alquileres/estadisticas')
    return response
  },

  // Marcar salida
  marcarSalida: async (id, datos) => {
    const response = await api.post(`/alquileres/${id}/salida`, datos)
    return response
  },

  // Marcar retorno
  marcarRetorno: async (id, datos) => {
    const response = await api.post(`/alquileres/${id}/retorno`, datos)
    return response
  },

  // Cancelar alquiler
  cancelar: async (id, notas) => {
    const response = await api.post(`/alquileres/${id}/cancelar`, { notas })
    return response
  },

  // Asignar elementos
  asignarElementos: async (id, elementos) => {
    const response = await api.post(`/alquileres/${id}/elementos`, { elementos })
    return response
  }
}

export default apiAlquileres
