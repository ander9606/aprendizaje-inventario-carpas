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
    RefreshCw,
    X,
    Save,
    Wrench,
    ArrowRightLeft,
    ClipboardCheck,
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

/**
 * OrdenesTrabajoPage
 *
 * Lista de órdenes de trabajo con:
 * - Filtros por estado, tipo, fecha
 * - Búsqueda por cliente o ubicación
 * - Vista de lista con detalles
 */
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
                elementos: [] // Por ahora vacío, se puede agregar selección de elementos después
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
        ...(filtros.fecha_hasta && { fecha_hasta: filtros.fecha_hasta })
    }

    const { ordenes, isLoading, refetch } = useGetOrdenes(queryParams)
    const crearOrdenManual = useCrearOrdenManual()

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
                        {canManage && (
                            <Button
                                icon={Plus}
                                color="orange"
                                onClick={() => setShowModalNuevaOrden(true)}
                            >
                                Nueva Orden
                            </Button>
                        )}
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
                                                            {orden.ciudad_evento || 'Sin ciudad'}
                                                            {orden.direccion_evento ? ` - ${orden.direccion_evento}` : ''}
                                                        </span>
                                                        {orden.total_equipo > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {orden.total_equipo} personas
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Badge estado */}
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${estadoConfig.color}`}>
                                                <EstadoIcon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{estadoConfig.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                            No hay órdenes de trabajo
                        </h3>
                        <p className="text-slate-600 mb-4">
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
            </div>

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
