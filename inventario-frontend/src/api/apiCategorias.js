// ============================================
// API: CATEGORÍAS
// ============================================

import api from './Axios.config'

const categoriasAPI = {
  // ============================================
  // OBTENER CATEGORÍAS
  // ============================================
  
  // Obtener todas las categorías
  obtenerTodas: async () => {
    const response = await api.get('/categorias')
    return response.data
  },

  // Obtener solo categorías padre (nivel 1)
  obtenerPadres: async () => {
    const response = await api.get('/categorias/padres')
    return response.data
  },

  // Obtener una categoría por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/categorias/${id}`)
    return response.data
  },

  // Obtener subcategorías de una categoría padre
  obtenerHijas: async (categoriaId) => {
    const response = await api.get(`/categorias/${categoriaId}/hijas`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nueva categoría
  crear: async (data) => {
    const response = await api.post('/categorias', data)
    return response.data
  },

  // Actualizar categoría
  actualizar: async (id, data) => {
    const response = await api.put(`/categorias/${id}`, data)
    return response.data
  },

  // Eliminar categoría
  eliminar: async (id) => {
    const response = await api.delete(`/categorias/${id}`)
    return response.data
  },
}

export default categoriasAPI