// ============================================
// PAGINA: PERFIL DE USUARIO
// Ver y editar datos, cambiar contraseña,
// historial de actividad y sesiones activas
// ============================================

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    User, Shield, Phone, Mail, Clock, Save, Eye, EyeOff,
    Lock, History, Monitor, ChevronLeft, ChevronRight,
    AlertCircle, CheckCircle, Loader2, ArrowLeft, Calendar
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useGetPerfil, useUpdatePerfil, useCambiarPassword, useGetHistorial, useGetSesiones } from '../hooks/usePerfil'

// Mapa de acciones a etiquetas legibles
const ACCION_LABELS = {
    'LOGIN': 'Inicio de sesión',
    'LOGOUT': 'Cierre de sesión',
    'LOGOUT_ALL': 'Cierre de todas las sesiones',
    'CAMBIO_PASSWORD': 'Cambio de contraseña',
    'ACTUALIZAR_PERFIL': 'Actualización de perfil',
    'SOLICITUD_ACCESO': 'Solicitud de acceso',
    'CREAR': 'Creación de registro',
    'ACTUALIZAR': 'Actualización de registro',
    'ELIMINAR': 'Eliminación de registro',
}

const ACCION_COLORS = {
    'LOGIN': 'bg-green-100 text-green-700',
    'LOGOUT': 'bg-slate-100 text-slate-700',
    'LOGOUT_ALL': 'bg-slate-100 text-slate-700',
    'CAMBIO_PASSWORD': 'bg-amber-100 text-amber-700',
    'ACTUALIZAR_PERFIL': 'bg-blue-100 text-blue-700',
    'SOLICITUD_ACCESO': 'bg-purple-100 text-purple-700',
}

const rolColors = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    gerente: 'bg-blue-100 text-blue-700 border-blue-200',
    ventas: 'bg-green-100 text-green-700 border-green-200',
    operaciones: 'bg-amber-100 text-amber-700 border-amber-200',
    bodega: 'bg-slate-100 text-slate-700 border-slate-200'
}

const PerfilPage = () => {
    const navigate = useNavigate()
    const { perfil, isLoading: cargandoPerfil } = useGetPerfil()
    const updatePerfil = useUpdatePerfil()
    const cambiarPasswordMutation = useCambiarPassword()
    const { sesiones, isLoading: cargandoSesiones } = useGetSesiones()

    const [seccionActiva, setSeccionActiva] = useState('datos')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    // Historial con paginación
    const [historialPage, setHistorialPage] = useState(1)
    const { registros: historial, pagination: historialPagination, isLoading: cargandoHistorial } = useGetHistorial(historialPage)

    // Formulario de datos personales
    const {
        register: registerDatos,
        handleSubmit: handleSubmitDatos,
        formState: { errors: errorsDatos, isDirty: datosDirty },
        reset: resetDatos
    } = useForm({
        values: perfil ? {
            nombre: perfil.nombre || '',
            apellido: perfil.apellido || '',
            telefono: perfil.telefono || ''
        } : undefined
    })

    // Formulario de contraseña
    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: errorsPassword },
        reset: resetPassword,
        watch: watchPassword
    } = useForm({
        defaultValues: { passwordActual: '', passwordNuevo: '', confirmarPassword: '' }
    })

    const passwordNuevo = watchPassword('passwordNuevo')

    // Guardar datos personales
    const onGuardarDatos = async (data) => {
        try {
            await updatePerfil.mutateAsync(data)
            toast.success('Perfil actualizado correctamente')
            resetDatos(data)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al actualizar perfil')
        }
    }

    // Cambiar contraseña
    const onCambiarPassword = async (data) => {
        try {
            await cambiarPasswordMutation.mutateAsync({
                passwordActual: data.passwordActual,
                passwordNuevo: data.passwordNuevo
            })
            toast.success('Contraseña actualizada correctamente')
            resetPassword()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al cambiar contraseña')
        }
    }

    if (cargandoPerfil) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!perfil) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">No se pudo cargar el perfil.</p>
            </div>
        )
    }

    const iniciales = `${perfil.nombre?.[0] || ''}${perfil.apellido?.[0] || ''}`.toUpperCase()
    const rolColor = rolColors[perfil.rol] || rolColors.bodega

    const secciones = [
        { id: 'datos', label: 'Datos Personales', icon: User },
        { id: 'password', label: 'Contraseña', icon: Lock },
        { id: 'historial', label: 'Historial', icon: History },
        { id: 'sesiones', label: 'Sesiones', icon: Monitor },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {iniciales}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {perfil.nombre} {perfil.apellido}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-slate-500">{perfil.email}</span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${rolColor}`}>
                                    <Shield className="w-3 h-3" />
                                    {perfil.rol?.charAt(0).toUpperCase() + perfil.rol?.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar de secciones */}
                    <div className="lg:w-56 flex-shrink-0">
                        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                            {secciones.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setSeccionActiva(id)}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                        seccionActiva === id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Panel principal */}
                    <div className="flex-1 min-w-0">
                        {/* ================================
                            DATOS PERSONALES
                        ================================ */}
                        {seccionActiva === 'datos' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-6">Datos Personales</h2>

                                <form onSubmit={handleSubmitDatos(onGuardarDatos)} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                                    errorsDatos.nombre ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'
                                                }`}
                                                {...registerDatos('nombre', { required: 'Nombre es requerido' })}
                                            />
                                            {errorsDatos.nombre && <p className="mt-1 text-sm text-red-600">{errorsDatos.nombre.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Apellido
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                                    errorsDatos.apellido ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'
                                                }`}
                                                {...registerDatos('apellido', { required: 'Apellido es requerido' })}
                                            />
                                            {errorsDatos.apellido && <p className="mt-1 text-sm text-red-600">{errorsDatos.apellido.message}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={perfil.email}
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-xs text-slate-400">El email no se puede cambiar.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            <Phone className="w-4 h-4 inline mr-1" />
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Ej: 300 123 4567"
                                            {...registerDatos('telefono')}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={updatePerfil.isPending || !datosDirty}
                                            className={`px-6 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 transition-all ${
                                                updatePerfil.isPending || !datosDirty
                                                    ? 'bg-slate-300 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                                            }`}
                                        >
                                            {updatePerfil.isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar cambios
                                        </button>
                                    </div>
                                </form>

                                {/* Info adicional */}
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-medium text-slate-500 mb-3">Información de la cuenta</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Shield className="w-4 h-4 text-slate-400" />
                                            <span>Rol: <strong className="capitalize">{perfil.rol}</strong></span>
                                        </div>
                                        {perfil.ultimo_login && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span>Último login: {new Date(perfil.ultimo_login).toLocaleString('es-CO')}</span>
                                            </div>
                                        )}
                                        {perfil.created_at && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>Miembro desde: {new Date(perfil.created_at).toLocaleDateString('es-CO')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================================
                            CAMBIAR CONTRASEÑA
                        ================================ */}
                        {seccionActiva === 'password' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-6">Cambiar Contraseña</h2>

                                <form onSubmit={handleSubmitPassword(onCambiarPassword)} className="space-y-5 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Contraseña actual
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                                    errorsPassword.passwordActual ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'
                                                }`}
                                                {...registerPassword('passwordActual', { required: 'Ingresa tu contraseña actual' })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errorsPassword.passwordActual && <p className="mt-1 text-sm text-red-600">{errorsPassword.passwordActual.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Nueva contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                                    errorsPassword.passwordNuevo ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'
                                                }`}
                                                {...registerPassword('passwordNuevo', {
                                                    required: 'Ingresa la nueva contraseña',
                                                    minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                                                })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errorsPassword.passwordNuevo && <p className="mt-1 text-sm text-red-600">{errorsPassword.passwordNuevo.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Confirmar nueva contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                                errorsPassword.confirmarPassword ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'
                                            }`}
                                            {...registerPassword('confirmarPassword', {
                                                required: 'Confirma tu nueva contraseña',
                                                validate: value => value === passwordNuevo || 'Las contraseñas no coinciden'
                                            })}
                                        />
                                        {errorsPassword.confirmarPassword && <p className="mt-1 text-sm text-red-600">{errorsPassword.confirmarPassword.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={cambiarPasswordMutation.isPending}
                                        className={`px-6 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 transition-all ${
                                            cambiarPasswordMutation.isPending
                                                ? 'bg-slate-300 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                                        }`}
                                    >
                                        {cambiarPasswordMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Lock className="w-4 h-4" />
                                        )}
                                        Cambiar contraseña
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ================================
                            HISTORIAL DE ACTIVIDAD
                        ================================ */}
                        {seccionActiva === 'historial' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-6">Historial de Actividad</h2>

                                {cargandoHistorial ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                ) : historial.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No hay actividad registrada.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {historial.map((item) => (
                                                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                                                        ACCION_COLORS[item.accion] || 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {ACCION_LABELS[item.accion] || item.accion}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {item.tabla_afectada && (
                                                            <p className="text-sm text-slate-600">
                                                                {item.tabla_afectada}
                                                                {item.registro_id ? ` #${item.registro_id}` : ''}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(item.created_at).toLocaleString('es-CO')}
                                                            {item.ip_address && ` · ${item.ip_address}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Paginación */}
                                        {historialPagination && historialPagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                                <p className="text-sm text-slate-500">
                                                    Página {historialPagination.page} de {historialPagination.totalPages}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setHistorialPage(p => Math.max(1, p - 1))}
                                                        disabled={historialPagination.page <= 1}
                                                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setHistorialPage(p => Math.min(historialPagination.totalPages, p + 1))}
                                                        disabled={historialPagination.page >= historialPagination.totalPages}
                                                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ================================
                            SESIONES ACTIVAS
                        ================================ */}
                        {seccionActiva === 'sesiones' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-6">Sesiones Activas</h2>

                                {cargandoSesiones ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                ) : sesiones.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No hay sesiones activas.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {sesiones.map((sesion) => (
                                            <div key={sesion.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                                <Monitor className="w-5 h-5 text-slate-400" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-700">
                                                        Sesión #{sesion.id}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                                        <span>Creada: {new Date(sesion.creada).toLocaleString('es-CO')}</span>
                                                        <span>Expira: {new Date(sesion.expira).toLocaleString('es-CO')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-green-600">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    Activa
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PerfilPage
