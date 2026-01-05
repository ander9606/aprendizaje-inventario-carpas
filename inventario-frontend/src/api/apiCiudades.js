// ============================================
// API: Ciudades
// ============================================

import api from './Axios.config';

export const apiCiudades = {
  obtenerTodas: async () => {
    const response = await api.get('/ciudades');
    return response.data;
  },

  obtenerActivas: async () => {
    const response = await api.get('/ciudades/activas');
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/ciudades/${id}`);
    return response.data;
  },

  crear: async (ciudad) => {
    const response = await api.post('/ciudades', ciudad);
    return response.data;
  },

  actualizar: async (id, ciudad) => {
    const response = await api.put(`/ciudades/${id}`, ciudad);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/ciudades/${id}`);
    return response.data;
  },

  desactivar: async (id) => {
    const response = await api.patch(`/ciudades/${id}/desactivar`);
    return response.data;
  }
};

export default apiCiudades;
