// ============================================
// API: Alquileres
// Endpoints para gestión de alquileres
// ============================================

import api from './Axios.config'

const apiAlquileres = {
  // Obtener todos los alquileres
  obtenerTodos: async () => {
    const response = await api.get('/alquileres')
    return response.data
  },

  // Obtener alquileres activos
  obtenerActivos: async () => {
    const response = await api.get('/alquileres/activos')
    return response.data
  },

  // Obtener alquileres programados
  obtenerProgramados: async () => {
    const response = await api.get('/alquileres/programados')
    return response.data
  },

  // Obtener por estado
  obtenerPorEstado: async (estado) => {
    const response = await api.get(`/alquileres/estado/${estado}`)
    return response.data
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/alquileres/${id}`)
    return response.data
  },

  // Obtener completo (con productos y elementos)
  obtenerCompleto: async (id) => {
    const response = await api.get(`/alquileres/${id}/completo`)
    return response.data
  },

  // Obtener elementos asignados
  obtenerElementos: async (id) => {
    const response = await api.get(`/alquileres/${id}/elementos`)
    return response.data
  },

  // Estadísticas
  obtenerEstadisticas: async () => {
    const response = await api.get('/alquileres/estadisticas')
    return response.data
  },

  // Marcar salida
  marcarSalida: async (id, datos) => {
    const response = await api.post(`/alquileres/${id}/salida`, datos)
    return response.data
  },

  // Marcar retorno
  marcarRetorno: async (id, datos) => {
    const response = await api.post(`/alquileres/${id}/retorno`, datos)
    return response.data
  },

  // Cancelar alquiler
  cancelar: async (id, notas) => {
    const response = await api.post(`/alquileres/${id}/cancelar`, { notas })
    return response.data
  },

  // Asignar elementos
  asignarElementos: async (id, elementos) => {
    const response = await api.post(`/alquileres/${id}/elementos`, { elementos })
    return response.data
  },

  // Extender fecha de retorno
  extenderAlquiler: async (id, { nueva_fecha_retorno, razon, costo_extension }) => {
    const response = await api.post(`/alquileres/${id}/extender`, {
      nueva_fecha_retorno,
      razon,
      costo_extension
    })
    return response.data
  },

  // Obtener historial de extensiones
  obtenerExtensiones: async (id) => {
    const response = await api.get(`/alquileres/${id}/extensiones`)
    return response.data
  },

  // Reportes completos (con filtro de fechas opcional)
  obtenerReportes: async ({ fechaInicio, fechaFin } = {}) => {
    const params = {}
    if (fechaInicio) params.fechaInicio = fechaInicio
    if (fechaFin) params.fechaFin = fechaFin
    const response = await api.get('/alquileres/reportes', { params })
    return response.data
  }
}

export default apiAlquileres
