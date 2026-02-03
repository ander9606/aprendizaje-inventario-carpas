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

  descargarPDF: async (id) => {
    const response = await api.get(`/cotizaciones/${id}/pdf`, {
      responseType: 'blob'
    });
    // Crear link de descarga
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cotizacion_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
  },

  // ============================================
  // RECARGOS (adelanto/extensión)
  // ============================================

  /**
   * Obtener recargos de un producto
   * @param {number} cotizacionId
   * @param {number} productoId
   */
  obtenerRecargos: async (cotizacionId, productoId) => {
    const response = await api.get(`/cotizaciones/${cotizacionId}/productos/${productoId}/recargos`);
    return response.data;
  },

  /**
   * Agregar recargo a un producto
   * @param {number} cotizacionId
   * @param {number} productoId
   * @param {Object} recargo - { tipo, dias, porcentaje, fecha_original, fecha_modificada, notas }
   */
  agregarRecargo: async (cotizacionId, productoId, recargo) => {
    const response = await api.post(
      `/cotizaciones/${cotizacionId}/productos/${productoId}/recargos`,
      recargo
    );
    return response.data;
  },

  /**
   * Actualizar un recargo
   * @param {number} cotizacionId
   * @param {number} productoId
   * @param {number} recargoId
   * @param {Object} recargo - { dias, porcentaje, fecha_modificada, notas }
   */
  actualizarRecargo: async (cotizacionId, productoId, recargoId, recargo) => {
    const response = await api.put(
      `/cotizaciones/${cotizacionId}/productos/${productoId}/recargos/${recargoId}`,
      recargo
    );
    return response.data;
  },

  /**
   * Eliminar un recargo
   * @param {number} cotizacionId
   * @param {number} productoId
   * @param {number} recargoId
   */
  eliminarRecargo: async (cotizacionId, productoId, recargoId) => {
    const response = await api.delete(
      `/cotizaciones/${cotizacionId}/productos/${productoId}/recargos/${recargoId}`
    );
    return response.data;
  },

  // ============================================
  // EVENTOS
  // ============================================

  /**
   * Asignar cotización a un evento
   * @param {number} cotizacionId
   * @param {number|null} eventoId - null para desasignar
   */
  asignarEvento: async (cotizacionId, eventoId) => {
    const response = await api.patch(`/cotizaciones/${cotizacionId}/evento`, { evento_id: eventoId });
    return response.data;
  },

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Calcular monto de recargo (sin guardar)
   * @param {number} precioBase
   * @param {number} porcentaje
   * @param {number} dias
   * @returns {number}
   */
  calcularRecargo: (precioBase, porcentaje, dias) => {
    return Math.round((precioBase * (porcentaje / 100) * dias) * 100) / 100;
  }
};

export default apiCotizaciones;
