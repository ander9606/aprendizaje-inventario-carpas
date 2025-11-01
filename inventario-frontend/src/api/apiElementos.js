// ============================================
// API: ELEMENTOS
// ============================================

import api from './Axios.config'

const elementosAPI = {
  // ============================================
  // OBTENER ELEMENTOS
  // ============================================

  // Obtener todos los elementos
  obtenerTodos: async () => {
    const response = await api.get('/elementos')
    return response.data
  },

  // Buscar elementos por término
  buscar: async (termino) => {
    const response = await api.get('/elementos/buscar', {
      params: { q: termino }
    })
    return response.data
  },

  // Obtener elementos con gestión por series
  obtenerConSeries: async () => {
    const response = await api.get('/elementos/con-series')
    return response.data
  },

  // Obtener elementos con gestión por lotes
  obtenerSinSeries: async () => {
    const response = await api.get('/elementos/sin-series')
    return response.data
  },

  // Obtener elementos por categoría (subcategoría)
  obtenerPorCategoria: async (categoriaId) => {
    const response = await api.get(`/elementos/categoria/${categoriaId}`)
    return response.data
  },

  // Obtener un elemento por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/elementos/${id}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nuevo elemento
  crear: async (data) => {
    const response = await api.post('/elementos', data)
    return response.data
  },

  // Actualizar elemento
  actualizar: async (id, data) => {
    const response = await api.put(`/elementos/${id}`, data)
    return response.data
  },

  // Eliminar elemento
  eliminar: async (id) => {
    const response = await api.delete(`/elementos/${id}`)
    return response.data
  },
}

export default elementosAPI