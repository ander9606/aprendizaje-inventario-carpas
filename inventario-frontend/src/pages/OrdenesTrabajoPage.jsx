// ============================================
// PÁGINA: ÓRDENES DE TRABAJO
// Lista de órdenes de montaje y desmontaje
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Truck,
    Calendar,
    Search,
    Filter,
    ArrowLeft,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    Package,
    MapPin,
    Users,
    ChevronDown,
    Eye,
    RefreshCw
} from 'lucide-react'
import { useGetOrdenes } from '../hooks/useOrdenesTrabajo'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'

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

/**
 * OrdenesTrabajoPage
 *
 * Lista de órdenes de trabajo con:
 * - Filtros por estado, tipo, fecha
 * - Búsqueda por cliente o ubicación
 * - Vista de lista con detalles
 */
export default function OrdenesTrabajoPage() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente', 'operaciones'])

    // ============================================
    // ESTADO: Filtros y búsqueda
    // ============================================
    const [busqueda, setBusqueda] = useState('')
    const [filtros, setFiltros] = useState({
        estado: '',
        tipo: '',
        fecha_desde: '',
        fecha_hasta: ''
    })
    const [showFiltros, setShowFiltros] = useState(false)

    const debouncedBusqueda = useDebounce(busqueda, 500)

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const queryParams = {
        ...(debouncedBusqueda && { buscar: debouncedBusqueda }),
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.tipo && { tipo: filtros.tipo }),
        ...(filtros.fecha_desde && { fecha_desde: filtros.fecha_desde }),
        ...(filtros.fecha_hasta && { fecha_hasta: filtros.fecha_hasta })
    }

    const { ordenes, isLoading, refetch } = useGetOrdenes(queryParams)

    // ============================================
    // HELPERS
    // ============================================
    const getEstadoConfig = (estado) => {
        const config = {
            pendiente: {
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: Clock,
                label: 'Pendiente'
            },
            en_proceso: {
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: RefreshCw,
                label: 'En Proceso'
            },
            completado: {
                color: 'bg-green-100 text-green-700 border-green-200',
                icon: CheckCircle,
                label: 'Completado'
            },
            cancelado: {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: XCircle,
                label: 'Cancelado'
            }
        }
        return config[estado] || config.pendiente
    }

    const getTipoConfig = (tipo) => {
        return tipo === 'montaje'
            ? { color: 'bg-emerald-100 text-emerald-700', icon: Package, label: 'Montaje' }
            : { color: 'bg-orange-100 text-orange-700', icon: Truck, label: 'Desmontaje' }
    }

    const formatFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
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
                                <div className="p-2 bg-orange-100 rounded-xl">
                                    <Truck className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">
                                        Órdenes de Trabajo
                                    </h1>
                                    <p className="text-sm text-slate-600">
                                        {ordenes?.length || 0} órdenes
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                icon={<Calendar />}
                                onClick={() => navigate('/operaciones/calendario')}
                            >
                                Calendario
                            </Button>
                            {canManage && (
                                <Button
                                    variant="primary"
                                    icon={<Plus />}
                                    onClick={() => {/* TODO: Modal crear orden */}}
                                >
                                    Nueva Orden
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="container mx-auto px-6 py-6">

                {/* BARRA DE BÚSQUEDA Y FILTROS */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Búsqueda */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por cliente o ubicación..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                        </div>

                        {/* Botón filtros */}
                        <button
                            onClick={() => setShowFiltros(!showFiltros)}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
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
                                {/* Estado */}
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
                                        <option value="en_proceso">En Proceso</option>
                                        <option value="completado">Completado</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>

                                {/* Tipo */}
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

                                {/* Fecha desde */}
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

                                {/* Fecha hasta */}
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

                            {/* Limpiar filtros */}
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

                {/* LISTA DE ÓRDENES */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" text="Cargando órdenes..." />
                    </div>
                ) : ordenes?.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {ordenes.map((orden) => {
                                const estadoConfig = getEstadoConfig(orden.estado)
                                const tipoConfig = getTipoConfig(orden.tipo)
                                const EstadoIcon = estadoConfig.icon
                                const TipoIcon = tipoConfig.icon

                                return (
                                    <div
                                        key={orden.id}
                                        className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/operaciones/ordenes/${orden.id}`)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Icono tipo */}
                                                <div className={`p-3 rounded-xl ${tipoConfig.color}`}>
                                                    <TipoIcon className="w-6 h-6" />
                                                </div>

                                                {/* Info principal */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoConfig.color}`}>
                                                            {tipoConfig.label}
                                                        </span>
                                                        <span className="font-semibold text-slate-900">
                                                            #{orden.id}
                                                        </span>
                                                        <span className="text-slate-600">-</span>
                                                        <span className="text-slate-900">
                                                            {orden.cliente_nombre || 'Cliente'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatFecha(orden.fecha_programada)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {orden.ubicacion || 'Sin ubicación'}
                                                        </span>
                                                        {orden.equipo_count > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {orden.equipo_count} personas
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Estado y acciones */}
                                            <div className="flex items-center gap-4">
                                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${estadoConfig.color}`}>
                                                    <EstadoIcon className="w-4 h-4" />
                                                    {estadoConfig.label}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigate(`/operaciones/ordenes/${orden.id}`)
                                                    }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-5 h-5 text-slate-600" />
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
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Truck className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            No hay órdenes
                        </h3>
                        <p className="text-slate-600 mb-6">
                            {filtrosActivos
                                ? 'No se encontraron órdenes con los filtros aplicados'
                                : 'Las órdenes de trabajo aparecerán aquí'
                            }
                        </p>
                        {filtrosActivos && (
                            <Button
                                variant="secondary"
                                onClick={handleLimpiarFiltros}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
