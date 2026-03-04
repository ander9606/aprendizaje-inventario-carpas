// ============================================
// COMPONENTE: ProtectedRoute
// HOC para proteger rutas que requieren autenticación
// ============================================

import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useAuthStore from '@shared/stores/authStore'

/**
 * ProtectedRoute - Protege rutas que requieren autenticación
 *
 * @param {string[]} roles - Roles permitidos (opcional)
 * @param {string} redirectTo - Ruta de redirección si no autorizado
 *
 * @example
 * // Proteger ruta que solo requiere autenticación
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 *
 * // Proteger ruta con roles específicos
 * <Route element={<ProtectedRoute roles={['admin', 'gerente']} />}>
 *   <Route path="/empleados" element={<EmpleadosPage />} />
 * </Route>
 */
const ProtectedRoute = ({ roles = null, redirectTo = '/login' }) => {
    const location = useLocation()
    const { isAuthenticated, isLoading, usuario, hasRole, checkAuth } = useAuthStore()

    // ============================================
    // VERIFICAR AUTH AL MONTAR
    // ============================================
    useEffect(() => {
        checkAuth()
    }, [])

    // ============================================
    // ESTADO DE CARGA
    // ============================================
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    // ============================================
    // NO AUTENTICADO → Redirigir a login
    // ============================================
    if (!isAuthenticated) {
        // Guardar la ubicación actual para redirigir después del login
        return <Navigate to={redirectTo} state={{ from: location }} replace />
    }

    // ============================================
    // VERIFICAR ROLES (si se especificaron)
    // ============================================
    if (roles && roles.length > 0) {
        const tieneRol = hasRole(roles)

        if (!tieneRol) {
            // Usuario autenticado pero sin el rol requerido
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Acceso Denegado
                        </h1>
                        <p className="text-slate-600 mb-6">
                            No tienes permisos para acceder a esta sección.
                            {usuario && (
                                <span className="block mt-2 text-sm">
                                    Tu rol actual es: <strong>{usuario.rol}</strong>
                                </span>
                            )}
                        </p>
                        <a
                            href="/"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Volver al inicio
                        </a>
                    </div>
                </div>
            )
        }
    }

    // ============================================
    // AUTORIZADO → Renderizar contenido
    // ============================================
    return <Outlet />
}

export default ProtectedRoute
