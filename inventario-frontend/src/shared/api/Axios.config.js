// ============================================
// CONFIGURACIÓN DE AXIOS
// Instancia configurada con interceptores y auth
// ============================================

import axios from "axios"

// URL base del backend (desde .env o por defecto localhost)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// ============================================
// CREAR INSTANCIA DE AXIOS
// ============================================

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
})

// ============================================
// HELPERS PARA ACCEDER AL STORE
// (Evita importación circular)
// ============================================

let getAuthState = null
let setAuthState = null

/**
 * Configurar las funciones de acceso al store de auth
 * Se llama desde main.jsx después de crear el store
 */
export const configureAuthInterceptor = (getState, setState) => {
    getAuthState = getState
    setAuthState = setState
}

// ============================================
// INTERCEPTOR DE REQUEST
// Añade el token a cada petición
// ============================================

api.interceptors.request.use(
    (config) => {
        // Obtener token del store
        if (getAuthState) {
            const { accessToken } = getAuthState()
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`
            }
        }

        // Log en desarrollo (menos verbose)
        if (import.meta.env.DEV) {
            console.log(`🚀 [API] ${config.method.toUpperCase()} ${config.url}`)
        }

        return config
    },
    (error) => {
        console.error('❌ Error en petición:', error)
        return Promise.reject(error)
    }
)

// ============================================
// INTERCEPTOR DE RESPONSE
// Maneja errores y renovación de token
// ============================================

// Flag para evitar múltiples intentos de refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => {
        // Log en desarrollo (menos verbose)
        if (import.meta.env.DEV) {
            console.log(`✅ [API] ${response.config.method.toUpperCase()} ${response.config.url}`)
        }
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // ============================================
        // MANEJO DE ERROR 401 (No autorizado)
        // ============================================
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Si es la ruta de login o refresh, no intentar renovar
            if (originalRequest.url.includes('/auth/login') ||
                originalRequest.url.includes('/auth/refresh')) {
                return Promise.reject(error)
            }

            // Si ya estamos renovando, encolar la petición
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return api(originalRequest)
                }).catch(err => {
                    return Promise.reject(err)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            // Intentar renovar el token
            if (getAuthState && setAuthState) {
                const { refreshToken } = getAuthState()

                if (refreshToken) {
                    try {
                        const response = await axios.post(`${API_URL}/auth/refresh`, {
                            refreshToken
                        })

                        if (response.data.success) {
                            const newToken = response.data.data.accessToken

                            // Actualizar el store
                            setAuthState({ accessToken: newToken })

                            // Procesar cola de peticiones
                            processQueue(null, newToken)

                            // Reintentar la petición original
                            originalRequest.headers.Authorization = `Bearer ${newToken}`
                            return api(originalRequest)
                        }
                    } catch (refreshError) {
                        processQueue(refreshError, null)

                        // Cerrar sesión si falla el refresh
                        setAuthState({
                            usuario: null,
                            accessToken: null,
                            refreshToken: null,
                            isAuthenticated: false
                        })

                        // Redirigir a login
                        window.location.href = '/login'

                        return Promise.reject(refreshError)
                    } finally {
                        isRefreshing = false
                    }
                } else {
                    // No hay refresh token, redirigir a login
                    setAuthState({
                        usuario: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false
                    })
                    window.location.href = '/login'
                }
            }
        }

        // ============================================
        // MANEJO DE OTROS ERRORES
        // ============================================
        if (error.response) {
            const status = error.response.status
            const mensaje = error.response.data?.message || 'Error desconocido'

            if (import.meta.env.DEV) {
                console.error(`❌ [API] Error ${status}:`, mensaje)
            }

            switch (status) {
                case 400:
                    console.error("Solicitud incorrecta:", mensaje)
                    break
                case 403:
                    console.error("Acceso denegado:", mensaje)
                    break
                case 404:
                    console.error("Recurso no encontrado:", mensaje)
                    break
                case 423:
                    console.error("Cuenta bloqueada:", mensaje)
                    break
                case 500:
                    console.error("Error interno del servidor:", mensaje)
                    break
            }
        } else if (error.request) {
            console.error('❌ Sin respuesta del servidor:', error.request)
        } else {
            console.error('❌ Error en la configuración:', error.message)
        }

        return Promise.reject(error)
    }
)

// ============================================
// EXPORTAR
// ============================================

export default api
export { API_URL }
