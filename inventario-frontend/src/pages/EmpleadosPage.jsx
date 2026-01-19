// ============================================
// PÁGINA: EMPLEADOS
// Gestión de empleados y asignación de roles
// ============================================

import { useState } from 'react'
import { Plus, Users, ArrowLeft, Search, Filter, UserCheck, UserX, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    useGetEmpleados,
    useGetRoles,
    useDeleteEmpleado,
    useReactivarEmpleado
} from '../hooks/useEmpleados'
import { useAuth } from '../hooks/auth/useAuth'
import EmpleadoFormModal from '../components/forms/EmpleadoFormModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

/**
 * Página EmpleadosPage
 *
 * Gestión completa de empleados del sistema
 *
 * FUNCIONALIDADES:
 * - Ver todos los empleados
 * - Filtrar por rol y estado
 * - Crear nuevo empleado
 * - Editar empleado existente
 * - Desactivar/Reactivar empleado
 */
export default function EmpleadosPage() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    // Solo admin y gerente pueden acceder
    const canManage = hasRole(['admin', 'gerente'])
    const canCreate = hasRole(['admin'])

    // ============================================
    // STATE: Filtros
    // ============================================
    const [filtros, setFiltros] = useState({
        buscar: '',
        rol_id: '',
        activo: ''
    })

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const { empleados, isLoading, error, refetch } = useGetEmpleados(filtros)
    const { roles } = useGetRoles()
    const { mutateAsync: deleteEmpleado, isPending: isDeleting } = useDeleteEmpleado()
    const { mutateAsync: reactivarEmpleado, isPending: isReactivating } = useReactivarEmpleado()

    // ============================================
    // STATE: Control de modales
    // ============================================
    const [modalState, setModalState] = useState({
        crear: false,
        editar: false
    })
    const [selectedEmpleado, setSelectedEmpleado] = useState(null)

    // ============================================
    // HANDLERS
    // ============================================
    const handleOpenCrear = () => {
        setModalState({ ...modalState, crear: true })
    }

    const handleCloseModal = () => {
        setModalState({ crear: false, editar: false })
        setSelectedEmpleado(null)
    }

    const handleEdit = (empleado) => {
        setSelectedEmpleado(empleado)
        setModalState({ ...modalState, editar: true })
    }

    const handleToggleActivo = async (empleado) => {
        try {
            if (empleado.activo) {
                await deleteEmpleado(empleado.id)
            } else {
                await reactivarEmpleado(empleado.id)
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error)
            alert(error.response?.data?.message || 'Error al cambiar estado del empleado')
        }
    }

    const handleFilterChange = (key, value) => {
        setFiltros({ ...filtros, [key]: value })
    }

    // ============================================
    // HELPERS
    // ============================================
    const getRolColor = (rolNombre) => {
        const colores = {
            admin: 'bg-purple-100 text-purple-700 border-purple-200',
            gerente: 'bg-blue-100 text-blue-700 border-blue-200',
            ventas: 'bg-green-100 text-green-700 border-green-200',
            operaciones: 'bg-orange-100 text-orange-700 border-orange-200',
            bodega: 'bg-slate-100 text-slate-700 border-slate-200'
        }
        return colores[rolNombre] || 'bg-slate-100 text-slate-700 border-slate-200'
    }

    // ============================================
    // RENDER: Estados de carga y error
    // ============================================
    if (isLoading) {
        return <Spinner fullScreen size="xl" text="Cargando empleados..." />
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="text-6xl mb-4">!</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Error al cargar empleados
                    </h2>
                    <p className="text-slate-600 mb-6">
                        {error.message || 'Ocurrió un error inesperado'}
                    </p>
                    <Button onClick={() => refetch()}>Reintentar</Button>
                </div>
            </div>
        )
    }

    // ============================================
    // RENDER: Contenido principal
    // ============================================
    return (
        <div className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/configuracion')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Volver</span>
                            </button>

                            <div className="flex items-center gap-3">
                                <Shield className="w-8 h-8 text-purple-600" />
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Empleados
                                    </h1>
                                    <p className="text-sm text-slate-600">
                                        Gestiona usuarios y permisos del sistema
                                    </p>
                                </div>
                            </div>
                        </div>

                        {canCreate && (
                            <Button
                                variant="primary"
                                icon={<Plus />}
                                onClick={handleOpenCrear}
                            >
                                Nuevo Empleado
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* FILTROS */}
            <div className="container mx-auto px-6 py-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Búsqueda */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    value={filtros.buscar}
                                    onChange={(e) => handleFilterChange('buscar', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filtro por rol */}
                        <div className="w-48">
                            <select
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                value={filtros.rol_id}
                                onChange={(e) => handleFilterChange('rol_id', e.target.value)}
                            >
                                <option value="">Todos los roles</option>
                                {roles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por estado */}
                        <div className="w-40">
                            <select
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                value={filtros.activo}
                                onChange={(e) => handleFilterChange('activo', e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="true">Activos</option>
                                <option value="false">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* INFO */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">
                        {filtros.buscar || filtros.rol_id || filtros.activo ? 'Resultados de búsqueda' : 'Todos los Empleados'}
                    </h2>
                    <p className="text-slate-600">
                        {empleados.length} empleado{empleados.length !== 1 ? 's' : ''} encontrado{empleados.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* TABLA DE EMPLEADOS */}
                {empleados.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                                        Empleado
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                                        Rol
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                                        Estado
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {empleados.map((empleado) => (
                                    <tr key={empleado.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-purple-600">
                                                        {empleado.nombre?.[0]}{empleado.apellido?.[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {empleado.nombre} {empleado.apellido}
                                                    </p>
                                                    {empleado.telefono && (
                                                        <p className="text-sm text-slate-500">
                                                            {empleado.telefono}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600">{empleado.email}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRolColor(empleado.rol_nombre)}`}>
                                                {empleado.rol_nombre?.charAt(0).toUpperCase() + empleado.rol_nombre?.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {empleado.activo ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                                                    <UserCheck className="w-4 h-4" />
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                                                    <UserX className="w-4 h-4" />
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {canManage && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(empleado)}
                                                            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActivo(empleado)}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                empleado.activo
                                                                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                            }`}
                                                        >
                                                            {empleado.activo ? 'Desactivar' : 'Reactivar'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No hay empleados"
                        description={
                            filtros.buscar || filtros.rol_id || filtros.activo
                                ? "No se encontraron empleados con los filtros aplicados"
                                : "Crea tu primer empleado para comenzar"
                        }
                        icon={Users}
                        action={canCreate ? {
                            label: "Crear primer empleado",
                            icon: <Plus />,
                            onClick: handleOpenCrear
                        } : undefined}
                    />
                )}
            </div>

            {/* MODALES */}
            <EmpleadoFormModal
                isOpen={modalState.crear}
                onClose={handleCloseModal}
                mode="crear"
                empleado={null}
                roles={roles}
            />

            <EmpleadoFormModal
                isOpen={modalState.editar}
                onClose={handleCloseModal}
                mode="editar"
                empleado={selectedEmpleado}
                roles={roles}
            />

            {/* Indicador de carga */}
            {(isDeleting || isReactivating) && (
                <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                    <Spinner size="sm" />
                    <span className="text-sm font-medium text-slate-700">
                        {isDeleting ? 'Desactivando...' : 'Reactivando...'}
                    </span>
                </div>
            )}
        </div>
    )
}
