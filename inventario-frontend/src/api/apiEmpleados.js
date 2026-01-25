// ============================================
// API: EMPLEADOS
// CRUD de empleados y roles
// ============================================

import api from './Axios.config'

/**
 * API de Empleados
 *
 * Endpoints:
 * - GET    /empleados              → Listar empleados
 * - GET    /empleados/:id          → Obtener empleado
 * - POST   /empleados              → Crear empleado
 * - PUT    /empleados/:id          → Actualizar empleado
 * - DELETE /empleados/:id          → Desactivar empleado
 * - PUT    /empleados/:id/reactivar → Reactivar empleado
 * - PUT    /empleados/:id/password → Cambiar contraseña
 * - GET    /empleados/roles        → Listar roles
 * - GET    /empleados/disponibles/campo → Empleados para campo
 * - GET    /empleados/estadisticas → Estadísticas
 */
const empleadosAPI = {
    /**
     * Obtener todos los empleados con filtros
     * @param {Object} params - { page, limit, buscar, rol_id, activo, ordenar, direccion }
     */
    obtenerTodos: async (params = {}) => {
        const response = await api.get('/empleados', { params })
        return response.data
    },

    /**
     * Obtener empleado por ID
     * @param {number} id
     */
    obtenerPorId: async (id) => {
        const response = await api.get(`/empleados/${id}`)
        return response.data
    },

    /**
     * Crear nuevo empleado
     * @param {Object} datos - { nombre, apellido, email, telefono, password, rol_id }
     */
    crear: async (datos) => {
        const response = await api.post('/empleados', datos)
        return response.data
    },

    /**
     * Actualizar empleado
     * @param {number} id
     * @param {Object} datos - { nombre, apellido, email, telefono, rol_id, activo }
     */
    actualizar: async (id, datos) => {
        const response = await api.put(`/empleados/${id}`, datos)
        return response.data
    },

    /**
     * Desactivar empleado
     * @param {number} id
     */
    eliminar: async (id) => {
        const response = await api.delete(`/empleados/${id}`)
        return response.data
    },

    /**
     * Reactivar empleado
     * @param {number} id
     */
    reactivar: async (id) => {
        const response = await api.put(`/empleados/${id}/reactivar`)
        return response.data
    },

    /**
     * Cambiar contraseña de empleado (admin)
     * @param {number} id
     * @param {string} password
     */
    cambiarPassword: async (id, password) => {
        const response = await api.put(`/empleados/${id}/password`, { password })
        return response.data
    },

    /**
     * Obtener lista de roles disponibles
     */
    obtenerRoles: async () => {
        const response = await api.get('/empleados/roles')
        return response.data
    },

    /**
     * Obtener empleados disponibles para trabajo de campo
     * @param {string} fecha - Fecha ISO (opcional)
     */
    obtenerDisponiblesCampo: async (fecha = null) => {
        const params = fecha ? { fecha } : {}
        const response = await api.get('/empleados/disponibles/campo', { params })
        return response.data
    },

    /**
     * Obtener estadísticas de empleados
     */
    obtenerEstadisticas: async () => {
        const response = await api.get('/empleados/estadisticas')
        return response.data
    }
}

export default empleadosAPI
