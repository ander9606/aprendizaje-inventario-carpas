// ============================================
// API: MATERIALES
// ============================================

import api from './Axios.config'

const materialesAPI = {
  // ============================================
  // OBTENER MATERIALES
  // ============================================

  // Obtener todos los materiales
  obtenerTodos: async () => {
    const response = await api.get('/materiales')
    return response.data
  },

  // Buscar materiales por término
  buscar: async (termino) => {
    const response = await api.get('/materiales/buscar', {
      params: { q: termino }
    })
    return response.data
  },

  // Obtener materiales más usados
  obtenerMasUsados: async () => {
    const response = await api.get('/materiales/mas-usados')
    return response.data
  },

  // Obtener un material por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/materiales/${id}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nuevo material
  crear: async (data) => {
    const response = await api.post('/materiales', data)
    return response.data
  },

  // Actualizar material
  actualizar: async (id, data) => {
    const response = await api.put(`/materiales/${id}`, data)
    return response.data
  },

  // Eliminar material
  eliminar: async (id) => {
    const response = await api.delete(`/materiales/${id}`)
    return response.data
  },
}

export default materialesAPI