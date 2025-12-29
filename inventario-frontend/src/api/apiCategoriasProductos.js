// ============================================
// API: CATEGORÍAS DE PRODUCTOS
// Categorías para elementos compuestos/alquiler
// ============================================

import api from './Axios.config'

const categoriasProductosAPI = {
  // ============================================
  // OBTENER CATEGORÍAS
  // ============================================

  // Obtener todas las categorías de productos
  obtenerTodas: async () => {
    const response = await api.get('/categorias-productos')
    return response.data
  },

  // Obtener una categoría por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/categorias-productos/${id}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nueva categoría de producto
  crear: async (data) => {
    const response = await api.post('/categorias-productos', data)
    return response.data
  },

  // Actualizar categoría
  actualizar: async (id, data) => {
    const response = await api.put(`/categorias-productos/${id}`, data)
    return response.data
  },

  // Eliminar categoría
  eliminar: async (id) => {
    const response = await api.delete(`/categorias-productos/${id}`)
    return response.data
  }
}

export default categoriasProductosAPI
