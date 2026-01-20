// ============================================
// PÁGINA: CALENDARIO DE OPERACIONES
// Vista de calendario para montajes y desmontajes
// ============================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Truck,
    Calendar,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Package,
    Clock,
    MapPin,
    Users,
    ClipboardList
} from 'lucide-react'
import { useGetCalendario } from '../hooks/useOrdenesTrabajo'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'

/**
 * CalendarioOperaciones
 *
 * Calendario mensual que muestra:
 * - Montajes (verde)
 * - Desmontajes (naranja)
 * - Click en día para ver detalles
 */
export default function CalendarioOperaciones() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    // ============================================
    // ESTADO: Fecha actual y seleccionada
    // ============================================
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Calcular rango del mes
    const fechaDesde = new Date(year, month, 1).toISOString().split('T')[0]
    const fechaHasta = new Date(year, month + 1, 0).toISOString().split('T')[0]

    // ============================================
    // HOOKS: Obtener datos del calendario
    // ============================================
    const { calendario, isLoading } = useGetCalendario({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
    })

    // ============================================
    // CÁLCULOS: Días del mes
    // ============================================
    const diasDelMes = useMemo(() => {
        const primerDia = new Date(year, month, 1)
        const ultimoDia = new Date(year, month + 1, 0)
        const diasEnMes = ultimoDia.getDate()
        const diaInicio = primerDia.getDay() // 0 = domingo

        const dias = []

        // Días del mes anterior para completar la primera semana
        const diasMesAnterior = diaInicio
        const ultimoDiaMesAnterior = new Date(year, month, 0).getDate()
        for (let i = diasMesAnterior - 1; i >= 0; i--) {
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

        // Días del próximo mes para completar la última semana
        const diasRestantes = 42 - dias.length // 6 semanas * 7 días
        for (let i = 1; i <= diasRestantes; i++) {
            dias.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            })
        }

        return dias
    }, [year, month])

    // Agrupar órdenes por fecha
    const ordenesPorFecha = useMemo(() => {
        if (!calendario) return {}

        const agrupado = {}
        calendario.forEach(orden => {
            const fecha = orden.fecha_programada?.split('T')[0]
            if (!agrupado[fecha]) {
                agrupado[fecha] = []
            }
            agrupado[fecha].push(orden)
        })
        return agrupado
    }, [calendario])

    // ============================================
    // HANDLERS
    // ============================================
    const mesAnterior = () => {
        setCurrentDate(new Date(year, month - 1, 1))
        setSelectedDate(null)
    }

    const mesSiguiente = () => {
        setCurrentDate(new Date(year, month + 1, 1))
        setSelectedDate(null)
    }

    const irAHoy = () => {
        setCurrentDate(new Date())
        setSelectedDate(null)
    }

    const formatFecha = (date) => {
        return date.toISOString().split('T')[0]
    }

    const isToday = (date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear()
    }

    const isSelected = (date) => {
        return selectedDate && formatFecha(date) === formatFecha(selectedDate)
    }

    const getOrdenesDelDia = (date) => {
        const fechaStr = formatFecha(date)
        return ordenesPorFecha[fechaStr] || []
    }

    const ordenesSeleccionadas = selectedDate ? getOrdenesDelDia(selectedDate) : []

    // ============================================
    // RENDER
    // ============================================
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

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
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">
                                        Calendario de Operaciones
                                    </h1>
                                    <p className="text-sm text-slate-600">
                                        Vista mensual de montajes y desmontajes
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                icon={<ClipboardList />}
                                onClick={() => navigate('/operaciones/ordenes')}
                            >
                                Lista de Órdenes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* CALENDARIO - 2/3 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Controles del mes */}
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={mesAnterior}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <h2 className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
                                        {nombresMeses[month]} {year}
                                    </h2>
                                    <button
                                        onClick={mesSiguiente}
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

                            {/* Grid del calendario */}
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Spinner size="lg" text="Cargando calendario..." />
                                </div>
                            ) : (
                                <div className="p-4">
                                    {/* Días de la semana */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {diasSemana.map((dia) => (
                                            <div
                                                key={dia}
                                                className="text-center py-2 text-sm font-medium text-slate-500"
                                            >
                                                {dia}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Días del mes */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {diasDelMes.map((dia, index) => {
                                            const ordenesDia = getOrdenesDelDia(dia.date)
                                            const montajes = ordenesDia.filter(o => o.tipo === 'montaje').length
                                            const desmontajes = ordenesDia.filter(o => o.tipo === 'desmontaje').length

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedDate(dia.date)}
                                                    className={`
                                                        relative min-h-[80px] p-2 rounded-lg border transition-all
                                                        ${dia.isCurrentMonth
                                                            ? 'bg-white hover:bg-slate-50'
                                                            : 'bg-slate-50 text-slate-400'
                                                        }
                                                        ${isToday(dia.date)
                                                            ? 'border-blue-500 ring-1 ring-blue-500'
                                                            : 'border-slate-200'
                                                        }
                                                        ${isSelected(dia.date)
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

                                                    {/* Indicadores de órdenes */}
                                                    {ordenesDia.length > 0 && (
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
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Leyenda */}
                            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                        <span className="text-slate-600">Montajes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full" />
                                        <span className="text-slate-600">Desmontajes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL LATERAL - 1/3 */}
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
                                    <p className="text-sm text-slate-600">
                                        {ordenesSeleccionadas.length} órdenes programadas
                                    </p>
                                )}
                            </div>

                            {selectedDate ? (
                                ordenesSeleccionadas.length > 0 ? (
                                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                                        {ordenesSeleccionadas.map((orden) => (
                                            <div
                                                key={orden.id}
                                                onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
                                                className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${
                                                        orden.tipo === 'montaje'
                                                            ? 'bg-emerald-100'
                                                            : 'bg-orange-100'
                                                    }`}>
                                                        {orden.tipo === 'montaje'
                                                            ? <Package className={`w-4 h-4 text-emerald-600`} />
                                                            : <Truck className={`w-4 h-4 text-orange-600`} />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">
                                                            {orden.cliente_nombre || 'Cliente'}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(orden.fecha_programada).toLocaleTimeString('es-CO', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                        {orden.ubicacion && (
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="truncate">{orden.ubicacion}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
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
                </div>
            </div>
        </div>
    )
}
