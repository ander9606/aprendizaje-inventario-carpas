// ============================================
// API: ELEMENTOS COMPUESTOS
// Plantillas de productos para alquiler
// ============================================

import api from './Axios.config'

const elementosCompuestosAPI = {
  // ============================================
  // OBTENER ELEMENTOS COMPUESTOS
  // ============================================

  // Obtener todos los elementos compuestos
  obtenerTodos: async () => {
    const response = await api.get('/elementos-compuestos')
    return response.data
  },

  // Obtener por categoría
  obtenerPorCategoria: async (categoriaId) => {
    const response = await api.get(`/elementos-compuestos/categoria/${categoriaId}`)
    return response.data
  },

  // Obtener uno por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/elementos-compuestos/${id}`)
    return response.data
  },

  // Obtener con todos los componentes
  obtenerConComponentes: async (id) => {
    const response = await api.get(`/elementos-compuestos/${id}/completo`)
    return response.data
  },

  // Obtener componentes agrupados por tipo
  obtenerComponentesAgrupados: async (id) => {
    const response = await api.get(`/elementos-compuestos/${id}/componentes`)
    return response.data
  },

  // Buscar elementos compuestos
  buscar: async (query) => {
    const response = await api.get(`/elementos-compuestos/buscar?q=${query}`)
    return response.data
  },

  // ============================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // ============================================

  // Crear nuevo elemento compuesto (con componentes)
  crear: async (data) => {
    const response = await api.post('/elementos-compuestos', data)
    return response.data
  },

  // Actualizar elemento compuesto (sin componentes)
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
  // GESTIÓN DE COMPONENTES
  // ============================================

  // Agregar un componente
  agregarComponente: async (elementoId, componente) => {
    const response = await api.post(`/elementos-compuestos/${elementoId}/componentes`, componente)
    return response.data
  },

  // Actualizar todos los componentes (reemplaza)
  actualizarComponentes: async (elementoId, componentes) => {
    const response = await api.put(`/elementos-compuestos/${elementoId}/componentes`, { componentes })
    return response.data
  },

  // Eliminar un componente específico
  eliminarComponente: async (elementoId, componenteId) => {
    const response = await api.delete(`/elementos-compuestos/${elementoId}/componentes/${componenteId}`)
    return response.data
  }
}

export default elementosCompuestosAPI
