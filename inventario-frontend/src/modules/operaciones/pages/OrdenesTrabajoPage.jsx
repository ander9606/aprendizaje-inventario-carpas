// ============================================
// PÁGINA: ÓRDENES DE TRABAJO
// Vista agrupada por evento (montaje + desmontaje)
// ============================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Truck,
    Calendar,
    Search,
    Filter,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    Package,
    MapPin,
    User,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    X,
    Save,
    History,
    Wrench,
    ArrowRightLeft,
    ClipboardCheck,
    ClipboardList,
    Boxes,
    ExternalLink,
} from 'lucide-react'
import { useGetOrdenes, useCrearOrdenManual } from '../hooks/useOrdenesTrabajo'
import { useAuth } from '@auth/hooks/useAuth'
import AlertasAsignacion from '../components/AlertasAsignacion'
import Button from '@shared/components/Button'
import Modal from '@shared/components/Modal'
import Spinner from '@shared/components/Spinner'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// Hook para debounce
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

// ============================================
// HELPERS: Estado y tipo
// ============================================
const getEstadoConfig = (estado, t) => {
    const config = {
        pendiente: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: t('operations.statePendiente') },
        confirmado: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle, label: t('operations.stateConfirmado') },
        en_preparacion: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Package, label: t('operations.statePreparacion') },
        en_ruta: { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Truck, label: t('operations.stateEnRuta') },
        en_sitio: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: MapPin, label: t('operations.stateEnSitio') },
        en_proceso: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: RefreshCw, label: t('operations.stateEnProceso') },
        en_revision: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Search, label: t('operations.stateEnRevision') },
        en_reparacion: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Wrench, label: t('operations.stateEnReparacion') },
        completado: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: t('operations.stateCompletado') },
        cancelado: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: t('operations.stateCancelado') }
    }
    return config[estado] || config.pendiente
}

const getTipoConfig = (tipo, t) => {
    const config = {
        montaje: { color: 'bg-emerald-100 text-emerald-700', icon: Package, label: t('operations.typeMontaje') },
        desmontaje: { color: 'bg-orange-100 text-orange-700', icon: Truck, label: t('operations.typeDesmontaje') },
        mantenimiento: { color: 'bg-blue-100 text-blue-700', icon: Wrench, label: t('operations.typeMantenimiento') },
        traslado: { color: 'bg-purple-100 text-purple-700', icon: ArrowRightLeft, label: t('operations.typeTraslado') },
        revision: { color: 'bg-green-100 text-green-700', icon: ClipboardCheck, label: t('operations.typeRevision') },
        inventario: { color: 'bg-amber-100 text-amber-700', icon: Boxes, label: t('operations.typeInventario') },
        otro: { color: 'bg-slate-100 text-slate-700', icon: Package, label: t('operations.typeOtro') }
    }
    return config[tipo] || config.otro
}

const formatFecha = (fecha) => {
    if (!fecha) return null
    return new Date(fecha).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    })
}

const formatHora = (fecha) => {
    if (!fecha) return '--:--'
    return new Date(fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// ============================================
// HELPER: Agrupar órdenes por alquiler_id
// ============================================
const agruparPorEvento = (ordenes) => {
    if (!ordenes?.length) return { eventos: [], manuales: [] }

    const grupos = {}
    const manuales = []

    ordenes.forEach(orden => {
        // Órdenes sin alquiler_id son manuales
        if (!orden.alquiler_id) {
            manuales.push(orden)
            return
        }

        const key = orden.alquiler_id
        if (!grupos[key]) {
            grupos[key] = {
                alquiler_id: orden.alquiler_id,
                cliente_nombre: orden.cliente_nombre,
                evento_nombre: orden.evento_nombre,
                ciudad_evento: orden.ciudad_evento || orden.evento_ciudad,
                direccion_evento: orden.direccion_evento,
                montaje: null,
                desmontaje: null
            }
        }
        if (orden.tipo === 'montaje') {
            grupos[key].montaje = orden
        } else if (orden.tipo === 'desmontaje') {
            grupos[key].desmontaje = orden
        }
    })

    const eventos = Object.values(grupos).sort((a, b) => {
        const fechaA = a.montaje?.fecha_programada || a.desmontaje?.fecha_programada
        const fechaB = b.montaje?.fecha_programada || b.desmontaje?.fecha_programada
        return new Date(fechaA) - new Date(fechaB)
    })

    return { eventos, manuales }
}

// ============================================
// HELPER: Verificar si evento está finalizado
// ============================================
const esEventoFinalizado = (evento) => {
    const estadosFinal = ['completado', 'cancelado']
    const montajeOk = !evento.montaje || estadosFinal.includes(evento.montaje.estado)
    const desmonOk = !evento.desmontaje || estadosFinal.includes(evento.desmontaje.estado)
    return montajeOk && desmonOk
}

// ============================================
// HELPER: Progreso de una orden (porcentaje)
// ============================================
const getProgresoOrden = (estado, tipo) => {
    const pasosMontaje = ['pendiente', 'confirmado', 'en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso', 'completado']
    const pasosDesmontaje = ['pendiente', 'confirmado', 'en_preparacion', 'en_ruta', 'en_sitio', 'completado']
    const pasosMantenimiento = ['pendiente', 'en_revision', 'en_reparacion', 'completado']
    const pasos = tipo === 'mantenimiento' ? pasosMantenimiento : tipo === 'montaje' ? pasosMontaje : pasosDesmontaje
    const idx = pasos.indexOf(estado)
    if (estado === 'cancelado') return 0
    if (idx === -1) return 0
    return Math.round((idx / (pasos.length - 1)) * 100)
}

const getColorProgreso = (estado) => {
    if (estado === 'completado') return 'bg-green-500'
    if (estado === 'cancelado') return 'bg-red-400'
    if (['en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso'].includes(estado)) return 'bg-orange-500'
    return 'bg-slate-300'
}

// ============================================
// COMPONENTE: Fila clickable de orden dentro de tarjeta
// ============================================
const OrdenRow = ({ orden, tipo, navigate, t }) => {
    if (!orden) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
                <div className={`p-1.5 rounded-lg ${tipo === 'montaje' ? 'bg-slate-50' : 'bg-slate-50'}`}>
                    {tipo === 'montaje'
                        ? <Package className="w-4 h-4" />
                        : <Truck className="w-4 h-4" />
                    }
                </div>
                <span className="text-xs italic">{t('operations.noScheduled', { type: tipo })}</span>
            </div>
        )
    }

    const config = getEstadoConfig(orden.estado, t)
    const progreso = getProgresoOrden(orden.estado, tipo)
    const colorProgreso = getColorProgreso(orden.estado)
    const tieneResponsable = (orden.total_equipo || 0) > 0

    return (
        <div
            onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
        >
            {/* Icono tipo */}
            <div className={`p-1.5 rounded-lg ${
                tipo === 'montaje' ? 'bg-emerald-50' : 'bg-orange-50'
            }`}>
                {tipo === 'montaje'
                    ? <Package className="w-4 h-4 text-emerald-600" />
                    : <Truck className="w-4 h-4 text-orange-600" />
                }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800 capitalize">{tipo}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${config.color}`}>
                        {config.label}
                    </span>
                    {tieneResponsable && orden.nombre_responsable ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {orden.nombre_responsable}
                        </span>
                    ) : orden.estado !== 'completado' && orden.estado !== 'cancelado' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                            {t('operations.noResp')}
                        </span>
                    )}
                </div>
                {/* Barra de progreso + conteo elementos */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${colorProgreso}`}
                            style={{ width: `${progreso}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 w-7 text-right">{progreso}%</span>
                    {(orden.total_elementos > 0) && (
                        <span className="text-[10px] text-slate-400">
                            {t('operations.elemCount', { count: orden.total_elementos })}
                        </span>
                    )}
                </div>
            </div>

            {/* Fecha + flecha */}
            <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">{formatFecha(orden.fecha_programada)}</p>
                <p className="text-[11px] text-slate-400">{formatHora(orden.fecha_programada)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors shrink-0" />
        </div>
    )
}

// ============================================
// COMPONENTE: Tarjeta de Evento (mejorada)
// ============================================
const EventoCard = ({ evento, navigate, t }) => {
    const montaje = evento.montaje
    const desmontaje = evento.desmontaje

    const estadosActivos = ['en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso']
    const hayOrdenActiva = (montaje && estadosActivos.includes(montaje.estado))
        || (desmontaje && estadosActivos.includes(desmontaje.estado))

    const todasCompletadas = (
        (!montaje || montaje.estado === 'completado') &&
        (!desmontaje || desmontaje.estado === 'completado')
    )

    return (
        <div className={`bg-white rounded-xl border overflow-hidden transition-all ${
            todasCompletadas
                ? 'border-green-200 bg-green-50/30'
                : hayOrdenActiva
                    ? 'border-orange-200 shadow-sm shadow-orange-100'
                    : 'border-slate-200 hover:border-slate-300'
        }`}>
            {/* Header */}
            <div className={`px-4 py-3 ${
                todasCompletadas
                    ? 'bg-green-50 border-b border-green-100'
                    : hayOrdenActiva
                        ? 'bg-orange-50/50 border-b border-orange-100'
                        : 'border-b border-slate-100'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                                {evento.evento_nombre || evento.cliente_nombre || t('operations.event')}
                            </p>
                            {hayOrdenActiva && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                                </span>
                            )}
                            {todasCompletadas && (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            {evento.evento_nombre && evento.cliente_nombre && (
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {evento.cliente_nombre}
                                </p>
                            )}
                            {evento.alquiler_id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/alquileres/gestion/${evento.alquiler_id}`)
                                    }}
                                    className="text-[11px] text-orange-500 hover:text-orange-700 hover:underline flex items-center gap-0.5"
                                >
                                    {t('operations.rentalLabel', { id: evento.alquiler_id })}
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                    {montaje && (
                        <div className="text-right shrink-0 ml-3">
                            <p className="text-[11px] text-slate-400">{t('operations.products')}</p>
                            <p className="text-sm font-semibold text-slate-700">{montaje.total_productos || 0}</p>
                        </div>
                    )}
                </div>
                {(evento.ciudad_evento || evento.direccion_evento) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                            {evento.ciudad_evento}
                            {evento.direccion_evento ? ` - ${evento.direccion_evento}` : ''}
                        </span>
                    </p>
                )}
            </div>

            {/* Órdenes clickables */}
            <div className="divide-y divide-slate-100">
                <OrdenRow orden={montaje} tipo="montaje" navigate={navigate} t={t} />
                <OrdenRow orden={desmontaje} tipo="desmontaje" navigate={navigate} t={t} />
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Fila de orden manual
// ============================================
const OrdenManualRow = ({ orden, navigate, t }) => {
    const tipoConfig = getTipoConfig(orden.tipo, t)
    const estadoConfig = getEstadoConfig(orden.estado, t)
    const TipoIcon = tipoConfig.icon
    const EstadoIcon = estadoConfig.icon

    return (
        <div
            className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${tipoConfig.color}`}>
                        <TipoIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoConfig.color}`}>
                                {tipoConfig.label}
                            </span>
                            <span className="font-semibold text-slate-900">
                                #{orden.id}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatFecha(orden.fecha_programada)} {formatHora(orden.fecha_programada)}
                            </span>
                            {(orden.ciudad_evento || orden.direccion_evento) && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {orden.ciudad_evento || ''}
                                    {orden.direccion_evento ? ` - ${orden.direccion_evento}` : ''}
                                </span>
                            )}
                        </div>
                        {orden.nombre_responsable && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {orden.nombre_responsable}
                            </p>
                        )}
                        {orden.notas && (
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-md">
                                {orden.notas}
                            </p>
                        )}
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${estadoConfig.color}`}>
                    <EstadoIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{estadoConfig.label}</span>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Modal Nueva Orden Manual
// ============================================
const ModalNuevaOrden = ({ onClose, onSave, t }) => {
    const [formData, setFormData] = useState({
        tipo: 'mantenimiento',
        fecha_programada: '',
        hora_programada: '09:00',
        direccion_destino: '',
        ciudad_destino: '',
        notas: '',
        prioridad: 'normal'
    })
    const [saving, setSaving] = useState(false)

    const tiposOrden = [
        { value: 'mantenimiento', label: t('operations.typeMantenimiento'), icon: Wrench, color: 'text-blue-600' },
        { value: 'traslado', label: t('operations.typeTraslado'), icon: ArrowRightLeft, color: 'text-purple-600' },
        { value: 'revision', label: t('operations.typeRevision'), icon: ClipboardCheck, color: 'text-green-600' },
        { value: 'inventario', label: t('operations.typeInventario'), icon: Boxes, color: 'text-amber-600' },
        { value: 'otro', label: t('operations.typeOtro'), icon: Package, color: 'text-slate-600' }
    ]

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleGuardar = async () => {
        if (!formData.fecha_programada) {
            toast.error(t('operations.dateIsRequired'))
            return
        }

        setSaving(true)
        try {
            const fechaCompleta = `${formData.fecha_programada}T${formData.hora_programada}:00`
            await onSave({
                tipo: formData.tipo,
                fecha_programada: fechaCompleta,
                direccion_destino: formData.direccion_destino || null,
                ciudad_destino: formData.ciudad_destino || null,
                notas: formData.notas || null,
                prioridad: formData.prioridad,
                elementos: []
            })
            onClose()
        } catch (error) {
            console.error('Error al crear orden:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={t('operations.newWorkOrder')} size="md">
            <div className="space-y-4">
                {/* Tipo de orden */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('operations.orderType')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {tiposOrden.map((tipo) => {
                            const IconComponent = tipo.icon
                            return (
                                <button
                                    key={tipo.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tipo: tipo.value }))}
                                    className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                                        formData.tipo === tipo.value
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <IconComponent className={`w-5 h-5 ${tipo.color}`} />
                                    <span className="font-medium text-slate-700">{tipo.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Fecha y hora */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('operations.dateRequired')}
                        </label>
                        <input
                            type="date"
                            name="fecha_programada"
                            value={formData.fecha_programada}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('operations.hour')}
                        </label>
                        <input
                            type="time"
                            name="hora_programada"
                            value={formData.hora_programada}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>
                </div>

                {/* Prioridad */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('operations.priority')}
                    </label>
                    <select
                        name="prioridad"
                        value={formData.prioridad}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                        <option value="baja">{t('operations.priorityLow')}</option>
                        <option value="normal">{t('operations.priorityNormal')}</option>
                        <option value="alta">{t('operations.priorityHigh')}</option>
                        <option value="urgente">{t('operations.priorityUrgent')}</option>
                    </select>
                </div>

                {/* Dirección */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('operations.addressOptional')}
                    </label>
                    <input
                        type="text"
                        name="direccion_destino"
                        value={formData.direccion_destino}
                        onChange={handleChange}
                        placeholder={t('operations.addressPlaceholder')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                </div>

                {/* Ciudad */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('operations.cityOptional')}
                    </label>
                    <input
                        type="text"
                        name="ciudad_destino"
                        value={formData.ciudad_destino}
                        onChange={handleChange}
                        placeholder={t('operations.cityPlaceholder')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                </div>

                {/* Notas */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('operations.notesLabel')}
                    </label>
                    <textarea
                        name="notas"
                        value={formData.notas}
                        onChange={handleChange}
                        rows={3}
                        placeholder={t('operations.notesPlaceholder')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                    />
                </div>
            </div>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button
                    color="orange"
                    icon={Save}
                    onClick={handleGuardar}
                    disabled={saving || !formData.fecha_programada}
                >
                    {saving ? t('operations.creating') : t('operations.createOrder')}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function OrdenesTrabajoPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente', 'operaciones'])
    const esAdminOGerente = hasRole(['admin', 'gerente'])

    // ============================================
    // ESTADO: Filtros, búsqueda y modal
    // ============================================
    const [busqueda, setBusqueda] = useState('')
    const [vistaOrden, setVistaOrden] = useState('mis') // 'mis' | 'disponibles'
    const [filtros, setFiltros] = useState({
        estado: '',
        tipo: '',
        fecha_desde: '',
        fecha_hasta: ''
    })
    const [showFiltros, setShowFiltros] = useState(false)
    const [showModalNuevaOrden, setShowModalNuevaOrden] = useState(false)
    const debouncedBusqueda = useDebounce(busqueda, 500)

    // ============================================
    // HOOKS: Obtener datos y mutaciones
    // ============================================
    const queryParams = {
        ...(debouncedBusqueda && { buscar: debouncedBusqueda }),
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.tipo && { tipo: filtros.tipo }),
        ...(filtros.fecha_desde && { fecha_desde: filtros.fecha_desde }),
        ...(filtros.fecha_hasta && { fecha_hasta: filtros.fecha_hasta }),
        ...(!esAdminOGerente && vistaOrden === 'disponibles' && { sin_responsable: true }),
        limit: 200
    }

    const { ordenes, isLoading, refetch } = useGetOrdenes(queryParams)
    const crearOrdenManual = useCrearOrdenManual()

    // ============================================
    // DATOS PROCESADOS
    // ============================================
    const { eventos, manuales } = useMemo(() => agruparPorEvento(ordenes), [ordenes])

    // Separar eventos activos de finalizados
    const eventosActivos = useMemo(() => eventos.filter(e => !esEventoFinalizado(e)), [eventos])

    // Separar manuales activos de finalizados
    const manualesActivos = useMemo(() =>
        manuales.filter(o => !['completado', 'cancelado'].includes(o.estado)),
        [manuales]
    )

    // ============================================
    // HANDLERS
    // ============================================
    const handleCrearOrden = async (datos) => {
        try {
            await crearOrdenManual.mutateAsync(datos)
            toast.success(t('operations.orderCreated'))
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || t('operations.errorCreatingOrder'))
            throw error
        }
    }

    const handleLimpiarFiltros = () => {
        setFiltros({
            estado: '',
            tipo: '',
            fecha_desde: '',
            fecha_hasta: ''
        })
        setBusqueda('')
    }

    const filtrosActivos = Object.values(filtros).some(v => v !== '') || debouncedBusqueda

    // ============================================
    // RENDER
    // ============================================
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" text={t('operations.loadingOrders')} />
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
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ClipboardList className="w-6 h-6 text-blue-600" />
                            </div>
                            {t('operations.workOrders')}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {t('operations.ordersManagement')}
                        </p>
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="primary"
                                icon={<Plus />}
                                onClick={() => setShowModalNuevaOrden(true)}
                            >
                                {t('operations.newOrder')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ALERTAS DE ASIGNACIÓN PENDIENTES */}
            <AlertasAsignacion />

            {/* TOGGLE: Mis Órdenes / Disponibles (solo para no-admin) */}
            {!esAdminOGerente && (
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-4">
                    <button
                        onClick={() => setVistaOrden('mis')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            vistaOrden === 'mis'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t('operations.myOrders')}
                    </button>
                    <button
                        onClick={() => setVistaOrden('disponibles')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            vistaOrden === 'disponibles'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t('operations.unassigned')}
                    </button>
                </div>
            )}

            {/* BUSCADOR */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder={t('operations.searchOrdersPlaceholder')}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400 outline-none"
                        />
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda('')}
                                className="p-1 hover:bg-slate-100 rounded shrink-0"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowFiltros(!showFiltros)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                            filtrosActivos
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                        <Filter className="w-5 h-5" />
                        <span>{t('operations.filters')}</span>
                        {filtrosActivos && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                                {Object.values(filtros).filter(v => v !== '').length + (debouncedBusqueda ? 1 : 0)}
                            </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Panel de filtros expandible */}
                {showFiltros && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('operations.stateFilter')}
                                </label>
                                <select
                                    value={filtros.estado}
                                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">{t('operations.allFilter')}</option>
                                    <option value="pendiente">{t('operations.statePendiente')}</option>
                                    <option value="confirmado">{t('operations.stateConfirmado')}</option>
                                    <option value="en_preparacion">{t('operations.statePreparacion')}</option>
                                    <option value="en_ruta">{t('operations.stateEnRuta')}</option>
                                    <option value="en_proceso">{t('operations.stateEnProceso')}</option>
                                    <option value="en_revision">{t('operations.stateEnRevision')}</option>
                                    <option value="en_reparacion">{t('operations.stateEnReparacion')}</option>
                                    <option value="completado">{t('operations.stateCompletado')}</option>
                                    <option value="cancelado">{t('operations.stateCancelado')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('operations.typeFilter')}
                                </label>
                                <select
                                    value={filtros.tipo}
                                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">{t('operations.allFilter')}</option>
                                    <option value="montaje">{t('operations.typeMontaje')}</option>
                                    <option value="desmontaje">{t('operations.typeDesmontaje')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('operations.fromDate')}
                                </label>
                                <input
                                    type="date"
                                    value={filtros.fecha_desde}
                                    onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('operations.toDate')}
                                </label>
                                <input
                                    type="date"
                                    value={filtros.fecha_hasta}
                                    onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>
                        </div>
                        {filtrosActivos && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleLimpiarFiltros}
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    {t('operations.clearFilters')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CONTADOR */}
            <div className="mb-4 text-sm text-slate-500">
                {eventosActivos.length > 0 && (
                    <span>{eventosActivos.length !== 1 ? t('operations.activeEventsCountPlural', { count: eventosActivos.length }) : t('operations.activeEventsCount', { count: eventosActivos.length })}</span>
                )}
                {eventosActivos.length > 0 && manualesActivos.length > 0 && <span> · </span>}
                {manualesActivos.length > 0 && (
                    <span>{manualesActivos.length !== 1 ? t('operations.manualOrdersCountPlural', { count: manualesActivos.length }) : t('operations.manualOrdersCount', { count: manualesActivos.length })}</span>
                )}
                {eventosActivos.length === 0 && manualesActivos.length === 0 && (
                    <span>{t('operations.zeroOrders')}</span>
                )}
            </div>

            {/* EVENTOS AGRUPADOS (ACTIVOS) */}
            {eventosActivos.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                        {t('operations.activeEventsSection')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {eventosActivos.map((evento, idx) => (
                            <EventoCard
                                key={evento.alquiler_id || idx}
                                evento={evento}
                                navigate={navigate}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ÓRDENES MANUALES (ACTIVAS) */}
            {manualesActivos.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                        {t('operations.manualOrdersSection')}
                    </h2>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {manualesActivos.map((orden) => (
                                <OrdenManualRow
                                    key={orden.id}
                                    orden={orden}
                                    navigate={navigate}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ESTADO VACÍO */}
            {eventosActivos.length === 0 && manualesActivos.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                        {t('operations.noWorkOrders')}
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {filtrosActivos
                            ? t('operations.noOrdersWithFilters')
                            : t('operations.noOrdersYet')}
                    </p>
                    {filtrosActivos && (
                        <button
                            onClick={handleLimpiarFiltros}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            {/* Modal Nueva Orden */}
            {showModalNuevaOrden && (
                <ModalNuevaOrden
                    onClose={() => setShowModalNuevaOrden(false)}
                    onSave={handleCrearOrden}
                    t={t}
                />
            )}
        </div>
    )
}
