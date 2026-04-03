// ============================================
// PAGINA: EMPLEADOS
// Gestion de empleados, roles y solicitudes
// ============================================

import { useState, useEffect } from 'react'
import { Plus, Users, ArrowLeft, Search, UserCheck, UserX, Shield, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    useGetEmpleados,
    useGetRoles,
    useDeleteEmpleado,
    useReactivarEmpleado,
    useAprobarEmpleado,
    useRechazarEmpleado,
    useGetPendientesCount
} from '../hooks/useEmpleados'
import { useAuth } from '@auth/hooks/useAuth'
import EmpleadoFormModal from '../components/forms/EmpleadoFormModal'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import Modal from '@shared/components/Modal'
import { useTranslation } from 'react-i18next'

// Hook personalizado para debounce
const useDebounce = (value, delay) => {
  const { t } = useTranslation()
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => clearTimeout(handler)
    }, [value, delay])

    return debouncedValue
}

export default function EmpleadosPage() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente'])
    const canCreate = hasRole(['admin'])
    const isAdmin = hasRole(['admin'])

    // ============================================
    // STATE: Filtros
    // ============================================
    const [searchInput, setSearchInput] = useState('')
    const [filtros, setFiltros] = useState({
        rol_id: '',
        estado: ''
    })

    const debouncedSearch = useDebounce(searchInput, 500)

    const queryParams = {
        ...(debouncedSearch && { buscar: debouncedSearch }),
        ...(filtros.rol_id && { rol_id: filtros.rol_id }),
        ...(filtros.estado && { estado: filtros.estado })
    }

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const { empleados, isLoading, error, refetch } = useGetEmpleados(queryParams)
    const { roles } = useGetRoles()
    const { pendientesCount } = useGetPendientesCount()
    const { mutateAsync: deleteEmpleado, isPending: isDeleting } = useDeleteEmpleado()
    const { mutateAsync: reactivarEmpleado, isPending: isReactivating } = useReactivarEmpleado()
    const { mutateAsync: aprobarEmpleado, isPending: isApproving } = useAprobarEmpleado()
    const { mutateAsync: rechazarEmpleado, isPending: isRejecting } = useRechazarEmpleado()

    // ============================================
    // STATE: Control de modales y aprobacion
    // ============================================
    const [modalState, setModalState] = useState({
        crear: false,
        editar: false
    })
    const [selectedEmpleado, setSelectedEmpleado] = useState(null)
    const [aprobarModal, setAprobarModal] = useState({ open: false, empleado: null })
    const [rechazarModal, setRechazarModal] = useState({ open: false, empleado: null })
    const [aprobarRolId, setAprobarRolId] = useState('')
    const [rechazarMotivo, setRechazarMotivo] = useState('')

    // ============================================
    // HANDLERS
    // ============================================
    const handleOpenCrear = () => setModalState({ ...modalState, crear: true })

    const handleCloseModal = () => {
        setModalState({ crear: false, editar: false })
        setSelectedEmpleado(null)
    }

    const handleEdit = (empleado) => {
        setSelectedEmpleado(empleado)
        setModalState({ ...modalState, editar: true })
    }

    const handleToggleEstado = async (empleado) => {
        try {
            if (empleado.estado === 'activo') {
                await deleteEmpleado(empleado.id)
            } else if (empleado.estado === 'inactivo') {
                await reactivarEmpleado(empleado.id)
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error)
            alert(error.response?.data?.message || 'Error al cambiar estado del empleado')
        }
    }

    const handleAprobar = async () => {
        if (!aprobarRolId) {
            alert('Debes seleccionar un rol')
            return
        }
        try {
            await aprobarEmpleado({ id: aprobarModal.empleado.id, rol_id: parseInt(aprobarRolId) })
            setAprobarModal({ open: false, empleado: null })
            setAprobarRolId('')
        } catch (error) {
            alert(error.response?.data?.message || 'Error al aprobar solicitud')
        }
    }

    const handleRechazar = async () => {
        try {
            await rechazarEmpleado({ id: rechazarModal.empleado.id, motivo: rechazarMotivo })
            setRechazarModal({ open: false, empleado: null })
            setRechazarMotivo('')
        } catch (error) {
            alert(error.response?.data?.message || 'Error al rechazar solicitud')
        }
    }

    const handleOpenAprobar = (empleado) => {
        setAprobarRolId(empleado.rol_solicitado_id || '')
        setAprobarModal({ open: true, empleado })
    }

    const handleFilterChange = (key, value) => {
        setFiltros(prev => ({ ...prev, [key]: value }))
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

    const getEstadoBadge = (estado) => {
        switch (estado) {
            case 'activo':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                        <UserCheck className="w-4 h-4" />
                        Activo
                    </span>
                )
            case 'inactivo':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                        <UserX className="w-4 h-4" />
                        Inactivo
                    </span>
                )
            case 'pendiente':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700 border border-amber-200">
                        <Clock className="w-4 h-4" />
                        Pendiente
                    </span>
                )
            default:
                return null
        }
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
                        {error.message || 'Ocurrio un error inesperado'}
                    </p>
                    <Button onClick={() => refetch()}>Reintentar</Button>
                </div>
            </div>
        )
    }

    // Separar pendientes de los demas
    const empleadosPendientes = empleados?.filter(e => e.estado === 'pendiente') || []
    const empleadosLista = empleados?.filter(e => e.estado !== 'pendiente') || []
    const mostrarPendientes = isAdmin && empleadosPendientes.length > 0 && !filtros.estado

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
                                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                        Empleados
                                        {isAdmin && pendientesCount > 0 && (
                                            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-amber-500 rounded-full">
                                                {pendientesCount}
                                            </span>
                                        )}
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
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                        </div>

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

                        <div className="w-44">
                            <select
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                value={filtros.estado}
                                onChange={(e) => handleFilterChange('estado', e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                                <option value="pendiente">Pendientes</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SOLICITUDES PENDIENTES */}
                {mostrarPendientes && (
                    <div className="mb-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2 mb-3">
                                <Clock className="w-5 h-5" />
                                Solicitudes pendientes ({empleadosPendientes.length})
                            </h3>
                            <div className="space-y-3">
                                {empleadosPendientes.map((emp) => (
                                    <div key={emp.id} className="bg-white rounded-lg border border-amber-200 p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                <span className="text-sm font-semibold text-amber-600">
                                                    {emp.nombre?.[0]}{emp.apellido?.[0]}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {emp.nombre} {emp.apellido}
                                                </p>
                                                <p className="text-sm text-slate-500">{emp.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {emp.rol_solicitado_nombre && (
                                                <span className="text-sm text-slate-500">
                                                    Solicita: <span className="font-medium text-slate-700">{emp.rol_solicitado_nombre.charAt(0).toUpperCase() + emp.rol_solicitado_nombre.slice(1)}</span>
                                                </span>
                                            )}
                                            <span className="text-sm text-slate-400">
                                                {new Date(emp.created_at).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => handleOpenAprobar(emp)}
                                                disabled={isApproving}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => setRechazarModal({ open: true, empleado: emp })}
                                                disabled={isRejecting}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Rechazar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* INFO */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">
                        {debouncedSearch || filtros.rol_id || filtros.estado ? 'Resultados de busqueda' : 'Todos los Empleados'}
                    </h2>
                    <p className="text-slate-600">
                        {(filtros.estado ? empleados : empleadosLista)?.length || 0} empleado{(filtros.estado ? empleados : empleadosLista)?.length !== 1 ? 's' : ''} encontrado{(filtros.estado ? empleados : empleadosLista)?.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* TABLA DE EMPLEADOS */}
                {((filtros.estado ? empleados : empleadosLista)?.length > 0) ? (
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
                                {(filtros.estado ? empleados : empleadosLista).map((empleado) => (
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
                                            {empleado.rol_nombre ? (
                                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRolColor(empleado.rol_nombre)}`}>
                                                    {empleado.rol_nombre?.charAt(0).toUpperCase() + empleado.rol_nombre?.slice(1)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Sin rol</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getEstadoBadge(empleado.estado)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {empleado.estado === 'pendiente' && isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenAprobar(empleado)}
                                                            className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => setRechazarModal({ open: true, empleado })}
                                                            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                                {empleado.estado !== 'pendiente' && canManage && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(empleado)}
                                                            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            Editar
                                                        </button>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => handleToggleEstado(empleado)}
                                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                    empleado.estado === 'activo'
                                                                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                                }`}
                                                            >
                                                                {empleado.estado === 'activo' ? 'Desactivar' : 'Reactivar'}
                                                            </button>
                                                        )}
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
                            debouncedSearch || filtros.rol_id || filtros.estado
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

            {/* MODALES DE CREAR/EDITAR */}
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

            {/* MODAL APROBAR */}
            <Modal isOpen={aprobarModal.open} onClose={() => { setAprobarModal({ open: false, empleado: null }); setAprobarRolId('') }} title="Aprobar solicitud" size="sm">
                <p className="text-sm text-slate-600 mb-4">
                    Aprobar acceso para <span className="font-semibold">{aprobarModal.empleado?.nombre} {aprobarModal.empleado?.apellido}</span>
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Asignar rol *
                    </label>
                    <select
                        value={aprobarRolId}
                        onChange={(e) => setAprobarRolId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Selecciona un rol</option>
                        {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                                {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                            </option>
                        ))}
                    </select>
                    {aprobarModal.empleado?.rol_solicitado_nombre && (
                        <p className="mt-1 text-xs text-slate-500">
                            El usuario solicito: {aprobarModal.empleado.rol_solicitado_nombre.charAt(0).toUpperCase() + aprobarModal.empleado.rol_solicitado_nombre.slice(1)}
                        </p>
                    )}
                </div>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => { setAprobarModal({ open: false, empleado: null }); setAprobarRolId('') }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAprobar}
                        disabled={!aprobarRolId || isApproving}
                        loading={isApproving}
                        icon={<CheckCircle className="w-4 h-4" />}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Aprobar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* MODAL RECHAZAR */}
            <Modal isOpen={rechazarModal.open} onClose={() => { setRechazarModal({ open: false, empleado: null }); setRechazarMotivo('') }} title="Rechazar solicitud" size="sm">
                <p className="text-sm text-slate-600 mb-4">
                    Rechazar acceso para <span className="font-semibold">{rechazarModal.empleado?.nombre} {rechazarModal.empleado?.apellido}</span>
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Motivo del rechazo (opcional)
                    </label>
                    <textarea
                        value={rechazarMotivo}
                        onChange={(e) => setRechazarMotivo(e.target.value)}
                        placeholder="Ej: No es empleado de la empresa"
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                </div>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => { setRechazarModal({ open: false, empleado: null }); setRechazarMotivo('') }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleRechazar}
                        disabled={isRejecting}
                        loading={isRejecting}
                        icon={<XCircle className="w-4 h-4" />}
                    >
                        Rechazar
                    </Button>
                </Modal.Footer>
            </Modal>

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
