// ============================================
// PÁGINA: CALENDARIO DE OPERACIONES
// Vista de calendario con vistas mes/semana/día
// ============================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Truck,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Package,
    Clock,
    MapPin,
    User,
    AlertCircle,
    Filter,
    CheckCircle,
    Circle,
    FileText
} from 'lucide-react'
import { useGetCalendario } from '../hooks/useOrdenesTrabajo'
import { useAuth } from '../hooks/auth/useAuth'
import Spinner from '../components/common/Spinner'
import { ModalOrdenCargue } from '../components/operaciones'

// ============================================
// CONSTANTES
// ============================================
const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const VISTAS = {
    MES: 'mes',
    SEMANA: 'semana',
    DIA: 'dia'
}

// Configuración de estados para badges
const ESTADOS_CONFIG = {
    pendiente: { label: 'Pendiente', bg: 'bg-slate-100', text: 'text-slate-700' },
    confirmado: { label: 'Confirmado', bg: 'bg-blue-100', text: 'text-blue-700' },
    en_preparacion: { label: 'Preparación', bg: 'bg-amber-100', text: 'text-amber-700' },
    en_ruta: { label: 'En ruta', bg: 'bg-purple-100', text: 'text-purple-700' },
    en_sitio: { label: 'En sitio', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    en_proceso: { label: 'En proceso', bg: 'bg-cyan-100', text: 'text-cyan-700' },
    completado: { label: 'Completado', bg: 'bg-green-100', text: 'text-green-700' },
    cancelado: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-700' }
}

// ============================================
// HELPERS DE FECHA
// ============================================
const formatFechaKey = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
}

const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear()
}

const getInicioSemana = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
}

const getFinSemana = (date) => {
    const d = getInicioSemana(date)
    d.setDate(d.getDate() + 6)
    return d
}

const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// ============================================
// COMPONENTE: Tarjeta de Orden (reutilizable)
// ============================================
const OrdenCard = ({ orden, compact = false, onClick, onOpenCargue }) => {
    const esMontaje = orden.tipo === 'montaje'
    const estadoConfig = ESTADOS_CONFIG[orden.estado] || ESTADOS_CONFIG.pendiente
    const sinResponsable = !orden.responsable_id
    const esCompletado = orden.estado === 'completado'

    const handleCargueClick = (e) => {
        e.stopPropagation()
        if (onOpenCargue) onOpenCargue(orden)
    }

    if (compact) {
        return (
            <button
                onClick={onClick}
                className={`w-full text-left px-2 py-1 rounded text-xs truncate relative ${
                    esCompletado
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : esMontaje
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                } transition-colors`}
            >
                <span className="flex items-center gap-1">
                    {esCompletado && <CheckCircle className="w-3 h-3 shrink-0" />}
                    {sinResponsable && !esCompletado && <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />}
                    <span className="truncate">
                        {formatHora(orden.fecha_programada)} {orden.cliente_nombre || 'Cliente'}
                    </span>
                </span>
            </button>
        )
    }

    return (
        <div
            className={`px-4 py-3 border-b border-slate-100 last:border-b-0 ${
                esCompletado ? 'bg-green-50/30' : ''
            }`}
        >
            <div className="flex items-start gap-3">
                <div
                    onClick={onClick}
                    className={`p-2 rounded-lg shrink-0 cursor-pointer ${
                        esCompletado ? 'bg-green-100' : esMontaje ? 'bg-emerald-100' : 'bg-orange-100'
                    }`}
                >
                    {esCompletado
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : esMontaje
                            ? <Package className="w-4 h-4 text-emerald-600" />
                            : <Truck className="w-4 h-4 text-orange-600" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <div
                        onClick={onClick}
                        className="cursor-pointer hover:bg-slate-50 -mx-1 px-1 rounded transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                esMontaje
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-orange-100 text-orange-700'
                            }`}>
                                {esMontaje ? 'Montaje' : 'Desmontaje'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                                {estadoConfig.label}
                            </span>
                            <span className="text-xs text-slate-500">#{orden.id}</span>
                        </div>
                        <p className="font-medium text-slate-900 truncate">
                            {orden.cliente_nombre || 'Cliente'}
                        </p>
                        {orden.nombre_evento && (
                            <p className="text-sm text-slate-600 truncate">
                                {orden.nombre_evento}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatHora(orden.fecha_programada)}
                        </span>
                        {(orden.ciudad_evento || orden.direccion_evento) && (
                            <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3" />
                                {orden.ciudad_evento || ''}
                                {orden.direccion_evento ? ` - ${orden.direccion_evento}` : ''}
                            </span>
                        )}
                        {orden.total_equipo > 0 ? (
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {orden.total_equipo}
                            </span>
                        ) : (
                            sinResponsable && !esCompletado && (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <AlertCircle className="w-3 h-3" />
                                    Sin responsable
                                </span>
                            )
                        )}
                    </div>
                    {/* Botón de orden de cargue */}
                    <div className="mt-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={handleCargueClick}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Orden de Cargue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Vista Mes
// ============================================
const VistaMes = ({ currentDate, selectedDate, setSelectedDate, ordenesPorFecha, navigate }) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const diasDelMes = useMemo(() => {
        const primerDia = new Date(year, month, 1)
        const ultimoDia = new Date(year, month + 1, 0)
        const diasEnMes = ultimoDia.getDate()
        const diaInicio = primerDia.getDay()

        const dias = []

        // Días del mes anterior
        const ultimoDiaMesAnterior = new Date(year, month, 0).getDate()
        for (let i = diaInicio - 1; i >= 0; i--) {
            dias.push({
                day: ultimoDiaMesAnterior - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, ultimoDiaMesAnterior - i)
            })
        }

        // Días del mes actual
        for (let i = 1; i <= diasEnMes; i++) {
            dias.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            })
        }

        // Completar última semana
        const diasRestantes = 42 - dias.length
        for (let i = 1; i <= diasRestantes; i++) {
            dias.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            })
        }

        return dias
    }, [year, month])

    return (
        <div className="p-4">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="text-center py-2 text-sm font-medium text-slate-500">
                        {dia}
                    </div>
                ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
                {diasDelMes.map((dia, index) => {
                    const fechaKey = formatFechaKey(dia.date)
                    const ordenesDia = ordenesPorFecha[fechaKey] || []
                    const montajes = ordenesDia.filter(o => o.tipo === 'montaje').length
                    const desmontajes = ordenesDia.filter(o => o.tipo === 'desmontaje').length

                    return (
                        <button
                            key={index}
                            onClick={() => setSelectedDate(dia.date)}
                            className={`
                                relative min-h-[80px] p-2 rounded-lg border transition-all text-left
                                ${dia.isCurrentMonth
                                    ? 'bg-white hover:bg-slate-50'
                                    : 'bg-slate-50 text-slate-400'
                                }
                                ${isToday(dia.date)
                                    ? 'border-blue-500 ring-1 ring-blue-500'
                                    : 'border-slate-200'
                                }
                                ${isSameDay(dia.date, selectedDate)
                                    ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50'
                                    : ''
                                }
                            `}
                        >
                            <span className={`
                                text-sm font-medium
                                ${isToday(dia.date) ? 'text-blue-600' : ''}
                            `}>
                                {dia.day}
                            </span>

                            {ordenesDia.length > 0 && (() => {
                                const completados = ordenesDia.filter(o => o.estado === 'completado').length
                                const sinResponsable = ordenesDia.filter(o => !o.responsable_id && o.estado !== 'completado').length
                                return (
                                    <div className="mt-1 space-y-1">
                                        {montajes > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                <span className="text-emerald-700">{montajes}</span>
                                            </div>
                                        )}
                                        {desmontajes > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                                <span className="text-orange-700">{desmontajes}</span>
                                            </div>
                                        )}
                                        {completados > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                                                <span className="text-green-600">{completados}</span>
                                            </div>
                                        )}
                                        {sinResponsable > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <AlertCircle className="w-2.5 h-2.5 text-amber-500" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Vista Semana
// ============================================
const VistaSemana = ({ currentDate, ordenesPorFecha, navigate }) => {
    const inicioSemana = getInicioSemana(currentDate)

    const diasSemana = useMemo(() => {
        const dias = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(inicioSemana)
            d.setDate(d.getDate() + i)
            dias.push(d)
        }
        return dias
    }, [inicioSemana.getTime()])

    // Horas del día (6am a 10pm)
    const horas = []
    for (let h = 6; h <= 22; h++) {
        horas.push(h)
    }

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[700px]">
                {/* Header con días */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200">
                    <div className="p-2" />
                    {diasSemana.map((dia, i) => (
                        <div
                            key={i}
                            className={`p-3 text-center border-l border-slate-200 ${
                                isToday(dia) ? 'bg-blue-50' : ''
                            }`}
                        >
                            <p className="text-xs text-slate-500">{DIAS_SEMANA[dia.getDay()]}</p>
                            <p className={`text-lg font-bold ${
                                isToday(dia) ? 'text-blue-600' : 'text-slate-900'
                            }`}>
                                {dia.getDate()}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Grid de horas */}
                <div className="relative">
                    {horas.map((hora) => (
                        <div key={hora} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
                            <div className="p-2 text-xs text-slate-400 text-right pr-3 py-3">
                                {`${hora}:00`}
                            </div>
                            {diasSemana.map((dia, i) => {
                                const fechaKey = formatFechaKey(dia)
                                const ordenesDia = ordenesPorFecha[fechaKey] || []
                                const ordenesHora = ordenesDia.filter(o => {
                                    const h = new Date(o.fecha_programada).getHours()
                                    return h === hora
                                })

                                return (
                                    <div
                                        key={i}
                                        className={`border-l border-slate-200 min-h-[48px] p-0.5 ${
                                            isToday(dia) ? 'bg-blue-50/30' : ''
                                        }`}
                                    >
                                        {ordenesHora.map((orden) => (
                                            <OrdenCard
                                                key={orden.id}
                                                orden={orden}
                                                compact
                                                onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
                                            />
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Vista Día
// ============================================
const VistaDia = ({ currentDate, ordenesPorFecha, navigate, onOpenCargue }) => {
    const fechaKey = formatFechaKey(currentDate)
    const ordenesDia = ordenesPorFecha[fechaKey] || []

    // Horas del día (6am a 10pm)
    const horas = []
    for (let h = 6; h <= 22; h++) {
        horas.push(h)
    }

    return (
        <div>
            {/* Header del día */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <p className="text-lg font-semibold text-slate-900">
                    {DIAS_SEMANA_COMPLETO[currentDate.getDay()]}, {currentDate.getDate()} de {NOMBRES_MESES[currentDate.getMonth()]}
                </p>
                <p className="text-sm text-slate-500">
                    {ordenesDia.length} orden{ordenesDia.length !== 1 ? 'es' : ''} programada{ordenesDia.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Timeline de horas */}
            <div>
                {horas.map((hora) => {
                    const ordenesHora = ordenesDia.filter(o => {
                        const h = new Date(o.fecha_programada).getHours()
                        return h === hora
                    })

                    return (
                        <div key={hora} className="flex border-b border-slate-100">
                            <div className="w-20 shrink-0 p-3 text-right text-sm text-slate-400 border-r border-slate-200">
                                {`${hora}:00`}
                            </div>
                            <div className="flex-1 min-h-[56px]">
                                {ordenesHora.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {ordenesHora.map((orden) => (
                                            <OrdenCard
                                                key={orden.id}
                                                orden={orden}
                                                onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
                                                onOpenCargue={onOpenCargue}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Si no hay órdenes */}
            {ordenesDia.length === 0 && (
                <div className="px-6 py-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No hay órdenes para este día</p>
                    <p className="text-sm text-slate-500 mt-1">Las órdenes programadas aparecerán aquí</p>
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CalendarioOperaciones() {
    const navigate = useNavigate()
    useAuth()

    // ============================================
    // ESTADO
    // ============================================
    const [vista, setVista] = useState(VISTAS.MES)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState('todos') // todos, montaje, desmontaje
    const [filtroEstado, setFiltroEstado] = useState('todos') // todos, pendiente, en_proceso, completado
    const [mostrarFiltros, setMostrarFiltros] = useState(false)

    // Modal de orden de cargue
    const [ordenCargueModal, setOrdenCargueModal] = useState({ isOpen: false, orden: null })

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Calcular rango según la vista
    const rango = useMemo(() => {
        if (vista === VISTAS.MES) {
            return {
                desde: new Date(year, month, 1).toISOString().split('T')[0],
                hasta: new Date(year, month + 1, 0).toISOString().split('T')[0]
            }
        } else if (vista === VISTAS.SEMANA) {
            const inicio = getInicioSemana(currentDate)
            const fin = getFinSemana(currentDate)
            return {
                desde: formatFechaKey(inicio),
                hasta: formatFechaKey(fin)
            }
        } else {
            const fecha = formatFechaKey(currentDate)
            return { desde: fecha, hasta: fecha }
        }
    }, [vista, year, month, currentDate.getTime()])

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const { eventos: calendario, isLoading } = useGetCalendario({
        desde: rango.desde,
        hasta: rango.hasta
    })

    // Filtrar y agrupar órdenes por fecha
    const { ordenesPorFecha, estadisticas } = useMemo(() => {
        if (!calendario) return { ordenesPorFecha: {}, estadisticas: { total: 0, montajes: 0, desmontajes: 0, completados: 0, sinResponsable: 0 } }

        // Calcular estadísticas de todas las órdenes (sin filtrar)
        const stats = {
            total: calendario.length,
            montajes: calendario.filter(o => o.tipo === 'montaje').length,
            desmontajes: calendario.filter(o => o.tipo === 'desmontaje').length,
            completados: calendario.filter(o => o.estado === 'completado').length,
            sinResponsable: calendario.filter(o => !o.responsable_id && o.estado !== 'completado').length
        }

        // Aplicar filtros
        let filtradas = calendario
        if (filtroTipo !== 'todos') {
            filtradas = filtradas.filter(o => o.tipo === filtroTipo)
        }
        if (filtroEstado !== 'todos') {
            if (filtroEstado === 'en_proceso') {
                // Incluir todos los estados activos excepto completado/cancelado
                filtradas = filtradas.filter(o =>
                    !['completado', 'cancelado', 'pendiente'].includes(o.estado)
                )
            } else {
                filtradas = filtradas.filter(o => o.estado === filtroEstado)
            }
        }

        // Agrupar por fecha
        const agrupado = {}
        filtradas.forEach(orden => {
            const fecha = orden.fecha_programada?.split('T')[0]
            if (!agrupado[fecha]) agrupado[fecha] = []
            agrupado[fecha].push(orden)
        })

        return { ordenesPorFecha: agrupado, estadisticas: stats }
    }, [calendario, filtroTipo, filtroEstado])

    // Órdenes del día seleccionado (para panel lateral en vista mes)
    const ordenesSeleccionadas = selectedDate
        ? (ordenesPorFecha[formatFechaKey(selectedDate)] || [])
        : []

    // ============================================
    // NAVEGACIÓN
    // ============================================
    const navegar = (direccion) => {
        const d = new Date(currentDate)
        if (vista === VISTAS.MES) {
            d.setMonth(d.getMonth() + direccion)
        } else if (vista === VISTAS.SEMANA) {
            d.setDate(d.getDate() + (7 * direccion))
        } else {
            d.setDate(d.getDate() + direccion)
        }
        setCurrentDate(d)
        setSelectedDate(null)
    }

    const irAHoy = () => {
        setCurrentDate(new Date())
        setSelectedDate(null)
    }

    // Título dinámico según vista
    const getTitulo = () => {
        if (vista === VISTAS.MES) {
            return `${NOMBRES_MESES[month]} ${year}`
        } else if (vista === VISTAS.SEMANA) {
            const inicio = getInicioSemana(currentDate)
            const fin = getFinSemana(currentDate)
            const mInicio = NOMBRES_MESES[inicio.getMonth()].substring(0, 3)
            const mFin = NOMBRES_MESES[fin.getMonth()].substring(0, 3)
            if (inicio.getMonth() === fin.getMonth()) {
                return `${inicio.getDate()} - ${fin.getDate()} ${mFin} ${year}`
            }
            return `${inicio.getDate()} ${mInicio} - ${fin.getDate()} ${mFin} ${year}`
        } else {
            return `${DIAS_SEMANA_COMPLETO[currentDate.getDay()]}, ${currentDate.getDate()} de ${NOMBRES_MESES[month]}`
        }
    }

    // Abrir modal de orden de cargue
    const abrirOrdenCargue = (orden) => {
        setOrdenCargueModal({ isOpen: true, orden })
    }

    const cerrarOrdenCargue = () => {
        setOrdenCargueModal({ isOpen: false, orden: null })
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="p-6">
            {/* HEADER CONSISTENTE */}
            <div className="mb-6">
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

                    <div className="flex items-center gap-3">
                        {/* Botón de filtros */}
                        <button
                            onClick={() => setMostrarFiltros(!mostrarFiltros)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                mostrarFiltros || filtroTipo !== 'todos' || filtroEstado !== 'todos'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filtros
                            {(filtroTipo !== 'todos' || filtroEstado !== 'todos') && (
                                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                    {(filtroTipo !== 'todos' ? 1 : 0) + (filtroEstado !== 'todos' ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        {/* Selector de vista */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                            {[
                                { key: VISTAS.DIA, label: 'Día' },
                                { key: VISTAS.SEMANA, label: 'Semana' },
                                { key: VISTAS.MES, label: 'Mes' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => { setVista(key); setSelectedDate(null) }}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        vista === key
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Panel de filtros colapsible */}
                {mostrarFiltros && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Filtro por tipo */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">Tipo:</span>
                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                    {[
                                        { key: 'todos', label: 'Todos' },
                                        { key: 'montaje', label: 'Montajes' },
                                        { key: 'desmontaje', label: 'Desmontajes' }
                                    ].map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setFiltroTipo(key)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                                filtroTipo === key
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filtro por estado */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">Estado:</span>
                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                    {[
                                        { key: 'todos', label: 'Todos' },
                                        { key: 'pendiente', label: 'Pendiente' },
                                        { key: 'en_proceso', label: 'En proceso' },
                                        { key: 'completado', label: 'Completado' }
                                    ].map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setFiltroEstado(key)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                                filtroEstado === key
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Limpiar filtros */}
                            {(filtroTipo !== 'todos' || filtroEstado !== 'todos') && (
                                <button
                                    onClick={() => { setFiltroTipo('todos'); setFiltroEstado('todos') }}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Barra de estadísticas */}
                {!isLoading && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                            <Circle className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">{estadisticas.total} total</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                            <Package className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">{estadisticas.montajes} montajes</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
                            <Truck className="w-3 h-3 text-orange-600" />
                            <span className="text-orange-700">{estadisticas.desmontajes} desmontajes</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-green-700">{estadisticas.completados} completados</span>
                        </div>
                        {estadisticas.sinResponsable > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span className="text-amber-700">{estadisticas.sinResponsable} sin responsable</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className={`grid gap-6 ${vista === VISTAS.MES ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {/* CALENDARIO */}
                <div className={vista === VISTAS.MES ? 'lg:col-span-2' : ''}>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {/* Controles de navegación */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navegar(-1)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                                </button>
                                <h2 className="text-lg font-semibold text-slate-900 min-w-[200px] text-center">
                                    {getTitulo()}
                                </h2>
                                <button
                                    onClick={() => navegar(1)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                            <button
                                onClick={irAHoy}
                                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Hoy
                            </button>
                        </div>

                        {/* Vista del calendario */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Spinner size="lg" text="Cargando calendario..." />
                            </div>
                        ) : (
                            <>
                                {vista === VISTAS.MES && (
                                    <VistaMes
                                        currentDate={currentDate}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        ordenesPorFecha={ordenesPorFecha}
                                        navigate={navigate}
                                    />
                                )}
                                {vista === VISTAS.SEMANA && (
                                    <VistaSemana
                                        currentDate={currentDate}
                                        ordenesPorFecha={ordenesPorFecha}
                                        navigate={navigate}
                                    />
                                )}
                                {vista === VISTAS.DIA && (
                                    <VistaDia
                                        currentDate={currentDate}
                                        ordenesPorFecha={ordenesPorFecha}
                                        navigate={navigate}
                                        onOpenCargue={abrirOrdenCargue}
                                    />
                                )}
                            </>
                        )}

                        {/* Leyenda (siempre visible) */}
                        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                    <span className="text-slate-600">Montajes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                                    <span className="text-slate-600">Desmontajes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span className="text-slate-600">Completados</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                    <span className="text-slate-600">Sin responsable</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PANEL LATERAL - Solo en vista mes */}
                {vista === VISTAS.MES && (
                    <div>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="font-semibold text-slate-900">
                                    {selectedDate
                                        ? selectedDate.toLocaleDateString('es-CO', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })
                                        : 'Selecciona un día'
                                    }
                                </h3>
                                {selectedDate && (
                                    <p className="text-sm text-slate-500">
                                        {ordenesSeleccionadas.length} orden{ordenesSeleccionadas.length !== 1 ? 'es' : ''} programada{ordenesSeleccionadas.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {selectedDate ? (
                                ordenesSeleccionadas.length > 0 ? (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        {ordenesSeleccionadas.map((orden) => (
                                            <OrdenCard
                                                key={orden.id}
                                                orden={orden}
                                                onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
                                                onOpenCargue={abrirOrdenCargue}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-6 py-12 text-center">
                                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-600">No hay órdenes para este día</p>
                                    </div>
                                )
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-600">Haz clic en un día para ver las órdenes</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Orden de Cargue */}
            <ModalOrdenCargue
                isOpen={ordenCargueModal.isOpen}
                onClose={cerrarOrdenCargue}
                ordenId={ordenCargueModal.orden?.id}
                ordenInfo={ordenCargueModal.orden}
            />
        </div>
    )
}
