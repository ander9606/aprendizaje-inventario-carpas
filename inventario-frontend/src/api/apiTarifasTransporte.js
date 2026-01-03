// ============================================
// API: Tarifas de Transporte
// ============================================

import api from './Axios.config';

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
  },

  crear: async (tarifa) => {
    const response = await api.post('/tarifas-transporte', tarifa);
    return response.data;
  },

  actualizar: async (id, tarifa) => {
    const response = await api.put(`/tarifas-transporte/${id}`, tarifa);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/tarifas-transporte/${id}`);
    return response.data;
  }
};

// Categorías de camión fijas
export const CATEGORIAS_CAMION = [
  { id: 'pequeno', nombre: 'Pequeño', descripcion: 'Hasta 3 toneladas' },
  { id: 'mediano', nombre: 'Mediano', descripcion: '3-8 toneladas' },
  { id: 'grande', nombre: 'Grande', descripcion: '8-15 toneladas' },
  { id: 'extragrande', nombre: 'Extragrande', descripcion: 'Más de 15 toneladas' }
];

export default apiTarifasTransporte;
