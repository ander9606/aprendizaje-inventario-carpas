// ============================================
// PÁGINA: ALERTAS
// Panel de alertas del sistema de operaciones
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Clock,
    Filter,
    ChevronDown,
    EyeOff,
    Check,
    RefreshCw,
    ExternalLink,
    Phone,
    Calendar
} from 'lucide-react'
import { useGetAlertasPendientes, useGetResumenAlertas, useMarcarAlertaLeida, useMarcarAlertaResuelta } from '../hooks/useAlertas'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import { useTranslation } from 'react-i18next'

// ============================================
// CONFIGURACIÓN DE TIPOS DE ALERTA
// ============================================
// Alert type config - labels resolved via i18n in component
const TIPOS_ALERTA_CONFIG_KEYS = {
    RETORNO_VENCIDO: { i18nKey: 'config.alertTypes.overdueReturn', color: 'red' },
    ORDEN_MONTAJE_VENCIDA: { i18nKey: 'config.alertTypes.overdueAssembly', color: 'red' },
    ORDEN_DESMONTAJE_VENCIDA: { i18nKey: 'config.alertTypes.overdueDisassembly', color: 'red' },
    ALQUILER_NO_INICIADO: { i18nKey: 'config.alertTypes.notStarted', color: 'red' },
    RETORNO_PROXIMO: { i18nKey: 'config.alertTypes.returnSoon', color: 'yellow' },
    SALIDA_PROXIMA: { i18nKey: 'config.alertTypes.departureSoon', color: 'yellow' },
    DESMONTAJE_PROXIMO: { i18nKey: 'config.alertTypes.disassemblySoon', color: 'yellow' },
    conflicto_disponibilidad: { i18nKey: 'config.alertTypes.inventoryInsufficiency', color: 'red' },
    conflicto_fecha: { i18nKey: 'config.alertTypes.dateConflict', color: 'red' },
    conflicto_equipo: { i18nKey: 'config.alertTypes.teamConflict', color: 'yellow' },
    cambio_fecha: { i18nKey: 'config.alertTypes.dateChange', color: 'yellow' },
    incidencia: { i18nKey: 'config.alertTypes.incident', color: 'red' },
    stock_disponible: { i18nKey: 'config.alertTypes.availableStock', color: 'green' }
}

/**
 * AlertasPage
 *
 * Panel de alertas con:
 * - Resumen de alertas por severidad
 * - Lista de alertas pendientes con datos reales
 * - Acciones: ignorar (1 día) o resolver (7 días)
 * - Navegación directa a la orden/alquiler relacionado
 */
export default function AlertasPage() {
  const { t } = useTranslation()
    const navigate = useNavigate()

    // ============================================
    // ESTADO: Filtros
    // ============================================
    const [filtroSeveridad, setFiltroSeveridad] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('')
    const [showFiltros, setShowFiltros] = useState(false)

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const { alertas, isLoading, refetch } = useGetAlertasPendientes()
    const { resumen } = useGetResumenAlertas()
    const { marcarLeida, isLoading: isIgnoring } = useMarcarAlertaLeida()
    const { marcarResuelta, isLoading: isResolving } = useMarcarAlertaResuelta()

    // ============================================
    // FILTRADO
    // ============================================
    const alertasFiltradas = (alertas || []).filter(alerta => {
        if (filtroSeveridad && alerta.severidad !== filtroSeveridad) return false
        if (filtroTipo && alerta.tipo !== filtroTipo) return false
        return true
    })

    // ============================================
    // HELPERS
    // ============================================
    const getSeveridadConfig = (severidad) => {
        const config = {
            critica: {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: 'bg-red-100',
                iconColor: 'text-red-600',
                label: t('config.critical')
            },
            critico: {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: 'bg-red-100',
                iconColor: 'text-red-600',
                label: t('config.critical')
            },
            alta: {
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: 'bg-orange-100',
                iconColor: 'text-orange-600',
                label: t('config.high')
            },
            media: {
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
                label: t('config.medium')
            },
            advertencia: {
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
                label: t('config.warnings')
            },
            baja: {
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: 'bg-blue-100',
                iconColor: 'text-blue-600',
                label: t('config.low')
            },
            info: {
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: 'bg-blue-100',
                iconColor: 'text-blue-600',
                label: t('config.info')
            }
        }
        return config[severidad] || config.media
    }

    const getAlertIcon = (alerta) => {
        if (alerta.tipo === 'stock_disponible') return { Icon: CheckCircle, color: 'bg-green-100', iconColor: 'text-green-600' }
        if (alerta.severidad === 'critica' || alerta.severidad === 'critico') return { Icon: AlertTriangle, color: null, iconColor: null }
        return { Icon: Clock, color: null, iconColor: null }
    }

    const formatFecha = (fecha) => {
        if (!fecha) return '-'
        const date = new Date(fecha)
        return date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleIgnorar = async (alerta) => {
        await marcarLeida({ tipo: alerta.tipo, referencia_id: alerta.referencia_id })
        refetch()
    }

    const handleResolver = async (alerta, dias = 7) => {
        await marcarResuelta({ tipo: alerta.tipo, referencia_id: alerta.referencia_id, dias })
        refetch()
    }

    const handleNavegar = (url) => {
        if (url) navigate(url)
    }

    const filtrosActivos = filtroSeveridad || filtroTipo

    // Tipos únicos presentes en las alertas para el filtro
    const tiposPresentes = [...new Set((alertas || []).map(a => a.tipo))]

    // ============================================
    // RENDER
    // ============================================
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" text={t('config.loadingAlerts')} />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* HEADER CONSISTENTE */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            {t('config.alerts')}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {alertasFiltradas.length} {t('config.pendingAlerts')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            icon={<RefreshCw />}
                            onClick={() => refetch()}
                        >
                            {t('config.refresh')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* RESUMEN POR SEVERIDAD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { key: 'critica', label: t('config.critical'), color: 'red', icon: AlertTriangle, count: resumen?.criticas || 0 },
                    { key: 'alta', label: t('config.high'), color: 'orange', icon: AlertTriangle, count: resumen?.altas || 0 },
                    { key: 'media', label: t('config.medium'), color: 'yellow', icon: Clock, count: resumen?.medias || (resumen?.advertencias || 0) },
                    { key: '', label: t('config.total'), color: 'slate', icon: Bell, count: resumen?.total || 0 }
                ].map(({ key, label, color, icon: Icon, count }) => (
                    <button
                        key={label}
                        onClick={() => {
                            if (key) {
                                setFiltroSeveridad(filtroSeveridad === key ? '' : key)
                            } else {
                                setFiltroSeveridad('')
                            }
                        }}
                        className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                            filtroSeveridad === key && key
                                ? `border-${color}-400 ring-1 ring-${color}-400`
                                : 'border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 bg-${color}-100 rounded-lg`}>
                                <Icon className={`w-5 h-5 text-${color}-600`} />
                            </div>
                            <span className={`text-2xl font-bold text-${color}-600`}>
                                {count}
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
                        <span>{t('common.filters')}</span>
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
                            {t('config.clearFilters')}
                        </button>
                    )}
                </div>

                {showFiltros && (
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('config.severity')}
                            </label>
                            <select
                                value={filtroSeveridad}
                                onChange={(e) => setFiltroSeveridad(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            >
                                <option value="">{t('config.allSeverities')}</option>
                                <option value="critica">{t('config.critical')}</option>
                                <option value="alta">{t('config.high')}</option>
                                <option value="media">{t('config.medium')}</option>
                                <option value="baja">{t('config.low')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('config.alertType')}
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            >
                                <option value="">{t('config.allTypes')}</option>
                                {tiposPresentes.map(tipo => (
                                    <option key={tipo} value={tipo}>
                                        {TIPOS_ALERTA_CONFIG_KEYS[tipo] ? t(TIPOS_ALERTA_CONFIG_KEYS[tipo].i18nKey) : tipo.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTADOR */}
            <div className="mb-4 text-sm text-slate-500">
                {t('config.showingAlerts')} {t('config.alertCount', { count: alertasFiltradas.length })}
            </div>

            {/* LISTA DE ALERTAS */}
            {alertasFiltradas.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {alertasFiltradas.map((alerta, index) => {
                            const severidadConfig = getSeveridadConfig(alerta.severidad)
                            const tipoConfigKey = TIPOS_ALERTA_CONFIG_KEYS[alerta.tipo]
                            const tipoLabel = tipoConfigKey ? t(tipoConfigKey.i18nKey) : alerta.tipo.replace(/_/g, ' ')
                            const alertIcon = getAlertIcon(alerta)
                            const esStockDisponible = alerta.tipo === 'stock_disponible'

                            return (
                                <div
                                    key={`${alerta.tipo}-${alerta.referencia_id || alerta.id}-${index}`}
                                    className={`px-6 py-4 transition-colors ${
                                        alerta.orden_id
                                            ? 'cursor-pointer hover:bg-slate-50'
                                            : 'hover:bg-slate-50'
                                    } ${esStockDisponible ? 'bg-green-50/40' : ''}`}
                                    onClick={() => {
                                        if (alerta.orden_id) navigate(`/operaciones/ordenes/${alerta.orden_id}`)
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icono */}
                                        <div className={`p-2 rounded-lg ${alertIcon.color || severidadConfig.icon} mt-0.5`}>
                                            <alertIcon.Icon className={`w-5 h-5 ${alertIcon.iconColor || severidadConfig.iconColor}`} />
                                        </div>

                                        {/* Contenido */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                    esStockDisponible
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : severidadConfig.color
                                                }`}>
                                                    {esStockDisponible ? t('config.notification') : severidadConfig.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                    esStockDisponible
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {tipoLabel}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatFecha(alerta.fecha)}
                                                </span>
                                            </div>

                                            <p className={`font-medium ${esStockDisponible ? 'text-green-800' : 'text-slate-900'}`}>
                                                {alerta.titulo}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-0.5">
                                                {alerta.mensaje}
                                            </p>

                                            {/* Link a la orden si existe */}
                                            {alerta.orden_id && (
                                                <p className="text-xs text-orange-600 font-medium mt-1">
                                                    {t('config.orderClickDetail', { id: alerta.orden_id })}
                                                </p>
                                            )}

                                            {/* Info adicional */}
                                            {alerta.datos && (
                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                    {alerta.datos.cliente_nombre && (
                                                        <span>{t('config.clientLabel')} {alerta.datos.cliente_nombre}</span>
                                                    )}
                                                    {alerta.datos.cliente_telefono && (
                                                        <a
                                                            href={`tel:${alerta.datos.cliente_telefono}`}
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                                        >
                                                            <Phone className="w-3 h-3" />
                                                            {alerta.datos.cliente_telefono}
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Acciones de navegación */}
                                            {alerta.acciones && alerta.acciones.length > 0 && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    {alerta.acciones.filter(a => a.url).map((accion, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleNavegar(accion.url)}
                                                            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            {accion.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleIgnorar(alerta)}
                                                disabled={isIgnoring}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                                                title={t('config.ignoreOneDay')}
                                            >
                                                <EyeOff className="w-4.5 h-4.5" />
                                            </button>
                                            <button
                                                onClick={() => handleResolver(alerta)}
                                                disabled={isResolving}
                                                className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600 hover:text-green-700"
                                                title={t('config.ignoreSevenDays')}
                                            >
                                                <Check className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
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
                        {t('config.noPendingAlerts')}
                    </h3>
                    <p className="text-slate-600">
                        {filtrosActivos
                            ? t('config.noFilteredAlerts')
                            : t('config.allAlertsHandled')
                        }
                    </p>
                </div>
            )}
        </div>
    )
}
