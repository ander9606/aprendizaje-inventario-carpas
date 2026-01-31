// ============================================
// PÁGINA: OPERACIONES DASHBOARD
// Vista principal del módulo de operaciones
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Truck,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowLeft,
    ArrowRight,
    ClipboardList,
    Users,
    Bell,
    Package,
    MapPin
} from 'lucide-react'
import { useGetOrdenes, useGetCalendario, useGetEstadisticasOperaciones } from '../hooks/useOrdenesTrabajo'
import { useGetAlertasPendientes, useGetResumenAlertas } from '../hooks/useAlertas'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'

/**
 * OperacionesDashboard
 *
 * Dashboard principal para el módulo de operaciones:
 * - Estadísticas del día
 * - Órdenes de hoy (montajes y desmontajes)
 * - Alertas pendientes
 * - Acceso rápido a calendario y lista de órdenes
 */
export default function OperacionesDashboard() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente', 'operaciones'])

    // Fecha de hoy para filtros
    const hoy = new Date().toISOString().split('T')[0]

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const { ordenes: ordenesHoy, isLoading: loadingOrdenes } = useGetOrdenes({
        fecha_desde: hoy,
        fecha_hasta: hoy,
        limit: 10
    })

    const { estadisticas, isLoading: loadingStats } = useGetEstadisticasOperaciones()
    const { alertas: alertasPendientes, isLoading: loadingAlertas } = useGetAlertasPendientes({ limit: 5 })
    const { resumen: resumenAlertas } = useGetResumenAlertas()

    // ============================================
    // HELPERS
    // ============================================
    const getEstadoColor = (estado) => {
        const colores = {
            pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            en_proceso: 'bg-blue-100 text-blue-700 border-blue-200',
            completado: 'bg-green-100 text-green-700 border-green-200',
            cancelado: 'bg-red-100 text-red-700 border-red-200'
        }
        return colores[estado] || 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const getTipoColor = (tipo) => {
        return tipo === 'montaje'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-orange-100 text-orange-700'
    }

    const getSeveridadColor = (severidad) => {
        const colores = {
            baja: 'bg-blue-100 text-blue-700',
            media: 'bg-yellow-100 text-yellow-700',
            alta: 'bg-orange-100 text-orange-700',
            critica: 'bg-red-100 text-red-700'
        }
        return colores[severidad] || 'bg-slate-100 text-slate-700'
    }

    const formatFecha = (fecha) => {
        return new Date(fecha).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // ============================================
    // RENDER: Loading
    // ============================================
    if (loadingOrdenes && loadingStats) {
        return <Spinner fullScreen size="xl" text="Cargando operaciones..." />
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Módulos</span>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-xl">
                                    <Truck className="w-8 h-8 text-orange-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Operaciones
                                    </h1>
                                    <p className="text-sm text-slate-600">
                                        Gestión de montajes y desmontajes
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                icon={<Calendar />}
                                onClick={() => navigate('/operaciones/calendario')}
                            >
                                Calendario
                            </Button>
                            <Button
                                variant="primary"
                                icon={<ClipboardList />}
                                onClick={() => navigate('/operaciones/ordenes')}
                            >
                                Ver Órdenes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="container mx-auto px-6 py-6">

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Órdenes Hoy */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ClipboardList className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Hoy</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {ordenesHoy?.length || 0}
                        </p>
                        <p className="text-sm text-slate-600">Órdenes programadas</p>
                    </div>

                    {/* Pendientes */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Estado</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {estadisticas?.pendientes || 0}
                        </p>
                        <p className="text-sm text-slate-600">Órdenes pendientes</p>
                    </div>

                    {/* En Proceso */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Truck className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Activo</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {estadisticas?.en_progreso || 0}
                        </p>
                        <p className="text-sm text-slate-600">En proceso</p>
                    </div>

                    {/* Alertas */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg ${
                                (resumenAlertas?.criticas || 0) > 0
                                    ? 'bg-red-100'
                                    : 'bg-slate-100'
                            }`}>
                                <AlertTriangle className={`w-5 h-5 ${
                                    (resumenAlertas?.criticas || 0) > 0
                                        ? 'text-red-600'
                                        : 'text-slate-600'
                                }`} />
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase">Alertas</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {resumenAlertas?.total || alertasPendientes?.length || 0}
                        </p>
                        <p className="text-sm text-slate-600">
                            {(resumenAlertas?.criticas || 0) > 0
                                ? `${resumenAlertas.criticas} críticas`
                                : 'Pendientes'
                            }
                        </p>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL - 2 COLUMNAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ÓRDENES DE HOY - 2/3 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Órdenes de Hoy
                                    </h2>
                                    <p className="text-sm text-slate-600">
                                        {new Date().toLocaleDateString('es-CO', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<ArrowRight />}
                                    onClick={() => navigate('/operaciones/ordenes')}
                                >
                                    Ver todas
                                </Button>
                            </div>

                            {ordenesHoy?.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {ordenesHoy.map((orden) => (
                                        <div
                                            key={orden.id}
                                            className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${getTipoColor(orden.tipo)}`}>
                                                        {orden.tipo === 'montaje'
                                                            ? <Package className="w-5 h-5" />
                                                            : <Truck className="w-5 h-5" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {orden.tipo === 'montaje' ? 'Montaje' : 'Desmontaje'} - {orden.cliente_nombre || 'Cliente'}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {formatFecha(orden.fecha_programada)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-4 h-4" />
                                                                {orden.ciudad_evento || 'Sin ciudad'}
                                                                {orden.direccion_evento ? ` - ${orden.direccion_evento}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {orden.total_equipo > 0 && (
                                                        <span className="flex items-center gap-1 text-sm text-slate-600">
                                                            <Users className="w-4 h-4" />
                                                            {orden.total_equipo}
                                                        </span>
                                                    )}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(orden.estado)}`}>
                                                        {orden.estado?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                    <p className="text-slate-600 font-medium">No hay órdenes programadas para hoy</p>
                                    <p className="text-sm text-slate-500 mt-1">Las nuevas órdenes aparecerán aquí</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ALERTAS - 1/3 */}
                    <div>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-slate-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Alertas
                                    </h2>
                                </div>
                                {(alertasPendientes?.length || 0) > 0 && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                        {alertasPendientes.length}
                                    </span>
                                )}
                            </div>

                            {alertasPendientes?.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {alertasPendientes.slice(0, 5).map((alerta) => (
                                        <div
                                            key={alerta.id}
                                            className="px-6 py-3 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-1.5 rounded-lg ${getSeveridadColor(alerta.severidad)}`}>
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {alerta.titulo || alerta.tipo}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {alerta.mensaje || alerta.descripcion}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-8 text-center">
                                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">Sin alertas pendientes</p>
                                </div>
                            )}

                            {(alertasPendientes?.length || 0) > 5 && (
                                <div className="px-6 py-3 border-t border-slate-100">
                                    <button
                                        onClick={() => navigate('/operaciones/alertas')}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                    >
                                        Ver todas las alertas
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ACCIONES RÁPIDAS */}
                        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                                Acciones Rápidas
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/operaciones/calendario')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Calendario</p>
                                        <p className="text-xs text-slate-500">Vista mensual de operaciones</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate('/operaciones/ordenes')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <ClipboardList className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Todas las Órdenes</p>
                                        <p className="text-xs text-slate-500">Listado completo con filtros</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
