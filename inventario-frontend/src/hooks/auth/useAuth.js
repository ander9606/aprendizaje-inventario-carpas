// ============================================
// HOOK: useAuth
// Interface simplificada para autenticación
// ============================================

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

/**
 * Hook de Autenticación
 *
 * Proporciona:
 * - Estado: usuario, isAuthenticated, isLoading, error
 * - Acciones: login, logout, checkAuth
 * - Helpers: hasRole, hasPermiso
 *
 * @example
 * const { usuario, login, logout, isAuthenticated } = useAuth()
 *
 * // Login
 * const result = await login(email, password)
 * if (result.success) {
 *   navigate('/dashboard')
 * }
 *
 * // Verificar rol
 * if (hasRole(['admin', 'gerente'])) {
 *   // mostrar opciones de admin
 * }
 */
export const useAuth = () => {
    const navigate = useNavigate()

    // Obtener estado y acciones del store
    const {
        usuario,
        accessToken,
        isAuthenticated,
        isLoading,
        error,
        login: storeLogin,
        logout: storeLogout,
        checkAuth,
        clearError,
        hasRole,
        hasPermiso
    } = useAuthStore()

    /**
     * Iniciar sesión
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const login = useCallback(async (email, password) => {
        const result = await storeLogin(email, password)
        return result
    }, [storeLogin])

    /**
     * Cerrar sesión y redirigir a login
     */
    const logout = useCallback(async () => {
        await storeLogout()
        navigate('/login')
    }, [storeLogout, navigate])

    /**
     * Obtener nombre completo del usuario
     */
    const getNombreCompleto = useCallback(() => {
        if (!usuario) return ''
        return `${usuario.nombre} ${usuario.apellido}`.trim()
    }, [usuario])

    /**
     * Obtener iniciales del usuario
     */
    const getIniciales = useCallback(() => {
        if (!usuario) return ''
        const nombre = usuario.nombre?.[0] || ''
        const apellido = usuario.apellido?.[0] || ''
        return `${nombre}${apellido}`.toUpperCase()
    }, [usuario])

    return {
        // Estado
        usuario,
        accessToken,
        isAuthenticated,
        isLoading,
        error,

        // Acciones
        login,
        logout,
        checkAuth,
        clearError,

        // Helpers
        hasRole,
        hasPermiso,
        getNombreCompleto,
        getIniciales
    }
}

/**
 * Hook para verificar permisos
 *
 * @example
 * const { canRead, canCreate, canEdit, canDelete } = usePermisos('inventario')
 */
export const usePermisos = (modulo) => {
    const { hasPermiso, hasRole } = useAuthStore()

    return {
        canRead: hasRole('admin') || hasPermiso(modulo, 'leer'),
        canCreate: hasRole('admin') || hasPermiso(modulo, 'crear'),
        canEdit: hasRole('admin') || hasPermiso(modulo, 'editar'),
        canDelete: hasRole('admin') || hasPermiso(modulo, 'eliminar'),
        isAdmin: hasRole('admin'),
        isGerente: hasRole(['admin', 'gerente'])
    }
}

export default useAuth
