// ============================================
// API: Departamentos
// ============================================

import api from '@shared/api/Axios.config';

export const apiDepartamentos = {
  obtenerTodos: async () => {
    const response = await api.get('/departamentos');
    return response.data;
  },

  obtenerActivos: async () => {
    const response = await api.get('/departamentos/activos');
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/departamentos/${id}`);
    return response.data;
  },

  crear: async (departamento) => {
    const response = await api.post('/departamentos', departamento);
    return response.data;
  },

  actualizar: async (id, departamento) => {
    const response = await api.put(`/departamentos/${id}`, departamento);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/departamentos/${id}`);
    return response.data;
  }
};

export default apiDepartamentos;
