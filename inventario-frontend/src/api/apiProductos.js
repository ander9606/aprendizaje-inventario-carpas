// ============================================
// API: PRODUCTOS (Categorías de Productos y Elementos Compuestos)
// ============================================

import api from './Axios.config'

// ============================================
// API: CATEGORÍAS DE PRODUCTOS
// ============================================

export const categoriasProductosAPI = {
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

  // Crear nueva categoría de productos
  crear: async (data) => {
    const response = await api.post('/categorias-productos', data)
    return response.data
  },

  // Actualizar categoría de productos
  actualizar: async (id, data) => {
    const response = await api.put(`/categorias-productos/${id}`, data)
    return response.data
  },

  // Eliminar categoría de productos
  eliminar: async (id) => {
    const response = await api.delete(`/categorias-productos/${id}`)
    return response.data
  }
}

// ============================================
// API: ELEMENTOS COMPUESTOS (Plantillas de Productos)
// ============================================

export const elementosCompuestosAPI = {
  // ============================================
  // OBTENER ELEMENTOS
  // ============================================

  // Obtener todos los elementos compuestos
  obtenerTodos: async () => {
    const response = await api.get('/elementos-compuestos')
    return response.data
  },

  // Obtener elementos compuestos por categoría
  obtenerPorCategoria: async (categoriaId) => {
    const response = await api.get(`/elementos-compuestos?categoria_id=${categoriaId}`)
    return response.data
  },

  // Obtener un elemento compuesto por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/elementos-compuestos/${id}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nuevo elemento compuesto
  crear: async (data) => {
    const response = await api.post('/elementos-compuestos', data)
    return response.data
  },

  // Actualizar elemento compuesto
  actualizar: async (id, data) => {
    const response = await api.put(`/elementos-compuestos/${id}`, data)
    return response.data
  },

  // Eliminar elemento compuesto
  eliminar: async (id) => {
    const response = await api.delete(`/elementos-compuestos/${id}`)
    return response.data
  },

  // ============================================
  // COMPONENTES DEL ELEMENTO COMPUESTO
  // ============================================

  // Obtener componentes de un elemento (agrupados por tipo)
  obtenerComponentes: async (elementoId) => {
    const response = await api.get(`/elementos-compuestos/${elementoId}/componentes`)
    return response.data
  },

  // Agregar un componente al elemento
  agregarComponente: async (elementoId, componente) => {
    const response = await api.post(`/elementos-compuestos/${elementoId}/componentes`, componente)
    return response.data
  },

  // Reemplazar todos los componentes (PUT)
  reemplazarComponentes: async (elementoId, componentes) => {
    const response = await api.put(`/elementos-compuestos/${elementoId}/componentes`, { componentes })
    return response.data
  },

  // Eliminar un componente específico
  eliminarComponente: async (elementoId, componenteId) => {
    const response = await api.delete(`/elementos-compuestos/${elementoId}/componentes/${componenteId}`)
    return response.data
  },

  // Actualizar un componente específico
  actualizarComponente: async (elementoId, componenteId, data) => {
    const response = await api.put(`/elementos-compuestos/${elementoId}/componentes/${componenteId}`, data)
    return response.data
  }
}

export default {
  categoriasProductos: categoriasProductosAPI,
  elementosCompuestos: elementosCompuestosAPI
}
