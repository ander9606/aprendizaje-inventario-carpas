// ============================================
// PÁGINA: OPERACIONES DASHBOARD
// Vista principal con tarjetas de evento agrupadas
// Agrupa órdenes por alquiler mostrando pares montaje/desmontaje completos
// ============================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Truck,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowRight,
    ClipboardList,
    Bell,
    Package,
    MapPin,
    LayoutDashboard,
    User,
    Calendar,
    ChevronRight,
    ChevronDown,
    History,
    AlertCircle
} from 'lucide-react'
import { useGetOrdenes, useGetEstadisticasOperaciones } from '../hooks/useOrdenesTrabajo'
import { useGetAlertasPendientes, useGetResumenAlertas } from '../hooks/useAlertas'
import Spinner from '../components/common/Spinner'

// ============================================
// HELPERS: Fechas (usando hora local, no UTC)
// ============================================
const formatLocalDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const getHoy = () => formatLocalDate(new Date())

const getProximos7Dias = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return formatLocalDate(d)
}

const getFechaLocal = (fecha) => {
    if (!fecha) return null
    return fecha.split('T')[0]
}

// ============================================
// HELPERS: Colores y formato
// ============================================
const getEstadoConfig = (estado) => {
    const config = {
        pendiente: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pendiente' },
        confirmado: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Confirmado' },
        en_preparacion: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Preparación' },
        en_ruta: { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'En ruta' },
        en_sitio: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'En sitio' },
        en_proceso: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'En proceso' },
        completado: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Completado' },
        cancelado: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelado' }
    }
    return config[estado] || config.pendiente
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

const formatHora = (fecha) => {
    if (!fecha) return '--:--'
    return new Date(fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatFechaCorta = (fecha) => {
    if (!fecha) return 'Sin fecha'
    return new Date(fecha).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    })
}

// ============================================
// HELPER: Agrupar órdenes por alquiler_id
// Combina montaje y desmontaje en una sola tarjeta
// ============================================
const agruparPorEvento = (ordenes) => {
    if (!ordenes?.length) return []

    const grupos = {}
    ordenes.forEach(orden => {
        const key = orden.alquiler_id || `manual-${orden.id}`
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

    return Object.values(grupos).sort((a, b) => {
        const fechaA = a.montaje?.fecha_programada || a.desmontaje?.fecha_programada
        const fechaB = b.montaje?.fecha_programada || b.desmontaje?.fecha_programada
        return new Date(fechaA) - new Date(fechaB)
    })
}

// ============================================
// HELPER: Determinar la fecha más relevante de un grupo
// Retorna la fecha de la próxima orden activa
// ============================================
const getFechaRelevante = (evento) => {
    const estadosFinal = ['completado', 'cancelado']
    const fechas = []

    // Priorizar la orden activa más próxima
    if (evento.montaje && !estadosFinal.includes(evento.montaje.estado)) {
        fechas.push(evento.montaje.fecha_programada)
    }
    if (evento.desmontaje && !estadosFinal.includes(evento.desmontaje.estado)) {
        fechas.push(evento.desmontaje.fecha_programada)
    }

    // Si no hay órdenes activas, usar cualquier fecha disponible
    if (fechas.length === 0) {
        if (evento.montaje) fechas.push(evento.montaje.fecha_programada)
        if (evento.desmontaje) fechas.push(evento.desmontaje.fecha_programada)
    }

    if (fechas.length === 0) return null
    return fechas.sort((a, b) => new Date(a) - new Date(b))[0]
}

// ============================================
// HELPER: Verificar si alguna orden tiene fecha vencida
// ============================================
const tieneOrdenVencida = (evento) => {
    const hoy = getHoy()
    const estadosFinal = ['completado', 'cancelado']

    if (evento.montaje && !estadosFinal.includes(evento.montaje.estado)) {
        const fecha = getFechaLocal(evento.montaje.fecha_programada)
        if (fecha && fecha < hoy) return true
    }
    if (evento.desmontaje && !estadosFinal.includes(evento.desmontaje.estado)) {
        const fecha = getFechaLocal(evento.desmontaje.fecha_programada)
        if (fecha && fecha < hoy) return true
    }
    return false
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
    const pasos = tipo === 'montaje' ? pasosMontaje : pasosDesmontaje
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
const OrdenRow = ({ orden, tipo, navigate }) => {
    if (!orden) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
                <div className="p-1.5 rounded-lg bg-slate-50">
                    {tipo === 'montaje'
                        ? <Package className="w-4 h-4" />
                        : <Truck className="w-4 h-4" />
                    }
                </div>
                <span className="text-xs italic">Sin {tipo} programado</span>
            </div>
        )
    }

    const config = getEstadoConfig(orden.estado)
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
                    {!tieneResponsable && orden.estado !== 'completado' && orden.estado !== 'cancelado' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                            Sin resp.
                        </span>
                    )}
                </div>
                {/* Barra de progreso */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${colorProgreso}`}
                            style={{ width: `${progreso}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 w-7 text-right">{progreso}%</span>
                </div>
            </div>

            {/* Fecha + flecha */}
            <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">{formatFechaCorta(orden.fecha_programada)}</p>
                <p className="text-[11px] text-slate-400">{formatHora(orden.fecha_programada)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors shrink-0" />
        </div>
    )
}

// ============================================
// COMPONENTE: Tarjeta de Evento (agrupa montaje + desmontaje)
// ============================================
const EventoCard = ({ evento, navigate }) => {
    const montaje = evento.montaje
    const desmontaje = evento.desmontaje

    const estadosActivos = ['en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso']
    const hayOrdenActiva = (montaje && estadosActivos.includes(montaje.estado))
        || (desmontaje && estadosActivos.includes(desmontaje.estado))

    const todasCompletadas = esEventoFinalizado(evento)
    const vencida = tieneOrdenVencida(evento)

    return (
        <div className={`bg-white rounded-xl border overflow-hidden transition-all ${
            todasCompletadas
                ? 'border-green-200 bg-green-50/30'
                : vencida
                    ? 'border-red-200 shadow-sm shadow-red-100'
                    : hayOrdenActiva
                        ? 'border-orange-200 shadow-sm shadow-orange-100'
                        : 'border-slate-200 hover:border-slate-300'
        }`}>
            {/* Header */}
            <div className={`px-4 py-3 ${
                todasCompletadas
                    ? 'bg-green-50 border-b border-green-100'
                    : vencida
                        ? 'bg-red-50/50 border-b border-red-100'
                        : hayOrdenActiva
                            ? 'bg-orange-50/50 border-b border-orange-100'
                            : 'border-b border-slate-100'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                                {evento.evento_nombre || evento.cliente_nombre || 'Evento'}
                            </p>
                            {vencida && !todasCompletadas && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200 shrink-0">
                                    Vencida
                                </span>
                            )}
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
                        {evento.evento_nombre && evento.cliente_nombre && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3" />
                                {evento.cliente_nombre}
                            </p>
                        )}
                    </div>
                    {montaje && (
                        <div className="text-right shrink-0 ml-3">
                            <p className="text-[11px] text-slate-400">Productos</p>
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
                <OrdenRow orden={montaje} tipo="montaje" navigate={navigate} />
                <OrdenRow orden={desmontaje} tipo="desmontaje" navigate={navigate} />
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Sección de eventos
// ============================================
const SeccionEventos = ({ titulo, subtitulo, eventos, navigate, emptyMessage, icono: Icono }) => (
    <div>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                {Icono && <Icono className="w-5 h-5 text-slate-400" />}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
                    {subtitulo && (
                        <p className="text-sm text-slate-500">{subtitulo}</p>
                    )}
                </div>
            </div>
        </div>
        {eventos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventos.map((evento, idx) => (
                    <EventoCard
                        key={evento.alquiler_id || idx}
                        evento={evento}
                        navigate={navigate}
                    />
                ))}
            </div>
        ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">{emptyMessage}</p>
            </div>
        )}
    </div>
)

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function OperacionesDashboard() {
    const navigate = useNavigate()
    const [mostrarHistorial, setMostrarHistorial] = useState(false)

    const hoy = getHoy()
    const fin7Dias = getProximos7Dias()

    // ============================================
    // HOOKS: Obtener datos
    // UNA sola query para TODAS las órdenes activas
    // → garantiza pares montaje/desmontaje completos
    // + query separada para completadas hoy (historial)
    // ============================================
    const { ordenes: ordenesActivas, isLoading: loadingActivas } = useGetOrdenes({
        excluir_finalizados: true,
        limit: 200
    })

    const { ordenes: ordenesCompletadasHoy, isLoading: loadingCompletadas } = useGetOrdenes({
        fecha_desde: hoy,
        fecha_hasta: hoy,
        estado: 'completado',
        limit: 50
    })

    const { estadisticas, isLoading: loadingStats } = useGetEstadisticasOperaciones()
    const { alertas: alertasPendientes } = useGetAlertasPendientes({ limit: 5 })
    const { resumen: resumenAlertas } = useGetResumenAlertas()

    // ============================================
    // DATOS PROCESADOS
    // Agrupar TODAS las órdenes activas por alquiler
    // → pares montaje/desmontaje siempre completos
    // ============================================
    const todosLosEventos = useMemo(
        () => agruparPorEvento(ordenesActivas),
        [ordenesActivas]
    )

    // Clasificar eventos por fecha relevante (la próxima orden activa)
    const { eventosVencidos, eventosHoy, eventosProximos, eventosFuturos } = useMemo(() => {
        const vencidos = []
        const deHoy = []
        const proximos = []
        const futuros = []

        todosLosEventos.forEach(evento => {
            const fechaRef = getFechaRelevante(evento)
            const fechaLocal = fechaRef ? getFechaLocal(fechaRef) : null

            if (!fechaLocal) {
                futuros.push(evento)
                return
            }

            if (fechaLocal < hoy) {
                vencidos.push(evento)
            } else if (fechaLocal === hoy) {
                deHoy.push(evento)
            } else if (fechaLocal <= fin7Dias) {
                proximos.push(evento)
            } else {
                futuros.push(evento)
            }
        })

        return {
            eventosVencidos: vencidos,
            eventosHoy: deHoy,
            eventosProximos: proximos,
            eventosFuturos: futuros
        }
    }, [todosLosEventos, hoy, fin7Dias])

    // Historial: órdenes completadas hoy agrupadas
    const eventosCompletadosHoy = useMemo(
        () => agruparPorEvento(ordenesCompletadasHoy),
        [ordenesCompletadasHoy]
    )

    const sinResponsable = estadisticas?.alertas?.sinResponsable || 0
    const totalActivos = eventosVencidos.length + eventosHoy.length + eventosProximos.length + eventosFuturos.length

    // ============================================
    // RENDER: Loading
    // ============================================
    if (loadingActivas && loadingStats) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" text="Cargando operaciones..." />
            </div>
        )
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <LayoutDashboard className="w-6 h-6 text-amber-600" />
                            </div>
                            Dashboard de Operaciones
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {new Date().toLocaleDateString('es-CO', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className={`grid grid-cols-2 ${eventosVencidos.length > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-4 mb-6`}>
                {/* Eventos Activos */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {totalActivos}
                            </p>
                            <p className="text-sm text-slate-500">Eventos activos</p>
                        </div>
                    </div>
                </div>

                {/* Vencidos (solo si hay) */}
                {eventosVencidos.length > 0 && (
                    <div className="bg-white rounded-xl border border-red-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">
                                    {eventosVencidos.length}
                                </p>
                                <p className="text-sm text-red-500">Vencidos</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pendientes */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {estadisticas?.pendientes || 0}
                            </p>
                            <p className="text-sm text-slate-500">Pendientes</p>
                        </div>
                    </div>
                </div>

                {/* En Proceso */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Truck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {estadisticas?.en_progreso || 0}
                            </p>
                            <p className="text-sm text-slate-500">En proceso</p>
                        </div>
                    </div>
                </div>

                {/* Sin Responsable */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            sinResponsable > 0 ? 'bg-amber-100' : 'bg-slate-100'
                        }`}>
                            <User className={`w-5 h-5 ${
                                sinResponsable > 0 ? 'text-amber-600' : 'text-slate-600'
                            }`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {sinResponsable}
                            </p>
                            <p className="text-sm text-slate-500">Sin responsable</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* EVENTOS - 2/3 */}
                <div className="lg:col-span-2 space-y-8">

                    {/* VENCIDOS (si hay) */}
                    {eventosVencidos.length > 0 && (
                        <SeccionEventos
                            titulo="Atrasados"
                            subtitulo={`${eventosVencidos.length} evento(s) con fecha vencida`}
                            eventos={eventosVencidos}
                            navigate={navigate}
                            emptyMessage=""
                            icono={AlertCircle}
                        />
                    )}

                    {/* HOY */}
                    <SeccionEventos
                        titulo="Hoy"
                        subtitulo={`${eventosHoy.length} evento(s) para hoy`}
                        eventos={eventosHoy}
                        navigate={navigate}
                        emptyMessage="No hay eventos programados para hoy"
                        icono={Calendar}
                    />

                    {/* PRÓXIMOS 7 DÍAS */}
                    <SeccionEventos
                        titulo="Próximos 7 días"
                        subtitulo={`${eventosProximos.length} evento(s) programado(s)`}
                        eventos={eventosProximos}
                        navigate={navigate}
                        emptyMessage="No hay eventos programados para los próximos días"
                        icono={Clock}
                    />

                    {/* MÁS ADELANTE (si hay) */}
                    {eventosFuturos.length > 0 && (
                        <SeccionEventos
                            titulo="Más adelante"
                            subtitulo={`${eventosFuturos.length} evento(s) programado(s)`}
                            eventos={eventosFuturos}
                            navigate={navigate}
                            emptyMessage=""
                        />
                    )}

                    {/* HISTORIAL COMPLETADO HOY */}
                    {eventosCompletadosHoy.length > 0 && (
                        <div className="border-t border-slate-200 pt-6">
                            <button
                                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
                            >
                                {mostrarHistorial ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                                <History className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Completados hoy
                                </span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    {eventosCompletadosHoy.length}
                                </span>
                            </button>

                            {mostrarHistorial && (
                                <div className="opacity-75">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {eventosCompletadosHoy.map((evento, idx) => (
                                            <EventoCard
                                                key={evento.alquiler_id || `completado-${idx}`}
                                                evento={evento}
                                                navigate={navigate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Link a todas las órdenes */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => navigate('/operaciones/ordenes')}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                        >
                            Ver todas las órdenes
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* SIDEBAR - 1/3 */}
                <div className="space-y-6">

                    {/* ALERTAS */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-slate-600" />
                                <h2 className="font-semibold text-slate-900">
                                    Alertas
                                </h2>
                            </div>
                            {(resumenAlertas?.total || 0) > 0 && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    (resumenAlertas?.criticas || 0) > 0
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {resumenAlertas.total}
                                </span>
                            )}
                        </div>

                        {alertasPendientes?.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {alertasPendientes.slice(0, 5).map((alerta, idx) => {
                                    const esStockDisponible = alerta.tipo === 'stock_disponible'
                                    return (
                                        <div
                                            key={alerta.id || `alerta-${idx}`}
                                            onClick={() => {
                                                if (alerta.orden_id) {
                                                    navigate(`/operaciones/ordenes/${alerta.orden_id}`)
                                                }
                                            }}
                                            className={`px-5 py-3 transition-colors ${
                                                alerta.orden_id ? 'cursor-pointer hover:bg-slate-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-1.5 rounded-lg ${
                                                    esStockDisponible
                                                        ? 'bg-green-100 text-green-700'
                                                        : getSeveridadColor(alerta.severidad)
                                                }`}>
                                                    {esStockDisponible
                                                        ? <CheckCircle className="w-3.5 h-3.5" />
                                                        : <AlertTriangle className="w-3.5 h-3.5" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${
                                                        esStockDisponible ? 'text-green-800' : 'text-slate-900'
                                                    }`}>
                                                        {alerta.titulo || alerta.tipo}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {alerta.mensaje || alerta.descripcion}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="px-5 py-8 text-center">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Sin alertas pendientes</p>
                            </div>
                        )}

                        {(alertasPendientes?.length || 0) > 0 && (
                            <div className="px-5 py-3 border-t border-slate-100">
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

                    {/* ACCESOS RÁPIDOS */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200">
                            <h2 className="font-semibold text-slate-900">Accesos rápidos</h2>
                        </div>
                        <div className="p-3 space-y-1">
                            <button
                                onClick={() => navigate('/operaciones/ordenes')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                            >
                                <ClipboardList className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-700">Todas las órdenes</span>
                            </button>
                            <button
                                onClick={() => navigate('/operaciones/calendario')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                            >
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-700">Calendario</span>
                            </button>
                            <button
                                onClick={() => navigate('/operaciones/alertas')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                            >
                                <AlertTriangle className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-700">Gestionar alertas</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
