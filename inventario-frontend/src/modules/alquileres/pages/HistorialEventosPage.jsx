// ============================================
// PÁGINA: HISTORIAL DE EVENTOS
// Consulta de eventos completados/cancelados
// ============================================

import { useState, useMemo } from 'react'
import {
    Archive,
    Search,
    CheckCircle,
    XCircle,
    Calendar,
    Users,
    FileText,
    DollarSign,
    MapPin,
    ChevronRight,
    X,
    ChevronDown,
    ChevronUp,
    Package,
    RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGetEventos, useRepetirEvento } from '../hooks/useEventos'
import Spinner from '@shared/components/Spinner'
import Button from '@shared/components/Button'
import EventoFormModal from '../components/modals/EventoFormModal'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// ============================================
// HELPERS
// ============================================
const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const fechaStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha
    const fechaObj = new Date(fechaStr + 'T12:00:00')
    if (isNaN(fechaObj.getTime())) return '-'
    return fechaObj.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

const formatMoneda = (valor) => {
    if (!valor && valor !== 0) return '-'
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(valor)
}

// ============================================
// COMPONENTE: EventoHistorialCard
// ============================================
const EventoHistorialCard = ({ evento, onRepetirEvento }) => {
    const [expanded, setExpanded] = useState(false)
    const esCancelado = evento.estado === 'cancelado'

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header clickable */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
            >
                {/* Icono estado */}
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${esCancelado ? 'bg-red-50' : 'bg-green-50'}`}>
                    {esCancelado
                        ? <XCircle className="w-4 h-4 text-red-400" />
                        : <CheckCircle className="w-4 h-4 text-green-500" />
                    }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                            {evento.nombre}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                            esCancelado ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {esCancelado ? 'Cancelado' : 'Completado'}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {evento.cliente_nombre}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatFecha(evento.fecha_inicio)}
                            {evento.fecha_fin !== evento.fecha_inicio && (
                                <> - {formatFecha(evento.fecha_fin)}</>
                            )}
                        </span>
                        {evento.ciudad_nombre && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {evento.ciudad_nombre}
                            </span>
                        )}
                    </div>
                    {/* Productos resumen */}
                    {evento.productos_resumen && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                            <Package className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{evento.productos_resumen}</span>
                        </div>
                    )}
                </div>

                {/* Valor y toggle */}
                <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                    <div>
                        <p className="font-bold text-slate-900 text-sm">
                            {formatMoneda(evento.total_valor)}
                        </p>
                        <p className="text-xs text-slate-500">
                            {evento.total_cotizaciones || 0} cotizacion{evento.total_cotizaciones !== 1 ? 'es' : ''}
                        </p>
                    </div>
                    {expanded
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />
                    }
                </div>
            </button>

            {/* Detalle expandido */}
            {expanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
                    {/* Descripción */}
                    {evento.descripcion && (
                        <p className="text-sm text-slate-600">{evento.descripcion}</p>
                    )}

                    {/* Productos alquilados */}
                    {evento.productos_resumen && (
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Package className="w-3.5 h-3.5" />
                                Productos alquilados
                            </p>
                            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                                {evento.productos_resumen.split(', ').map((prod, idx) => (
                                    <div key={idx} className="px-3 py-2 flex items-center gap-2 text-sm">
                                        <span className="text-slate-900">{prod}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                            <p className="text-lg font-bold text-slate-900">{evento.total_cotizaciones || 0}</p>
                            <p className="text-xs text-slate-500">Cotizaciones</p>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                            <p className="text-lg font-bold text-emerald-600">{formatMoneda(evento.total_valor)}</p>
                            <p className="text-xs text-slate-500">Valor total</p>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                            <p className="text-lg font-bold text-slate-900">
                                {formatFecha(evento.fecha_inicio)}
                            </p>
                            <p className="text-xs text-slate-500">Fecha inicio</p>
                        </div>
                    </div>

                    {/* Dirección */}
                    {evento.direccion && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {evento.direccion}
                        </div>
                    )}

                    {/* Botón repetir evento */}
                    {evento.estado === 'completado' && onRepetirEvento && (
                        <div className="pt-2 border-t border-slate-200">
                            <Button
                                size="sm"
                                variant="secondary"
                                icon={<RefreshCw className="w-4 h-4" />}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRepetirEvento(evento)
                                }}
                            >
                                Repetir este evento
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function HistorialEventosPage() {
    const navigate = useNavigate()
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [eventoRepetir, setEventoRepetir] = useState(null)

    const { eventos, isLoading, refetch } = useGetEventos()
    const repetirEvento = useRepetirEvento()

    // Filtrar solo completados/cancelados
    const historial = useMemo(() => {
        return (Array.isArray(eventos) ? eventos : [])
            .filter(e => e.estado === 'completado' || e.estado === 'cancelado')
            .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))
    }, [eventos])

    // Aplicar búsqueda y filtro
    const filtrado = useMemo(() => {
        const q = busqueda.toLowerCase().trim()
        return historial.filter(e => {
            if (filtroEstado && e.estado !== filtroEstado) return false
            if (!q) return true
            return (
                e.nombre?.toLowerCase().includes(q) ||
                e.cliente_nombre?.toLowerCase().includes(q) ||
                e.ciudad_nombre?.toLowerCase().includes(q)
            )
        })
    }, [historial, busqueda, filtroEstado])

    const handleRepetirEvento = (evento) => {
        setEventoRepetir(evento)
    }

    const handleCrearEventoRepetido = async (datos) => {
        try {
            const resultado = await repetirEvento.mutateAsync({
                id: eventoRepetir.id,
                fecha_inicio: datos.fecha_inicio,
                fecha_fin: datos.fecha_fin
            })
            const productosCopiados = resultado?.data?.productos_copiados || 0
            toast.success(`Evento repetido con ${productosCopiados} producto${productosCopiados !== 1 ? 's' : ''}`)
            setEventoRepetir(null)
            refetch()
            navigate('/alquileres/cotizaciones')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al repetir evento')
            throw error
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" text="Cargando historial..." />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Archive className="w-6 h-6 text-purple-600" />
                    </div>
                    Historial de Eventos
                </h1>
                <p className="text-slate-500 mt-1">
                    {historial.length} evento{historial.length !== 1 ? 's' : ''} finalizado{historial.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Buscador y filtros */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar por evento, cliente o ciudad..."
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
                    <div className="flex items-center gap-2">
                        {['', 'completado', 'cancelado'].map(estado => (
                            <button
                                key={estado}
                                onClick={() => setFiltroEstado(estado)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                    filtroEstado === estado
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                {estado === '' ? 'Todos' : estado === 'completado' ? 'Completados' : 'Cancelados'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contador */}
            <div className="mb-4 text-sm text-slate-500">
                {busqueda || filtroEstado
                    ? `${filtrado.length} resultado${filtrado.length !== 1 ? 's' : ''}`
                    : `${historial.length} registro${historial.length !== 1 ? 's' : ''}`
                }
            </div>

            {/* Lista */}
            {filtrado.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                        {historial.length === 0 ? 'Sin historial' : 'Sin resultados'}
                    </h3>
                    <p className="text-slate-500">
                        {historial.length === 0
                            ? 'Los eventos completados o cancelados aparecerán aquí'
                            : `No se encontraron eventos con "${busqueda}"`
                        }
                    </p>
                    {(busqueda || filtroEstado) && (
                        <button
                            onClick={() => { setBusqueda(''); setFiltroEstado('') }}
                            className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtrado.map((evento) => (
                        <EventoHistorialCard
                            key={evento.id}
                            evento={evento}
                            onRepetirEvento={handleRepetirEvento}
                        />
                    ))}
                </div>
            )}

            {/* Modal repetir evento */}
            <EventoFormModal
                isOpen={!!eventoRepetir}
                onClose={() => setEventoRepetir(null)}
                onSave={handleCrearEventoRepetido}
                eventoReferencia={eventoRepetir}
            />
        </div>
    )
}
