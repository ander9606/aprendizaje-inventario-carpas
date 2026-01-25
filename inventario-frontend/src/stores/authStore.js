// ============================================
// STORE: AUTENTICACIÓN (Zustand)
// Estado global de autenticación
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authAPI from '../api/apiAuth'

/**
 * Store de Autenticación
 *
 * Estado:
 * - usuario: datos del usuario logueado
 * - accessToken: JWT de acceso (corta duración)
 * - refreshToken: token para renovar (larga duración)
 * - isAuthenticated: si hay sesión activa
 * - isLoading: si está cargando
 *
 * Acciones:
 * - login: iniciar sesión
 * - logout: cerrar sesión
 * - refresh: renovar token
 * - checkAuth: verificar sesión al cargar la app
 */
const useAuthStore = create(
    persist(
        (set, get) => ({
            // ============================================
            // ESTADO INICIAL
            // ============================================
            usuario: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,

            // ============================================
            // ACCIONES
            // ============================================

            /**
             * Iniciar sesión
             */
            login: async (email, password) => {
                set({ isLoading: true, error: null })

                try {
                    const response = await authAPI.login(email, password)

                    if (response.success) {
                        const { usuario, tokens } = response.data

                        set({
                            usuario,
                            accessToken: tokens.accessToken,
                            refreshToken: tokens.refreshToken,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        })

                        return { success: true, usuario }
                    } else {
                        set({
                            isLoading: false,
                            error: response.message || 'Error al iniciar sesión'
                        })
                        return { success: false, error: response.message }
                    }
                } catch (error) {
                    const mensaje = error.response?.data?.message || 'Error de conexión'
                    set({
                        isLoading: false,
                        error: mensaje
                    })
                    return { success: false, error: mensaje }
                }
            },

            /**
             * Cerrar sesión
             */
            logout: async () => {
                const { refreshToken } = get()

                try {
                    if (refreshToken) {
                        await authAPI.logout(refreshToken)
                    }
                } catch (error) {
                    console.error('Error al cerrar sesión:', error)
                } finally {
                    // Limpiar estado siempre
                    set({
                        usuario: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    })
                }
            },

            /**
             * Renovar access token
             */
            refreshAccessToken: async () => {
                const { refreshToken } = get()

                if (!refreshToken) {
                    get().logout()
                    return false
                }

                try {
                    const response = await authAPI.refresh(refreshToken)

                    if (response.success) {
                        set({ accessToken: response.data.accessToken })
                        return true
                    } else {
                        get().logout()
                        return false
                    }
                } catch (error) {
                    console.error('Error al renovar token:', error)
                    get().logout()
                    return false
                }
            },

            /**
             * Verificar autenticación al cargar la app
             */
            checkAuth: async () => {
                const { accessToken, refreshToken } = get()

                // Si no hay tokens, no hay sesión
                if (!accessToken && !refreshToken) {
                    set({ isLoading: false, isAuthenticated: false })
                    return false
                }

                set({ isLoading: true })

                try {
                    // Intentar obtener perfil con el token actual
                    const response = await authAPI.getMe()

                    if (response.success) {
                        set({
                            usuario: response.data,
                            isAuthenticated: true,
                            isLoading: false
                        })
                        return true
                    }
                } catch (error) {
                    // Si el token expiró, intentar renovar
                    if (error.response?.status === 401 && refreshToken) {
                        const refreshed = await get().refreshAccessToken()

                        if (refreshed) {
                            // Reintentar obtener perfil
                            try {
                                const response = await authAPI.getMe()
                                if (response.success) {
                                    set({
                                        usuario: response.data,
                                        isAuthenticated: true,
                                        isLoading: false
                                    })
                                    return true
                                }
                            } catch (e) {
                                // Si falla de nuevo, cerrar sesión
                            }
                        }
                    }
                }

                // Si llegamos aquí, la sesión no es válida
                set({
                    usuario: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false
                })
                return false
            },

            /**
             * Limpiar error
             */
            clearError: () => set({ error: null }),

            /**
             * Verificar si tiene un rol específico
             */
            hasRole: (roles) => {
                const { usuario } = get()
                if (!usuario) return false

                const rolesArray = Array.isArray(roles) ? roles : [roles]
                return rolesArray.includes(usuario.rol)
            },

            /**
             * Verificar si tiene un permiso específico
             */
            hasPermiso: (modulo, accion) => {
                const { usuario } = get()
                if (!usuario) return false

                // Admin tiene todos los permisos
                if (usuario.rol === 'admin') return true

                const permisos = usuario.permisos
                if (!permisos || !permisos[modulo]) return false

                return permisos[modulo][accion] === true
            }
        }),
        {
            name: 'auth-storage', // nombre en localStorage
            partialize: (state) => ({
                // Solo persistir estos campos
                usuario: state.usuario,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
)

export default useAuthStore
