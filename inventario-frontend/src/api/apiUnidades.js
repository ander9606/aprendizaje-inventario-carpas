// ============================================
// API: UNIDADES
// ============================================

import api from './Axios.config'

const unidadesAPI = {
  // ============================================
  // OBTENER UNIDADES
  // ============================================

  // Obtener todas las unidades
  obtenerTodas: async () => {
    const response = await api.get('/unidades')
    return response.data
  },

  // Obtener unidades más usadas
  obtenerMasUsadas: async () => {
    const response = await api.get('/unidades/mas-usadas')
    return response.data
  },

  // Obtener unidades por tipo
  obtenerPorTipo: async (tipo) => {
    const response = await api.get(`/unidades/tipo/${tipo}`)
    return response.data
  },

  // Obtener una unidad por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/unidades/${id}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nueva unidad
  crear: async (data) => {
    const response = await api.post('/unidades', data)
    return response.data
  },

  // Actualizar unidad
  actualizar: async (id, data) => {
    const response = await api.put(`/unidades/${id}`, data)
    return response.data
  },

  // Eliminar unidad
  eliminar: async (id) => {
    const response = await api.delete(`/unidades/${id}`)
    return response.data
  },
}

export default unidadesAPI