// ============================================
// API: Eventos
// ============================================

import api from '@shared/api/Axios.config';

export const apiEventos = {
  obtenerTodos: async () => {
    const response = await api.get('/eventos');
    return response.data;
  },

  obtenerPorEstado: async (estado) => {
    const response = await api.get(`/eventos/estado/${estado}`);
    return response.data;
  },

  obtenerPorCliente: async (clienteId) => {
    const response = await api.get(`/eventos/cliente/${clienteId}`);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/eventos/${id}`);
    return response.data;
  },

  obtenerCotizaciones: async (id) => {
    const response = await api.get(`/eventos/${id}/cotizaciones`);
    return response.data;
  },

  crear: async (evento) => {
    const response = await api.post('/eventos', evento);
    return response.data;
  },

  actualizar: async (id, evento) => {
    const response = await api.put(`/eventos/${id}`, evento);
    return response.data;
  },

  cambiarEstado: async (id, estado) => {
    const response = await api.patch(`/eventos/${id}/estado`, { estado });
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/eventos/${id}`);
    return response.data;
  },

  repetir: async (id, { fecha_inicio, fecha_fin }) => {
    const response = await api.post(`/eventos/${id}/repetir`, { fecha_inicio, fecha_fin });
    return response.data;
  },

  obtenerNovedades: async (id) => {
    const response = await api.get(`/eventos/${id}/novedades`);
    return response.data;
  }
};

export default apiEventos;
