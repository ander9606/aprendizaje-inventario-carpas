// ============================================
// API: Productos de Alquiler (Elementos Compuestos)
// ============================================

import api from './axios';

export const apiProductosAlquiler = {
  obtenerTodos: async () => {
    const response = await api.get('/elementos-compuestos');
    return response.data;
  },

  buscar: async (termino) => {
    const response = await api.get(`/elementos-compuestos/buscar?q=${encodeURIComponent(termino)}`);
    return response.data;
  },

  obtenerPorCategoria: async (categoriaId) => {
    const response = await api.get(`/elementos-compuestos/categoria/${categoriaId}`);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/elementos-compuestos/${id}`);
    return response.data;
  },

  obtenerCompleto: async (id) => {
    const response = await api.get(`/elementos-compuestos/${id}/completo`);
    return response.data;
  },

  obtenerComponentes: async (id) => {
    const response = await api.get(`/elementos-compuestos/${id}/componentes`);
    return response.data;
  },

  crear: async (producto) => {
    const response = await api.post('/elementos-compuestos', producto);
    return response.data;
  },

  actualizar: async (id, producto) => {
    const response = await api.put(`/elementos-compuestos/${id}`, producto);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/elementos-compuestos/${id}`);
    return response.data;
  }
};

export default apiProductosAlquiler;
