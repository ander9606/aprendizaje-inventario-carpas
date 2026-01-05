// ============================================
// API: CATEGORÍAS DE PRODUCTOS
// Categorías para elementos compuestos/alquiler
// ============================================

import api from './Axios.config'

const categoriasProductosAPI = {
  // ============================================
  // OBTENER CATEGORÍAS (PLANO)
  // ============================================

  // Obtener todas las categorías de productos (lista plana)
  obtenerTodas: async () => {
    const response = await api.get('/categorias-productos')
    return response.data
  },

  // Obtener solo categorías activas (lista plana)
  obtenerActivas: async () => {
    const response = await api.get('/categorias-productos/activas')
    return response.data
  },

  // Obtener una categoría por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/categorias-productos/${id}`)
    return response.data
  },

  // ============================================
  // OBTENER CATEGORÍAS (ÁRBOL JERÁRQUICO)
  // ============================================

  // Obtener todas en estructura de árbol
  obtenerArbol: async () => {
    const response = await api.get('/categorias-productos/arbol')
    return response.data
  },

  // Obtener activas en estructura de árbol
  obtenerActivasArbol: async () => {
    const response = await api.get('/categorias-productos/activas/arbol')
    return response.data
  },

  // Obtener subcategorías de una categoría
  obtenerHijos: async (id) => {
    const response = await api.get(`/categorias-productos/${id}/hijos`)
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
