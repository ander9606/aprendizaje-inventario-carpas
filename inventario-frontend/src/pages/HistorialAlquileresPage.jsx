// ============================================
// PÁGINA: HISTORIAL DE ALQUILERES
// Consulta de alquileres finalizados/cancelados
// ============================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Archive,
    Search,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    Package,
    ChevronRight,
    X,
    Filter,
    ChevronDown
} from 'lucide-react'
import { useGetAlquileres } from '../hooks/useAlquileres'
import Spinner from '../components/common/Spinner'

// ============================================
// HELPERS
// ============================================
const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
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
// COMPONENTE PRINCIPAL
// ============================================
export default function HistorialAlquileresPage() {
    const navigate = useNavigate()
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')

    const { alquileres, isLoading } = useGetAlquileres()

    // Filtrar solo finalizados/cancelados
    const historial = useMemo(() => {
        return (Array.isArray(alquileres) ? alquileres : [])
            .filter(a => a.estado === 'finalizado' || a.estado === 'cancelado')
            .sort((a, b) => new Date(b.fecha_salida) - new Date(a.fecha_salida))
    }, [alquileres])

    // Aplicar búsqueda y filtro
    const filtrado = useMemo(() => {
        const q = busqueda.toLowerCase().trim()
        return historial.filter(a => {
            if (filtroEstado && a.estado !== filtroEstado) return false
            if (!q) return true
            return (
                a.evento_nombre?.toLowerCase().includes(q) ||
                a.cliente_nombre?.toLowerCase().includes(q) ||
                a.productos_resumen?.toLowerCase().includes(q) ||
                String(a.id).includes(q)
            )
        })
    }, [historial, busqueda, filtroEstado])

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
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Archive className="w-6 h-6 text-slate-600" />
                    </div>
                    Historial de Alquileres
                </h1>
                <p className="text-slate-500 mt-1">
                    {historial.length} alquiler{historial.length !== 1 ? 'es' : ''} finalizado{historial.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Buscador */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar por evento, cliente, producto o ID..."
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
                        {['', 'finalizado', 'cancelado'].map(estado => (
                            <button
                                key={estado}
                                onClick={() => setFiltroEstado(estado)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                    filtroEstado === estado
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                {estado === '' ? 'Todos' : estado === 'finalizado' ? 'Finalizados' : 'Cancelados'}
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
                            ? 'Los alquileres finalizados o cancelados aparecerán aquí'
                            : `No se encontraron alquileres con "${busqueda}"`
                        }
                    </p>
                    {(busqueda || filtroEstado) && (
                        <button
                            onClick={() => { setBusqueda(''); setFiltroEstado('') }}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    {filtrado.map((alquiler) => {
                        const esCancelado = alquiler.estado === 'cancelado'

                        return (
                            <div
                                key={alquiler.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                                onClick={() => navigate(`/alquileres/gestion/${alquiler.id}`)}
                            >
                                {/* Icono estado */}
                                <div className={`p-1.5 rounded-lg shrink-0 ${esCancelado ? 'bg-red-50' : 'bg-green-50'}`}>
                                    {esCancelado
                                        ? <XCircle className="w-4 h-4 text-red-400" />
                                        : <CheckCircle className="w-4 h-4 text-green-500" />
                                    }
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                            {alquiler.evento_nombre || 'Sin nombre'}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                            #{alquiler.id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[11px] text-slate-400 flex items-center gap-0.5 truncate">
                                            <User className="w-3 h-3 shrink-0" />
                                            {alquiler.cliente_nombre || '-'}
                                        </span>
                                        {alquiler.productos_resumen && (
                                            <span className="text-[11px] text-slate-400 flex items-center gap-0.5 truncate hidden sm:flex">
                                                <Package className="w-3 h-3 shrink-0" />
                                                <span className="truncate max-w-[200px]">{alquiler.productos_resumen}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Estado badge */}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                                    esCancelado ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                                }`}>
                                    {esCancelado ? 'Cancelado' : 'Finalizado'}
                                </span>

                                {/* Fechas */}
                                <div className="text-right shrink-0 hidden sm:block">
                                    <span className="text-xs text-slate-400">
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        {formatFecha(alquiler.fecha_salida)}
                                    </span>
                                </div>

                                {/* Total */}
                                <span className="text-xs font-semibold text-slate-600 shrink-0 hidden md:block">
                                    {formatMoneda(alquiler.total)}
                                </span>

                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
