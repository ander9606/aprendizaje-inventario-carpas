// ============================================
// COMPONENTE: PermisoGate
// Mostrar/ocultar contenido según permisos
// ============================================

import useAuthStore from '../../stores/authStore'

/**
 * PermisoGate - Muestra contenido solo si el usuario tiene el permiso
 *
 * @param {string[]} roles - Roles permitidos
 * @param {string} modulo - Módulo para verificar permiso
 * @param {string} accion - Acción requerida (leer, crear, editar, eliminar)
 * @param {ReactNode} children - Contenido a mostrar si tiene permiso
 * @param {ReactNode} fallback - Contenido alternativo si no tiene permiso
 *
 * @example
 * // Por rol
 * <PermisoGate roles={['admin']}>
 *   <button>Solo admin ve esto</button>
 * </PermisoGate>
 *
 * // Por permiso específico
 * <PermisoGate modulo="inventario" accion="crear">
 *   <button>Crear elemento</button>
 * </PermisoGate>
 *
 * // Con fallback
 * <PermisoGate roles={['admin']} fallback={<span>Sin permisos</span>}>
 *   <button>Eliminar</button>
 * </PermisoGate>
 */
const PermisoGate = ({
    roles = null,
    modulo = null,
    accion = null,
    children,
    fallback = null
}) => {
    const { hasRole, hasPermiso, isAuthenticated } = useAuthStore()

    // Si no está autenticado, no mostrar nada
    if (!isAuthenticated) {
        return fallback
    }

    // Verificar por rol
    if (roles && roles.length > 0) {
        if (!hasRole(roles)) {
            return fallback
        }
    }

    // Verificar por permiso específico
    if (modulo && accion) {
        if (!hasPermiso(modulo, accion)) {
            return fallback
        }
    }

    // Tiene permiso, mostrar contenido
    return children
}

/**
 * Hook helper para verificar permisos en código
 *
 * @example
 * const { canEdit, canDelete, isAdmin } = usePermissions('inventario')
 *
 * if (canEdit) {
 *   // mostrar botón editar
 * }
 */
export const usePermissions = (modulo) => {
    const { hasRole, hasPermiso } = useAuthStore()

    return {
        canRead: hasRole('admin') || hasPermiso(modulo, 'leer'),
        canCreate: hasRole('admin') || hasPermiso(modulo, 'crear'),
        canEdit: hasRole('admin') || hasPermiso(modulo, 'editar'),
        canDelete: hasRole('admin') || hasPermiso(modulo, 'eliminar'),
        isAdmin: hasRole('admin'),
        isGerente: hasRole(['admin', 'gerente']),
        isOperaciones: hasRole(['admin', 'gerente', 'operaciones'])
    }
}

/**
 * Componentes especializados para roles comunes
 */
export const AdminOnly = ({ children, fallback = null }) => (
    <PermisoGate roles={['admin']} fallback={fallback}>
        {children}
    </PermisoGate>
)

export const GerenteOnly = ({ children, fallback = null }) => (
    <PermisoGate roles={['admin', 'gerente']} fallback={fallback}>
        {children}
    </PermisoGate>
)

export const OperacionesOnly = ({ children, fallback = null }) => (
    <PermisoGate roles={['admin', 'gerente', 'operaciones']} fallback={fallback}>
        {children}
    </PermisoGate>
)

export default PermisoGate
