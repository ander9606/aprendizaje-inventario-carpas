// ============================================
// API: Clientes
// ============================================

import api from './Axios.config';

export const apiClientes = {
  obtenerTodos: async () => {
    const response = await api.get('/clientes');
    return response.data;
  },

  obtenerActivos: async () => {
    const response = await api.get('/clientes/activos');
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  buscar: async (termino) => {
    const response = await api.get(`/clientes/buscar?q=${encodeURIComponent(termino)}`);
    return response.data;
  },

  crear: async (cliente) => {
    const response = await api.post('/clientes', cliente);
    return response.data;
  },

  actualizar: async (id, cliente) => {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  }
};

export default apiClientes;
