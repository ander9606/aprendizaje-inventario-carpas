// ============================================
// API: MATERIALES
// ============================================

import api from './Axios.config'

const materialesAPI = {
  obtenerTodos: async () => {
    const response = await api.get('/materiales')
    return response.data
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/materiales/${id}`)
    return response.data
  },

  crear: async (data) => {
    const response = await api.post('/materiales', data)
    return response.data
  },

  actualizar: async (id, data) => {
    const response = await api.put(`/materiales/${id}`, data)
    return response.data
  },

  eliminar: async (id) => {
    const response = await api.delete(`/materiales/${id}`)
    return response.data
  }
}

export default materialesAPI
