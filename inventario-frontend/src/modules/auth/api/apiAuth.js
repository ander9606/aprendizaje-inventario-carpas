// ============================================
// API: AUTENTICACIÓN
// Llamadas al backend para login, logout, refresh
// ============================================

import api from '@shared/api/Axios.config'

/**
 * API de Autenticación
 *
 * Endpoints:
 * - POST /auth/login     → Iniciar sesión
 * - POST /auth/logout    → Cerrar sesión
 * - POST /auth/refresh   → Renovar token
 * - GET  /auth/me        → Obtener perfil
 * - PUT  /auth/password  → Cambiar contraseña
 */
const authAPI = {
    /**
     * Iniciar sesión
     * @param {string} email
     * @param {string} password
     * @returns {Promise} { usuario, tokens }
     */
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        return response.data
    },

    /**
     * Cerrar sesión
     * @param {string} refreshToken
     */
    logout: async (refreshToken) => {
        const response = await api.post('/auth/logout', { refreshToken })
        return response.data
    },

    /**
     * Cerrar todas las sesiones
     */
    logoutAll: async () => {
        const response = await api.post('/auth/logout-all')
        return response.data
    },

    /**
     * Renovar access token usando refresh token
     * @param {string} refreshToken
     * @returns {Promise} { accessToken }
     */
    refresh: async (refreshToken) => {
        const response = await api.post('/auth/refresh', { refreshToken })
        return response.data
    },

    /**
     * Obtener perfil del usuario actual
     * @returns {Promise} { usuario }
     */
    getMe: async () => {
        const response = await api.get('/auth/me')
        return response.data
    },

    /**
     * Cambiar contraseña
     * @param {string} passwordActual
     * @param {string} passwordNuevo
     */
    cambiarPassword: async (passwordActual, passwordNuevo) => {
        const response = await api.put('/auth/password', {
            passwordActual,
            passwordNuevo
        })
        return response.data
    },

    /**
     * Obtener sesiones activas
     * @returns {Promise} Array de sesiones
     */
    getSesiones: async () => {
        const response = await api.get('/auth/sessions')
        return response.data
    },

    /**
     * Solicitar acceso al sistema (auto-registro)
     * @param {Object} datos - { nombre, apellido, email, telefono, password, rol_solicitado_id }
     */
    registro: async (datos) => {
        const response = await api.post('/auth/registro', datos)
        return response.data
    },

    /**
     * Obtener roles disponibles para registro público
     * @returns {Promise} Array de roles (sin admin)
     */
    getRolesRegistro: async () => {
        const response = await api.get('/auth/roles-registro')
        return response.data
    }
}

export default authAPI
