// ============================================
// API: Configuración de Alquileres
// ============================================

import api from './Axios.config';

export const apiConfiguracion = {
  // Obtener todas las configuraciones
  obtenerTodas: async () => {
    const response = await api.get('/configuracion-alquileres');
    return response.data;
  },

  // Obtener configuración completa como objeto
  obtenerCompleta: async () => {
    const response = await api.get('/configuracion-alquileres/completa');
    return response.data;
  },

  // Obtener por categoría
  obtenerPorCategoria: async (categoria) => {
    const response = await api.get(`/configuracion-alquileres/categoria/${categoria}`);
    return response.data;
  },

  // Obtener categorías disponibles
  obtenerCategorias: async () => {
    const response = await api.get('/configuracion-alquileres/categorias');
    return response.data;
  },

  // Obtener valor específico
  obtenerValor: async (clave) => {
    const response = await api.get(`/configuracion-alquileres/${clave}`);
    return response.data;
  },

  // Actualizar valor específico
  actualizarValor: async (clave, valor) => {
    const response = await api.put(`/configuracion-alquileres/${clave}`, { valor });
    return response.data;
  },

  // Actualizar múltiples valores
  actualizarValores: async (valores) => {
    const response = await api.put('/configuracion-alquileres', { valores });
    return response.data;
  },

  // Subir logo de empresa
  subirLogo: async (archivo) => {
    const formData = new FormData();
    formData.append('logo', archivo);
    const response = await api.post('/configuracion-alquileres/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Eliminar logo de empresa
  eliminarLogo: async () => {
    const response = await api.delete('/configuracion-alquileres/logo');
    return response.data;
  }
};

export default apiConfiguracion;
