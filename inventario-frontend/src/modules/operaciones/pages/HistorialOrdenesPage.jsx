// ============================================
// PÁGINA: HISTORIAL DE ÓRDENES DE TRABAJO
// Consulta de órdenes finalizadas (desmontaje completado)
// ============================================

import { useState, useMemo } from 'react'
import {
    Archive,
    Search,
    CheckCircle,
    XCircle,
    Package,
    Truck,
    MapPin,
    ChevronRight,
    ChevronDown,
    X,
    Calendar,
    User,
    Wrench,
    ArrowRightLeft,
    ClipboardCheck,
    Boxes,
    Filter,
    Clock,
    FileText
} from 'lucide-react'
import { useGetOrdenes } from '../hooks/useOrdenesTrabajo'
import Spinner from '@shared/components/Spinner'

// ============================================
// HELPERS
// ============================================
const getTipoConfig = (tipo) => {
    const config = {
        montaje: { icon: Package, label: 'Montaje' },
        desmontaje: { icon: Truck, label: 'Desmontaje' },
        mantenimiento: { icon: Wrench, label: 'Mantenimiento' },
        traslado: { icon: ArrowRightLeft, label: 'Traslado' },
        revision: { icon: ClipboardCheck, label: 'Revisión' },
        inventario: { icon: Boxes, label: 'Inventario' },
        otro: { icon: Package, label: 'Otro' }
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

const formatFechaHora = (fecha) => {
    if (!fecha) return 'Sin fecha'
    return new Date(fecha).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const agruparPorEvento = (ordenes) => {
    if (!ordenes?.length) return { eventos: [], manuales: [] }
    const grupos = {}
    const manuales = []
    ordenes.forEach(orden => {
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
                direccion_evento: orden.direccion_evento || orden.ciudad_evento,
                fecha_montaje: orden.fecha_montaje,
                fecha_desmontaje: orden.fecha_desmontaje,
                nombres_productos: orden.nombres_productos,
                montaje: null,
                desmontaje: null
            }
        }
        if (orden.tipo === 'montaje') grupos[key].montaje = orden
        else if (orden.tipo === 'desmontaje') grupos[key].desmontaje = orden
    })
    return {
        eventos: Object.values(grupos).sort((a, b) => {
            const fA = a.desmontaje?.fecha_programada || a.montaje?.fecha_programada
            const fB = b.desmontaje?.fecha_programada || b.montaje?.fecha_programada
            return new Date(fB) - new Date(fA)
        }),
        manuales: manuales.sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada))
    }
}

// Solo va a historial cuando el desmontaje está completado o cancelado
const esEventoFinalizado = (evento) => {
    if (!evento.desmontaje) return false
    return ['completado', 'cancelado'].includes(evento.desmontaje.estado)
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function HistorialOrdenesPage() {
    const [busqueda, setBusqueda] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('')
    const [showFiltros, setShowFiltros] = useState(false)
    const [expandedId, setExpandedId] = useState(null)

    const { ordenes, isLoading } = useGetOrdenes({ limit: 500 })

    // Separar solo finalizados (desmontaje completado)
    const { eventos, manuales } = useMemo(() => {
        const agrupado = agruparPorEvento(ordenes)
        return {
            eventos: agrupado.eventos.filter(e => esEventoFinalizado(e)),
            manuales: agrupado.manuales.filter(o => ['completado', 'cancelado'].includes(o.estado))
        }
    }, [ordenes])

    // Filtrar por búsqueda y tipo
    const filtrado = useMemo(() => {
        const q = busqueda.toLowerCase().trim()

        const filtrarEvento = (evento) => {
            if (filtroTipo) {
                const tieneTipo = (
                    (filtroTipo === 'montaje' && evento.montaje) ||
                    (filtroTipo === 'desmontaje' && evento.desmontaje)
                )
                if (!tieneTipo) return false
            }
            if (!q) return true
            return (
                evento.evento_nombre?.toLowerCase().includes(q) ||
                evento.cliente_nombre?.toLowerCase().includes(q) ||
                evento.ciudad_evento?.toLowerCase().includes(q) ||
                evento.nombres_productos?.toLowerCase().includes(q) ||
                evento.montaje?.nombre_responsable?.toLowerCase().includes(q) ||
                evento.desmontaje?.nombre_responsable?.toLowerCase().includes(q) ||
                String(evento.alquiler_id).includes(q) ||
                String(evento.montaje?.id).includes(q) ||
                String(evento.desmontaje?.id).includes(q)
            )
        }

        const filtrarManual = (orden) => {
            if (filtroTipo && orden.tipo !== filtroTipo) return false
            if (!q) return true
            return (
                orden.notas?.toLowerCase().includes(q) ||
                orden.ciudad_evento?.toLowerCase().includes(q) ||
                orden.nombre_responsable?.toLowerCase().includes(q) ||
                orden.nombres_productos?.toLowerCase().includes(q) ||
                String(orden.id).includes(q)
            )
        }

        return {
            eventos: eventos.filter(filtrarEvento),
            manuales: manuales.filter(filtrarManual)
        }
    }, [eventos, manuales, busqueda, filtroTipo])

    const totalResultados = filtrado.eventos.length + filtrado.manuales.length
    const totalHistorial = eventos.length + manuales.length

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" text="Cargando historial..." />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Archive className="w-6 h-6 text-slate-600" />
                    </div>
                    Historial de Órdenes
                </h1>
                <p className="text-slate-500 mt-1">
                    {totalHistorial} orden{totalHistorial !== 1 ? 'es' : ''} finalizada{totalHistorial !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Buscador */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, evento, ciudad, producto, encargado o ID..."
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
                            filtroTipo
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm">Filtros</span>
                        {filtroTipo && (
                            <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] rounded-full">1</span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFiltros && (
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                        {['', 'montaje', 'desmontaje', 'mantenimiento'].map(tipo => (
                            <button
                                key={tipo}
                                onClick={() => setFiltroTipo(tipo)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                    filtroTipo === tipo
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                {tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Todos'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Contador */}
            <div className="mb-4 text-sm text-slate-500">
                {busqueda || filtroTipo
                    ? `${totalResultados} resultado${totalResultados !== 1 ? 's' : ''}`
                    : `${totalHistorial} registro${totalHistorial !== 1 ? 's' : ''}`
                }
            </div>

            {/* Lista */}
            {totalResultados === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                        {totalHistorial === 0 ? 'Sin historial' : 'Sin resultados'}
                    </h3>
                    <p className="text-slate-500">
                        {totalHistorial === 0
                            ? 'Las órdenes completadas aparecerán aquí una vez finalizado el desmontaje'
                            : `No se encontraron órdenes con "${busqueda}"`
                        }
                    </p>
                    {(busqueda || filtroTipo) && (
                        <button
                            onClick={() => { setBusqueda(''); setFiltroTipo('') }}
                            className="mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Eventos finalizados */}
                    {filtrado.eventos.map((evento, idx) => {
                        const montaje = evento.montaje
                        const desmontaje = evento.desmontaje
                        const todoCancelado = (montaje?.estado === 'cancelado' || !montaje) && (desmontaje?.estado === 'cancelado' || !desmontaje)
                        const isExpanded = expandedId === (evento.alquiler_id || `h-${idx}`)
                        const cardId = evento.alquiler_id || `h-${idx}`
                        const responsable = montaje?.nombre_responsable || desmontaje?.nombre_responsable
                        const novedades = [montaje?.notas, desmontaje?.notas].filter(Boolean).join(' | ')

                        return (
                            <div
                                key={cardId}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm"
                            >
                                {/* Fila colapsada */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50"
                                    onClick={() => toggleExpand(cardId)}
                                >
                                    {/* Icono estado */}
                                    <div className={`p-1.5 rounded-lg shrink-0 ${todoCancelado ? 'bg-red-50' : 'bg-green-50'}`}>
                                        {todoCancelado
                                            ? <XCircle className="w-4 h-4 text-red-400" />
                                            : <CheckCircle className="w-4 h-4 text-green-500" />
                                        }
                                    </div>

                                    {/* Info principal */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                            {evento.evento_nombre || evento.cliente_nombre || 'Evento'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {evento.cliente_nombre && evento.evento_nombre && (
                                                <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                                    <User className="w-3 h-3" />
                                                    <span className="truncate">{evento.cliente_nombre}</span>
                                                </span>
                                            )}
                                            {evento.ciudad_evento && (
                                                <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                                    <MapPin className="w-3 h-3" />{evento.ciudad_evento}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges M/D */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {montaje && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                montaje.estado === 'completado' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                            }`}>
                                                M
                                            </span>
                                        )}
                                        {desmontaje && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                desmontaje.estado === 'completado' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                            }`}>
                                                D
                                            </span>
                                        )}
                                    </div>

                                    {/* Fecha */}
                                    <span className="text-xs text-slate-400 shrink-0">
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        {formatFecha(desmontaje?.fecha_programada || montaje?.fecha_programada)}
                                    </span>

                                    <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>

                                {/* Detalle expandido */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-3">
                                            {/* Encargado */}
                                            <div className="flex items-start gap-2">
                                                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Encargado</p>
                                                    <p className="text-sm text-slate-700">{responsable || 'Sin asignar'}</p>
                                                </div>
                                            </div>

                                            {/* Cliente */}
                                            <div className="flex items-start gap-2">
                                                <User className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Cliente</p>
                                                    <p className="text-sm text-slate-700">{evento.cliente_nombre || 'Sin cliente'}</p>
                                                </div>
                                            </div>

                                            {/* Producto */}
                                            <div className="flex items-start gap-2">
                                                <Package className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Producto</p>
                                                    <p className="text-sm text-slate-700 line-clamp-2">{evento.nombres_productos || 'Sin productos'}</p>
                                                </div>
                                            </div>

                                            {/* Lugar */}
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Lugar</p>
                                                    <p className="text-sm text-slate-700">
                                                        {evento.direccion_evento || evento.ciudad_evento || 'Sin lugar'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Fecha montaje */}
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Montaje</p>
                                                    <p className="text-sm text-slate-700">{formatFechaHora(evento.fecha_montaje)}</p>
                                                </div>
                                            </div>

                                            {/* Fecha desmontaje */}
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Desmontaje</p>
                                                    <p className="text-sm text-slate-700">{formatFechaHora(evento.fecha_desmontaje)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Novedad */}
                                        {novedades && (
                                            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-100">
                                                <FileText className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Novedad</p>
                                                    <p className="text-sm text-slate-600">{novedades}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {/* Manuales finalizadas */}
                    {filtrado.manuales.map((orden) => {
                        const tipoConfig = getTipoConfig(orden.tipo)
                        const TipoIcon = tipoConfig.icon
                        const isExpanded = expandedId === `m-${orden.id}`

                        return (
                            <div
                                key={`m-${orden.id}`}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm"
                            >
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50"
                                    onClick={() => toggleExpand(`m-${orden.id}`)}
                                >
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                        orden.estado === 'cancelado' ? 'bg-red-50' : 'bg-green-50'
                                    }`}>
                                        <TipoIcon className={`w-4 h-4 ${
                                            orden.estado === 'cancelado' ? 'text-red-400' : 'text-green-500'
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                            #{orden.id} — {tipoConfig.label}
                                        </p>
                                        {orden.notas && (
                                            <p className="text-[11px] text-slate-400 truncate">{orden.notas}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 shrink-0">
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        {formatFecha(orden.fecha_programada)}
                                    </span>
                                    <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-3">
                                            {orden.nombre_responsable && (
                                                <div className="flex items-start gap-2">
                                                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-slate-400">Encargado</p>
                                                        <p className="text-sm text-slate-700">{orden.nombre_responsable}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {orden.ciudad_evento && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-slate-400">Lugar</p>
                                                        <p className="text-sm text-slate-700">{orden.direccion_evento || orden.ciudad_evento}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-start gap-2">
                                                <Calendar className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Fecha programada</p>
                                                    <p className="text-sm text-slate-700">{formatFechaHora(orden.fecha_programada)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {orden.notas && (
                                            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-100">
                                                <FileText className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Novedad</p>
                                                    <p className="text-sm text-slate-600">{orden.notas}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
