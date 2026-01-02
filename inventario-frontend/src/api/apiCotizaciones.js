// ============================================
// API: Cotizaciones
// ============================================

import api from './Axios.config';

export const apiCotizaciones = {
  obtenerTodas: async () => {
    const response = await api.get('/cotizaciones');
    return response.data;
  },

  obtenerPorEstado: async (estado) => {
    const response = await api.get(`/cotizaciones/estado/${estado}`);
    return response.data;
  },

  obtenerPorCliente: async (clienteId) => {
    const response = await api.get(`/cotizaciones/cliente/${clienteId}`);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/cotizaciones/${id}`);
    return response.data;
  },

  obtenerCompleta: async (id) => {
    const response = await api.get(`/cotizaciones/${id}/completa`);
    return response.data;
  },

  verificarDisponibilidad: async (id, fechaInicio, fechaFin) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    const response = await api.get(`/cotizaciones/${id}/disponibilidad?${params}`);
    return response.data;
  },

  crear: async (cotizacion) => {
    const response = await api.post('/cotizaciones', cotizacion);
    return response.data;
  },

  actualizar: async (id, cotizacion) => {
    const response = await api.put(`/cotizaciones/${id}`, cotizacion);
    return response.data;
  },

  cambiarEstado: async (id, estado) => {
    const response = await api.patch(`/cotizaciones/${id}/estado`, { estado });
    return response.data;
  },

  aprobar: async (id, opciones = {}) => {
    const response = await api.post(`/cotizaciones/${id}/aprobar`, opciones);
    return response.data;
  },

  duplicar: async (id) => {
    const response = await api.post(`/cotizaciones/${id}/duplicar`);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/cotizaciones/${id}`);
    return response.data;
  },

  // Productos
  agregarProducto: async (cotizacionId, producto) => {
    const response = await api.post(`/cotizaciones/${cotizacionId}/productos`, producto);
    return response.data;
  },

  eliminarProducto: async (cotizacionId, productoId) => {
    const response = await api.delete(`/cotizaciones/${cotizacionId}/productos/${productoId}`);
    return response.data;
  },

  // Transporte
  agregarTransporte: async (cotizacionId, transporte) => {
    const response = await api.post(`/cotizaciones/${cotizacionId}/transporte`, transporte);
    return response.data;
  },

  eliminarTransporte: async (cotizacionId, transporteId) => {
    const response = await api.delete(`/cotizaciones/${cotizacionId}/transporte/${transporteId}`);
    return response.data;
  }
};

export default apiCotizaciones;
