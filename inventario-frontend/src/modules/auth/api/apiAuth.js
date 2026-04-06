// ============================================
// API: AUTENTICACIÓN
// Llamadas al backend para login, logout, refresh,
// verificación de email, perfil e historial
// ============================================

import api from '@shared/api/Axios.config'

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
     * Actualizar perfil del usuario autenticado
     * @param {Object} datos - { nombre, apellido, telefono }
     */
    actualizarPerfil: async (datos) => {
        const response = await api.put('/auth/perfil', datos)
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
     * Obtener historial de actividad del usuario
     * @param {Object} params - { page, limit }
     */
    obtenerHistorial: async (params = {}) => {
        const response = await api.get('/auth/historial', { params })
        return response.data
    },

    /**
     * Paso 1: Solicitar acceso (envía código de verificación al email)
     * @param {Object} datos - { nombre, apellido, email, telefono, password, rol_solicitado_id }
     */
    registro: async (datos) => {
        const response = await api.post('/auth/registro', datos)
        return response.data
    },

    /**
     * Paso 2: Verificar código de email y crear solicitud
     * @param {string} email
     * @param {string} codigo
     */
    verificarEmail: async (email, codigo) => {
        const response = await api.post('/auth/verificar-email', { email, codigo })
        return response.data
    },

    /**
     * Reenviar código de verificación
     * @param {string} email
     */
    reenviarCodigo: async (email) => {
        const response = await api.post('/auth/reenviar-codigo', { email })
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
