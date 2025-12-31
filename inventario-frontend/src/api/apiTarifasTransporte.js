// ============================================
// API: Tarifas de Transporte
// ============================================

import api from './axios';

export const apiTarifasTransporte = {
  obtenerTodas: async () => {
    const response = await api.get('/tarifas-transporte');
    return response.data;
  },

  obtenerCiudades: async () => {
    const response = await api.get('/tarifas-transporte/ciudades');
    return response.data;
  },

  obtenerTiposCamion: async () => {
    const response = await api.get('/tarifas-transporte/tipos');
    return response.data;
  },

  obtenerPorCiudad: async (ciudad) => {
    const response = await api.get(`/tarifas-transporte/ciudad/${encodeURIComponent(ciudad)}`);
    return response.data;
  },

  buscar: async (ciudad, tipoCamion) => {
    const params = new URLSearchParams();
    if (ciudad) params.append('ciudad', ciudad);
    if (tipoCamion) params.append('tipo_camion', tipoCamion);
    const response = await api.get(`/tarifas-transporte/buscar?${params}`);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/tarifas-transporte/${id}`);
    return response.data;
  }
};

export default apiTarifasTransporte;
