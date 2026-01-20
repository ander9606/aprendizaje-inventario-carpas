// ============================================
// PÁGINA: ALERTAS
// Panel de alertas del sistema de operaciones
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Bell,
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Filter,
    ChevronDown,
    Eye,
    Check,
    Trash2,
    RefreshCw
} from 'lucide-react'
import { useGetAlertasPendientes, useGetResumenAlertas, useMarcarAlertaLeida, useMarcarAlertaResuelta } from '../hooks/useAlertas'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'

/**
 * AlertasPage
 *
 * Panel de alertas con:
 * - Resumen de alertas por severidad
 * - Lista de alertas pendientes
 * - Acciones para marcar como leída/resuelta
 */
export default function AlertasPage() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente', 'operaciones'])

    // ============================================
    // ESTADO: Filtros
    // ============================================
    const [filtroSeveridad, setFiltroSeveridad] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('')
    const [showFiltros, setShowFiltros] = useState(false)

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const queryParams = {
        ...(filtroSeveridad && { severidad: filtroSeveridad }),
        ...(filtroTipo && { tipo: filtroTipo })
    }

    const { alertas, isLoading, refetch } = useGetAlertasPendientes(queryParams)
    const { resumen } = useGetResumenAlertas()
    const { marcarLeida, isLoading: isMarkingRead } = useMarcarAlertaLeida()
    const { marcarResuelta, isLoading: isResolving } = useMarcarAlertaResuelta()

    // ============================================
    // HELPERS
    // ============================================
    const getSeveridadConfig = (severidad) => {
        const config = {
            baja: {
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: 'bg-blue-100',
                label: 'Baja'
            },
            media: {
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: 'bg-yellow-100',
                label: 'Media'
            },
            alta: {
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: 'bg-orange-100',
                label: 'Alta'
            },
            critica: {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: 'bg-red-100',
                label: 'Crítica'
            }
        }
        return config[severidad] || config.media
    }

    const formatFecha = (fecha) => {
        const date = new Date(fecha)
        const ahora = new Date()
        const diff = ahora - date
        const minutos = Math.floor(diff / 60000)
        const horas = Math.floor(diff / 3600000)
        const dias = Math.floor(diff / 86400000)

        if (minutos < 60) return `Hace ${minutos} min`
        if (horas < 24) return `Hace ${horas}h`
        if (dias < 7) return `Hace ${dias}d`
        return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    }

    const handleMarcarLeida = async (id) => {
        await marcarLeida(id)
        refetch()
    }

    const handleMarcarResuelta = async (id) => {
        await marcarResuelta(id)
        refetch()
    }

    const filtrosActivos = filtroSeveridad || filtroTipo

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
                                onClick={() => navigate('/operaciones')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Operaciones</span>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-xl">
                                    <Bell className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">
                                        Alertas
                                    </h1>
                                    <p className="text-sm text-slate-600">
                                        {alertas?.length || 0} alertas pendientes
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            icon={<RefreshCw />}
                            onClick={() => refetch()}
                        >
                            Actualizar
                        </Button>
                    </div>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="container mx-auto px-6 py-6">

                {/* RESUMEN POR SEVERIDAD */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { key: 'criticas', label: 'Críticas', color: 'red', icon: AlertTriangle },
                        { key: 'altas', label: 'Altas', color: 'orange', icon: AlertTriangle },
                        { key: 'medias', label: 'Medias', color: 'yellow', icon: Clock },
                        { key: 'bajas', label: 'Bajas', color: 'blue', icon: Bell }
                    ].map(({ key, label, color, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setFiltroSeveridad(filtroSeveridad === key.slice(0, -1) ? '' : key.slice(0, -1))
                                if (!showFiltros) setShowFiltros(true)
                            }}
                            className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                                filtroSeveridad === key.slice(0, -1)
                                    ? `border-${color}-500 ring-1 ring-${color}-500`
                                    : 'border-slate-200'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 bg-${color}-100 rounded-lg`}>
                                    <Icon className={`w-5 h-5 text-${color}-600`} />
                                </div>
                                <span className={`text-2xl font-bold text-${color}-600`}>
                                    {resumen?.[key] || 0}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600">{label}</p>
                        </button>
                    ))}
                </div>

                {/* FILTROS */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowFiltros(!showFiltros)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                                filtrosActivos
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                            <span>Filtros</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
                        </button>

                        {filtrosActivos && (
                            <button
                                onClick={() => {
                                    setFiltroSeveridad('')
                                    setFiltroTipo('')
                                }}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {showFiltros && (
                        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Severidad
                                </label>
                                <select
                                    value={filtroSeveridad}
                                    onChange={(e) => setFiltroSeveridad(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">Todas</option>
                                    <option value="critica">Crítica</option>
                                    <option value="alta">Alta</option>
                                    <option value="media">Media</option>
                                    <option value="baja">Baja</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="orden_pendiente">Orden Pendiente</option>
                                    <option value="conflicto_horario">Conflicto Horario</option>
                                    <option value="vehiculo_no_disponible">Vehículo No Disponible</option>
                                    <option value="empleado_no_disponible">Empleado No Disponible</option>
                                    <option value="inventario_bajo">Inventario Bajo</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* LISTA DE ALERTAS */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" text="Cargando alertas..." />
                    </div>
                ) : alertas?.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {alertas.map((alerta) => {
                                const severidadConfig = getSeveridadConfig(alerta.severidad)

                                return (
                                    <div
                                        key={alerta.id}
                                        className={`px-6 py-4 transition-colors ${
                                            alerta.leida ? 'bg-slate-50' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icono */}
                                            <div className={`p-2 rounded-lg ${severidadConfig.icon}`}>
                                                <AlertTriangle className={`w-5 h-5 ${
                                                    alerta.severidad === 'critica' ? 'text-red-600' :
                                                    alerta.severidad === 'alta' ? 'text-orange-600' :
                                                    alerta.severidad === 'media' ? 'text-yellow-600' :
                                                    'text-blue-600'
                                                }`} />
                                            </div>

                                            {/* Contenido */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severidadConfig.color}`}>
                                                        {severidadConfig.label}
                                                    </span>
                                                    {!alerta.leida && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            Nueva
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-500">
                                                        {formatFecha(alerta.created_at)}
                                                    </span>
                                                </div>
                                                <p className={`font-medium ${alerta.leida ? 'text-slate-600' : 'text-slate-900'}`}>
                                                    {alerta.titulo || alerta.tipo?.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {alerta.mensaje || alerta.descripcion}
                                                </p>
                                                {alerta.orden_id && (
                                                    <button
                                                        onClick={() => navigate(`/operaciones/ordenes/${alerta.orden_id}`)}
                                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-2 flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Ver orden #{alerta.orden_id}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Acciones */}
                                            {canManage && (
                                                <div className="flex items-center gap-2">
                                                    {!alerta.leida && (
                                                        <button
                                                            onClick={() => handleMarcarLeida(alerta.id)}
                                                            disabled={isMarkingRead}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                                                            title="Marcar como leída"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleMarcarResuelta(alerta.id)}
                                                        disabled={isResolving}
                                                        className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600 hover:text-green-700"
                                                        title="Marcar como resuelta"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Sin alertas pendientes
                        </h3>
                        <p className="text-slate-600">
                            {filtrosActivos
                                ? 'No se encontraron alertas con los filtros aplicados'
                                : 'Todas las alertas han sido atendidas'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
