// ============================================
// API: VEHÍCULOS
// CRUD de vehículos y mantenimientos
// ============================================

import api from './Axios.config'

/**
 * API de Vehículos
 *
 * Endpoints:
 * - GET    /vehiculos                    → Listar vehículos
 * - GET    /vehiculos/:id                → Obtener vehículo
 * - POST   /vehiculos                    → Crear vehículo
 * - PUT    /vehiculos/:id                → Actualizar vehículo
 * - DELETE /vehiculos/:id                → Desactivar vehículo
 * - GET    /vehiculos/disponibles        → Vehículos disponibles
 * - POST   /vehiculos/:id/uso            → Registrar uso
 * - POST   /vehiculos/:id/mantenimiento  → Programar mantenimiento
 * - PUT    /vehiculos/mantenimiento/:id  → Actualizar mantenimiento
 * - GET    /vehiculos/estadisticas       → Estadísticas
 */
const vehiculosAPI = {
    /**
     * Obtener todos los vehículos con filtros
     * @param {Object} params - { page, limit, buscar, tipo, estado, activo, ordenar, direccion }
     */
    obtenerTodos: async (params = {}) => {
        const response = await api.get('/vehiculos', { params })
        return response.data
    },

    /**
     * Obtener vehículo por ID con historial
     * @param {number} id
     */
    obtenerPorId: async (id) => {
        const response = await api.get(`/vehiculos/${id}`)
        return response.data
    },

    /**
     * Crear nuevo vehículo
     * @param {Object} datos - { placa, marca, modelo, anio, tipo, capacidad_carga, ... }
     */
    crear: async (datos) => {
        const response = await api.post('/vehiculos', datos)
        return response.data
    },

    /**
     * Actualizar vehículo
     * @param {number} id
     * @param {Object} datos
     */
    actualizar: async (id, datos) => {
        const response = await api.put(`/vehiculos/${id}`, datos)
        return response.data
    },

    /**
     * Desactivar vehículo
     * @param {number} id
     */
    eliminar: async (id) => {
        const response = await api.delete(`/vehiculos/${id}`)
        return response.data
    },

    /**
     * Obtener vehículos disponibles
     * @param {string} fecha - Fecha ISO (opcional)
     */
    obtenerDisponibles: async (fecha = null) => {
        const params = fecha ? { fecha } : {}
        const response = await api.get('/vehiculos/disponibles', { params })
        return response.data
    },

    /**
     * Registrar uso de vehículo
     * @param {number} vehiculoId
     * @param {Object} datos - { conductor_id, fecha_uso, kilometraje_inicio, kilometraje_fin, destino, proposito }
     */
    registrarUso: async (vehiculoId, datos) => {
        const response = await api.post(`/vehiculos/${vehiculoId}/uso`, datos)
        return response.data
    },

    /**
     * Programar/registrar mantenimiento
     * @param {number} vehiculoId
     * @param {Object} datos - { tipo, fecha_programada, fecha_realizada, kilometraje, costo, descripcion }
     */
    registrarMantenimiento: async (vehiculoId, datos) => {
        const response = await api.post(`/vehiculos/${vehiculoId}/mantenimiento`, datos)
        return response.data
    },

    /**
     * Actualizar mantenimiento
     * @param {number} mantenimientoId
     * @param {Object} datos - { fecha_realizada, costo, descripcion, estado }
     */
    actualizarMantenimiento: async (mantenimientoId, datos) => {
        const response = await api.put(`/vehiculos/mantenimiento/${mantenimientoId}`, datos)
        return response.data
    },

    /**
     * Obtener estadísticas de vehículos
     */
    obtenerEstadisticas: async () => {
        const response = await api.get('/vehiculos/estadisticas')
        return response.data
    }
}

export default vehiculosAPI
