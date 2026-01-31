// ============================================
// API: Descuentos
// Catálogo de descuentos predefinidos
// ============================================

import api from './Axios.config';

export const apiDescuentos = {
  // ============================================
  // CATÁLOGO DE DESCUENTOS
  // ============================================

  obtenerTodos: async (incluirInactivos = false) => {
    const params = incluirInactivos ? '?incluir_inactivos=true' : '';
    const response = await api.get(`/descuentos${params}`);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/descuentos/${id}`);
    return response.data;
  },

  crear: async (descuento) => {
    const response = await api.post('/descuentos', descuento);
    return response.data;
  },

  actualizar: async (id, descuento) => {
    const response = await api.put(`/descuentos/${id}`, descuento);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/descuentos/${id}`);
    return response.data;
  },

  // ============================================
  // DESCUENTOS EN COTIZACIONES
  // ============================================

  obtenerDeCotizacion: async (cotizacionId) => {
    const response = await api.get(`/cotizaciones/${cotizacionId}/descuentos`);
    return response.data;
  },

  aplicarACotizacion: async (cotizacionId, datos) => {
    // datos puede ser:
    // - { descuento_id: number, notas?: string } para descuento predefinido
    // - { monto: number, es_porcentaje?: boolean, notas?: string } para descuento manual
    const response = await api.post(`/cotizaciones/${cotizacionId}/descuentos`, datos);
    return response.data;
  },

  eliminarDeCotizacion: async (cotizacionId, descuentoAplicadoId) => {
    const response = await api.delete(`/cotizaciones/${cotizacionId}/descuentos/${descuentoAplicadoId}`);
    return response.data;
  }
};

export default apiDescuentos;
