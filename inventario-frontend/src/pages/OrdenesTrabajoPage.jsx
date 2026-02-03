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
    Wrench,
    ArrowRightLeft,
    ClipboardCheck,
    ClipboardList,
    Boxes
} from 'lucide-react'
import { useGetOrdenes, useCrearOrdenManual } from '../hooks/useOrdenesTrabajo'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { toast } from 'sonner'

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
const getEstadoConfig = (estado) => {
    const config = {
        pendiente: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pendiente' },
        confirmado: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle, label: 'Confirmado' },
        en_preparacion: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Package, label: 'Preparación' },
        en_ruta: { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Truck, label: 'En ruta' },
        en_sitio: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: MapPin, label: 'En sitio' },
        en_proceso: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: RefreshCw, label: 'En proceso' },
        completado: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Completado' },
        cancelado: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelado' }
    }
    return config[estado] || config.pendiente
}

const getTipoConfig = (tipo) => {
    const config = {
        montaje: { color: 'bg-emerald-100 text-emerald-700', icon: Package, label: 'Montaje' },
        desmontaje: { color: 'bg-orange-100 text-orange-700', icon: Truck, label: 'Desmontaje' },
        mantenimiento: { color: 'bg-blue-100 text-blue-700', icon: Wrench, label: 'Mantenimiento' },
        traslado: { color: 'bg-purple-100 text-purple-700', icon: ArrowRightLeft, label: 'Traslado' },
        revision: { color: 'bg-green-100 text-green-700', icon: ClipboardCheck, label: 'Revisión' },
        inventario: { color: 'bg-amber-100 text-amber-700', icon: Boxes, label: 'Inventario' },
        otro: { color: 'bg-slate-100 text-slate-700', icon: Package, label: 'Otro' }
    }
    return config[tipo] || config.otro
}

const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha'
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
// COMPONENTE: Indicador mini de estado de orden
// ============================================
const OrdenEstadoMini = ({ orden, tipo }) => {
    if (!orden) {
        return (
            <div className="flex items-center gap-2 text-slate-400">
                <div className="p-1 bg-slate-100 rounded">
                    {tipo === 'montaje'
                        ? <Package className="w-3.5 h-3.5" />
                        : <Truck className="w-3.5 h-3.5" />
                    }
                </div>
                <span className="text-xs">Sin {tipo}</span>
            </div>
        )
    }

    const config = getEstadoConfig(orden.estado)

    return (
        <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${
                tipo === 'montaje' ? 'bg-emerald-100' : 'bg-orange-100'
            }`}>
                {tipo === 'montaje'
                    ? <Package className="w-3.5 h-3.5 text-emerald-600" />
                    : <Truck className="w-3.5 h-3.5 text-orange-600" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 capitalize">
                        {tipo}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.color}`}>
                        {config.label}
                    </span>
                </div>
                <p className="text-[11px] text-slate-500">
                    {formatFecha(orden.fecha_programada)} - {formatHora(orden.fecha_programada)}
                </p>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Tarjeta de Evento
// ============================================
const EventoCard = ({ evento, navigate }) => {
    const montaje = evento.montaje
    const desmontaje = evento.desmontaje
    const tieneResponsableMontaje = (montaje?.total_equipo || 0) > 0
    const tieneResponsableDesmontaje = (desmontaje?.total_equipo || 0) > 0

    const estadosActivos = ['en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso']
    const hayOrdenActiva = (montaje && estadosActivos.includes(montaje.estado))
        || (desmontaje && estadosActivos.includes(desmontaje.estado))

    return (
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                            {evento.cliente_nombre || 'Cliente'}
                        </p>
                        {evento.evento_nombre && (
                            <p className="text-xs text-slate-500 truncate">
                                {evento.evento_nombre}
                            </p>
                        )}
                    </div>
                    {hayOrdenActiva && (
                        <span className="relative flex h-2 w-2 ml-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                        </span>
                    )}
                </div>
                {(evento.ciudad_evento || evento.direccion_evento) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {evento.ciudad_evento}
                        {evento.direccion_evento ? ` - ${evento.direccion_evento}` : ''}
                    </p>
                )}
            </div>

            {/* Montaje + Desmontaje */}
            <div className="px-4 py-3 space-y-2">
                <OrdenEstadoMini orden={montaje} tipo="montaje" />
                <OrdenEstadoMini orden={desmontaje} tipo="desmontaje" />
            </div>

            {/* Indicadores + Acción */}
            <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {montaje && (
                        <div className={`flex items-center gap-1 text-[11px] ${
                            tieneResponsableMontaje ? 'text-green-600' : 'text-amber-600'
                        }`}>
                            <User className="w-3 h-3" />
                            <span>{tieneResponsableMontaje ? 'Asignado' : 'Sin resp.'}</span>
                        </div>
                    )}
                    {montaje && (
                        <div className={`flex items-center gap-1 text-[11px] ${
                            (montaje.total_elementos || 0) > 0 ? 'text-green-600' : 'text-slate-400'
                        }`}>
                            <Package className="w-3 h-3" />
                            <span>{montaje.total_elementos || 0} elem.</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => {
                        const ordenId = montaje?.id || desmontaje?.id
                        if (ordenId) navigate(`/operaciones/ordenes/${ordenId}`)
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-0.5"
                >
                    Ver detalle
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Fila de orden manual
// ============================================
const OrdenManualRow = ({ orden, navigate }) => {
    const tipoConfig = getTipoConfig(orden.tipo)
    const estadoConfig = getEstadoConfig(orden.estado)
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
const ModalNuevaOrden = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        tipo: 'mantenimiento',
        fecha_programada: '',
        hora_programada: '08:00',
        direccion_destino: '',
        ciudad_destino: '',
        notas: '',
        prioridad: 'normal'
    })
    const [saving, setSaving] = useState(false)

    const tiposOrden = [
        { value: 'mantenimiento', label: 'Mantenimiento', icon: Wrench, color: 'text-blue-600' },
        { value: 'traslado', label: 'Traslado', icon: ArrowRightLeft, color: 'text-purple-600' },
        { value: 'revision', label: 'Revisión', icon: ClipboardCheck, color: 'text-green-600' },
        { value: 'inventario', label: 'Inventario', icon: Boxes, color: 'text-amber-600' },
        { value: 'otro', label: 'Otro', icon: Package, color: 'text-slate-600' }
    ]

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleGuardar = async () => {
        if (!formData.fecha_programada) {
            toast.error('La fecha es requerida')
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Nueva Orden de Trabajo
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                    {/* Tipo de orden */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Orden
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
                                Fecha *
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
                                Hora
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
                            Prioridad
                        </label>
                        <select
                            name="prioridad"
                            value={formData.prioridad}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        >
                            <option value="baja">Baja</option>
                            <option value="normal">Normal</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Dirección (opcional)
                        </label>
                        <input
                            type="text"
                            name="direccion_destino"
                            value={formData.direccion_destino}
                            onChange={handleChange}
                            placeholder="Dirección del destino..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Ciudad */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Ciudad (opcional)
                        </label>
                        <input
                            type="text"
                            name="ciudad_destino"
                            value={formData.ciudad_destino}
                            onChange={handleChange}
                            placeholder="Ciudad..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notas
                        </label>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Descripción de la orden..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="orange"
                        icon={Save}
                        onClick={handleGuardar}
                        disabled={saving || !formData.fecha_programada}
                    >
                        {saving ? 'Creando...' : 'Crear Orden'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function OrdenesTrabajoPage() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente', 'operaciones'])

    // ============================================
    // ESTADO: Filtros, búsqueda y modal
    // ============================================
    const [busqueda, setBusqueda] = useState('')
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
        limit: 200
    }

    const { ordenes, isLoading, refetch } = useGetOrdenes(queryParams)
    const crearOrdenManual = useCrearOrdenManual()

    // ============================================
    // DATOS PROCESADOS
    // ============================================
    const { eventos, manuales } = useMemo(() => agruparPorEvento(ordenes), [ordenes])

    // ============================================
    // HANDLERS
    // ============================================
    const handleCrearOrden = async (datos) => {
        try {
            await crearOrdenManual.mutateAsync(datos)
            toast.success('Orden creada correctamente')
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al crear la orden')
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
                <Spinner size="lg" text="Cargando órdenes..." />
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
                            Órdenes de Trabajo
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Gestión de órdenes de montaje, desmontaje y más
                        </p>
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="primary"
                                icon={<Plus />}
                                onClick={() => setShowModalNuevaOrden(true)}
                            >
                                Nueva Orden
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* BUSCADOR */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o ubicación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400 outline-none"
                        />
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda('')}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Limpiar
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
                        <span>Filtros</span>
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
                                    Estado
                                </label>
                                <select
                                    value={filtros.estado}
                                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="en_preparacion">En preparación</option>
                                    <option value="en_ruta">En ruta</option>
                                    <option value="en_proceso">En proceso</option>
                                    <option value="completado">Completado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={filtros.tipo}
                                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="montaje">Montaje</option>
                                    <option value="desmontaje">Desmontaje</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Desde
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
                                    Hasta
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
                                    Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CONTADOR */}
            <div className="mb-4 text-sm text-slate-500">
                {eventos.length > 0 && (
                    <span>{eventos.length} evento{eventos.length !== 1 ? 's' : ''}</span>
                )}
                {eventos.length > 0 && manuales.length > 0 && <span> · </span>}
                {manuales.length > 0 && (
                    <span>{manuales.length} orden{manuales.length !== 1 ? 'es' : ''} manual{manuales.length !== 1 ? 'es' : ''}</span>
                )}
                {eventos.length === 0 && manuales.length === 0 && (
                    <span>0 órdenes</span>
                )}
            </div>

            {/* EVENTOS AGRUPADOS */}
            {eventos.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                        Eventos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eventos.map((evento, idx) => (
                            <EventoCard
                                key={evento.alquiler_id || idx}
                                evento={evento}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ÓRDENES MANUALES */}
            {manuales.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                        Órdenes Manuales
                    </h2>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {manuales.map((orden) => (
                                <OrdenManualRow
                                    key={orden.id}
                                    orden={orden}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ESTADO VACÍO */}
            {eventos.length === 0 && manuales.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                        No hay órdenes de trabajo
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {filtrosActivos
                            ? 'No se encontraron órdenes con los filtros aplicados'
                            : 'Aún no se han creado órdenes de trabajo'}
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
                />
            )}
        </div>
    )
}
