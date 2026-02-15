// ============================================
// PÁGINA: CALENDARIO DE OPERACIONES
// Usa FullCalendar (como CalendarioPage) con
// sidebar, stats, filtros y leyenda consistentes
// ============================================

import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Wrench,
    PackageOpen,
    Eye,
    EyeOff,
    Filter
} from 'lucide-react'
import { useGetCalendario } from '../hooks/useOrdenesTrabajo'
import { useAuth } from '../hooks/auth/useAuth'
import CalendarWrapper from '../components/calendar/CalendarWrapper'
import Spinner from '../components/common/Spinner'
import { ModalOrdenCargue } from '../components/operaciones'
import ModalOrdenDetalle from '../components/operaciones/ModalOrdenDetalle'
import ModalDiaOrdenes from '../components/operaciones/ModalDiaOrdenes'

// ============================================
// CONSTANTES: Colores para tipos de orden
// ============================================
const ORDEN_COLORS = {
    montaje: {
        backgroundColor: '#10B981',
        borderColor: '#059669',
        textColor: '#FFFFFF'
    },
    desmontaje: {
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        textColor: '#FFFFFF'
    }
}

const ORDEN_COLORS_COMPLETADO = {
    montaje: {
        backgroundColor: '#86EFAC',
        borderColor: '#4ADE80',
        textColor: '#166534'
    },
    desmontaje: {
        backgroundColor: '#FDE68A',
        borderColor: '#FBBF24',
        textColor: '#92400E'
    }
}

const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// ============================================
// COMPONENTE: StatCard
// ============================================
const StatCard = ({ icon: Icon, label, value, color = 'slate' }) => {
    const colorMap = {
        slate: 'bg-slate-100 text-slate-600',
        green: 'bg-green-100 text-green-600',
        amber: 'bg-amber-100 text-amber-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        red: 'bg-red-100 text-red-600'
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Filtros de Operaciones
// ============================================
const OperacionesFilters = ({ filters, onFilterChange }) => {
    const { showMontaje, showDesmontaje, filtroEstado } = filters

    const handleToggle = (key) => {
        onFilterChange({ ...filters, [key]: !filters[key] })
    }

    const getButtonClasses = (active, color) => {
        const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all'
        if (active) {
            const map = {
                emerald: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                amber: 'bg-amber-100 text-amber-700 border border-amber-200'
            }
            return `${base} ${map[color]}`
        }
        return `${base} bg-slate-100 text-slate-400 border border-slate-200`
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtros:</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleToggle('showMontaje')}
                        className={getButtonClasses(showMontaje, 'emerald')}
                    >
                        {showMontaje ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        Montaje
                    </button>
                    <button
                        onClick={() => handleToggle('showDesmontaje')}
                        className={getButtonClasses(showDesmontaje, 'amber')}
                    >
                        {showDesmontaje ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        Desmontaje
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Estado:</label>
                    <select
                        value={filtroEstado}
                        onChange={(e) => onFilterChange({ ...filters, filtroEstado: e.target.value })}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Leyenda de Operaciones
// ============================================
const OperacionesLegend = () => {
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Leyenda
            </p>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ORDEN_COLORS.montaje.backgroundColor }} />
                    <span className="text-xs text-slate-600">Montaje</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ORDEN_COLORS.desmontaje.backgroundColor }} />
                    <span className="text-xs text-slate-600">Desmontaje</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-slate-600">Completado</span>
                </div>
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-slate-600">Sin responsable</span>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CalendarioOperaciones() {
    const navigate = useNavigate()
    useAuth()

    const calendarRef = useRef(null)

    // Estado de filtros
    const [filters, setFilters] = useState({
        showMontaje: true,
        showDesmontaje: true,
        filtroEstado: 'todos'
    })

    // Modales
    const [ordenDetalleModal, setOrdenDetalleModal] = useState({ isOpen: false, orden: null })
    const [diaModal, setDiaModal] = useState({ isOpen: false, fecha: null, ordenes: [] })
    const [ordenCargueModal, setOrdenCargueModal] = useState({ isOpen: false, orden: null })

    // Rango de fechas visible del calendario
    const [dateRange, setDateRange] = useState(() => {
        const hoy = new Date()
        const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)
        return {
            desde: desde.toISOString().split('T')[0],
            hasta: hasta.toISOString().split('T')[0]
        }
    })

    // Obtener datos del calendario con rango de fechas
    const { eventos: calendario, isLoading, error, refetch } = useGetCalendario(dateRange)

    // Transformar órdenes a formato FullCalendar
    const { events, stats, ordenesPorId } = useMemo(() => {
        if (!calendario || !calendario.length) {
            return {
                events: [],
                stats: { total: 0, montajes: 0, desmontajes: 0, completados: 0, sinResponsable: 0 },
                ordenesPorId: {}
            }
        }

        const statsCalc = {
            total: calendario.length,
            montajes: calendario.filter(o => o.tipo === 'montaje').length,
            desmontajes: calendario.filter(o => o.tipo === 'desmontaje').length,
            completados: calendario.filter(o => o.estado === 'completado').length,
            sinResponsable: calendario.filter(o => !o.responsable_id && o.estado !== 'completado' && o.estado !== 'cancelado').length
        }

        // Filtrar
        let filtradas = calendario
        if (!filters.showMontaje) {
            filtradas = filtradas.filter(o => o.tipo !== 'montaje')
        }
        if (!filters.showDesmontaje) {
            filtradas = filtradas.filter(o => o.tipo !== 'desmontaje')
        }
        if (filters.filtroEstado !== 'todos') {
            if (filters.filtroEstado === 'en_proceso') {
                filtradas = filtradas.filter(o =>
                    !['completado', 'cancelado', 'pendiente'].includes(o.estado)
                )
            } else {
                filtradas = filtradas.filter(o => o.estado === filters.filtroEstado)
            }
        }

        // Mapa para lookup rápido
        const idMap = {}
        calendario.forEach(o => { idMap[o.id] = o })

        // Transformar a eventos FullCalendar
        const calEvents = filtradas.map(orden => {
            const esCompletado = orden.estado === 'completado'
            const colors = esCompletado
                ? (ORDEN_COLORS_COMPLETADO[orden.tipo] || ORDEN_COLORS_COMPLETADO.montaje)
                : (ORDEN_COLORS[orden.tipo] || ORDEN_COLORS.montaje)

            const hora = formatHora(orden.fecha_programada)
            const titulo = `${hora} ${orden.cliente_nombre || 'Orden'}`

            return {
                id: String(orden.id),
                title: titulo,
                start: orden.fecha_programada,
                backgroundColor: colors.backgroundColor,
                borderColor: colors.borderColor,
                textColor: colors.textColor,
                display: 'block',
                extendedProps: {
                    tipo: orden.tipo,
                    estado: orden.estado,
                    cliente: orden.cliente_nombre,
                    nombreEvento: orden.nombre_evento,
                    ciudadEvento: orden.ciudad_evento,
                    direccionEvento: orden.direccion_evento,
                    responsableId: orden.responsable_id,
                    totalEquipo: orden.total_equipo,
                    ordenId: orden.id
                }
            }
        })

        return { events: calEvents, stats: statsCalc, ordenesPorId: idMap }
    }, [calendario, filters])

    // Handler de click en evento del calendario → abre modal detalle
    const handleEventClick = useCallback((info) => {
        const ordenId = parseInt(info.event.id)
        const orden = ordenesPorId[ordenId]
        if (orden) {
            setOrdenDetalleModal({ isOpen: true, orden })
        }
    }, [ordenesPorId])

    // Handler de click en fecha → abre modal con ordenes del día
    const handleDateClick = useCallback((info) => {
        const fechaClick = info.dateStr.split('T')[0]
        const ordenesDia = (calendario || []).filter(o => {
            const fechaOrden = new Date(o.fecha_programada).toISOString().split('T')[0]
            return fechaOrden === fechaClick
        })
        setDiaModal({ isOpen: true, fecha: fechaClick, ordenes: ordenesDia })
    }, [calendario])

    // Actualizar rango cuando el usuario navega en el calendario
    const handleDatesSet = useCallback((dateInfo) => {
        const desde = dateInfo.startStr.split('T')[0]
        const hasta = dateInfo.endStr.split('T')[0]
        setDateRange(prev => {
            if (prev.desde === desde && prev.hasta === hasta) return prev
            return { desde, hasta }
        })
    }, [])

    const goToToday = useCallback(() => {
        if (calendarRef.current) {
            calendarRef.current.getApi().today()
        }
    }, [])

    const handleIrOrdenes = useCallback(() => {
        navigate('/operaciones/ordenes')
    }, [navigate])

    // Opciones del calendario
    const calendarOptions = useMemo(() => ({
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        dayMaxEvents: 3,
        eventDisplay: 'block',
        height: 'auto',
        selectable: false
    }), [])

    const abrirOrdenCargue = (orden) => {
        setOrdenCargueModal({ isOpen: true, orden })
    }

    const cerrarOrdenCargue = () => {
        setOrdenCargueModal({ isOpen: false, orden: null })
    }

    return (
        <div className="p-6 space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        Calendario de Operaciones
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Programación de montajes y desmontajes
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <StatCard icon={Calendar} label="Total Ordenes" value={stats.total} color="slate" />
                <StatCard icon={Wrench} label="Montajes" value={stats.montajes} color="emerald" />
                <StatCard icon={PackageOpen} label="Desmontajes" value={stats.desmontajes} color="amber" />
                <StatCard icon={CheckCircle} label="Completados" value={stats.completados} color="green" />
                {stats.sinResponsable > 0 && (
                    <StatCard icon={AlertCircle} label="Sin responsable" value={stats.sinResponsable} color="red" />
                )}
            </div>

            {/* FILTROS */}
            <OperacionesFilters
                filters={filters}
                onFilterChange={setFilters}
            />

            {/* CONTENIDO: CALENDARIO + SIDEBAR */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" text="Cargando calendario..." />
                </div>
            ) : error ? (
                <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Error al cargar el calendario</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* CALENDARIO (FullCalendar) */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <CalendarWrapper
                                calendarRef={calendarRef}
                                events={events}
                                options={calendarOptions}
                                handlers={{
                                    eventClick: handleEventClick,
                                    dateClick: handleDateClick,
                                    datesSet: handleDatesSet
                                }}
                            />
                        </div>
                    </div>

                    {/* PANEL LATERAL */}
                    <div className="space-y-4">
                        {/* Leyenda */}
                        <OperacionesLegend />

                        {/* Acciones rápidas */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                Acciones Rapidas
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={goToToday}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Ir a Hoy
                                </button>
                                <button
                                    onClick={handleIrOrdenes}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Ver Todas las Ordenes
                                </button>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                Resumen
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Ordenes:</span>
                                    <span className="font-medium">{stats.total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Visibles:</span>
                                    <span className="font-medium">{events.length}</span>
                                </div>
                                {stats.sinResponsable > 0 && (
                                    <div className="flex justify-between text-amber-600">
                                        <span>Sin responsable:</span>
                                        <span className="font-medium">{stats.sinResponsable}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal: Detalle de Orden */}
            <ModalOrdenDetalle
                isOpen={ordenDetalleModal.isOpen}
                onClose={() => setOrdenDetalleModal({ isOpen: false, orden: null })}
                orden={ordenDetalleModal.orden}
                onVerDetalle={(id) => navigate(`/operaciones/ordenes/${id}`)}
                onOrdenCargue={abrirOrdenCargue}
            />

            {/* Modal: Ordenes del Día */}
            <ModalDiaOrdenes
                isOpen={diaModal.isOpen}
                onClose={() => setDiaModal({ isOpen: false, fecha: null, ordenes: [] })}
                fecha={diaModal.fecha}
                ordenes={diaModal.ordenes}
                onClickOrden={(orden) => {
                    setDiaModal({ isOpen: false, fecha: null, ordenes: [] })
                    setOrdenDetalleModal({ isOpen: true, orden })
                }}
            />

            {/* Modal: Orden de Cargue */}
            <ModalOrdenCargue
                isOpen={ordenCargueModal.isOpen}
                onClose={cerrarOrdenCargue}
                ordenId={ordenCargueModal.orden?.id}
                ordenInfo={ordenCargueModal.orden}
            />
        </div>
    )
}
