// ============================================
// PÁGINA: DETALLE DE ORDEN DE TRABAJO
// Vista completa con acciones de modificación
// ============================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Truck,
    Package,
    Calendar,
    MapPin,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Edit3,
    Play,
    Square,
    AlertTriangle,
    Phone,
    Mail,
    FileText,
    RefreshCw,
    Car,
    User,
    ChevronDown,
    ChevronUp,
    Save,
    X,
    LogOut,
    RotateCcw,
    CircleDot
} from 'lucide-react'
import {
    useGetOrden,
    useGetElementosOrden,
    useCambiarEstadoOrden,
    useAsignarEquipo,
    useAsignarVehiculo,
    useUpdateOrden,
    useEjecutarSalida,
    useEjecutarRetorno
} from '../hooks/useOrdenesTrabajo'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { toast } from 'sonner'

// ============================================
// COMPONENTE: Modal de Asignación de Equipo
// ============================================
const ModalAsignarEquipo = ({ orden, onClose, onSave }) => {
    const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState(
        orden.equipo?.map(e => e.empleado_id) || []
    )
    const [responsableId, setResponsableId] = useState(orden.responsable_id || '')
    const [saving, setSaving] = useState(false)

    // TODO: Obtener lista de empleados desde API
    const empleadosDisponibles = [
        { id: 1, nombre: 'Juan Pérez', rol: 'Técnico' },
        { id: 2, nombre: 'María García', rol: 'Técnico' },
        { id: 3, nombre: 'Carlos López', rol: 'Supervisor' },
        { id: 4, nombre: 'Ana Martínez', rol: 'Técnico' }
    ]

    const handleToggleEmpleado = (empleadoId) => {
        setEmpleadosSeleccionados(prev =>
            prev.includes(empleadoId)
                ? prev.filter(id => id !== empleadoId)
                : [...prev, empleadoId]
        )
    }

    const handleGuardar = async () => {
        setSaving(true)
        try {
            await onSave({
                empleados: empleadosSeleccionados,
                responsable_id: responsableId || null
            })
            onClose()
        } catch (error) {
            console.error('Error al asignar equipo:', error)
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
                            Asignar Equipo de Trabajo
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Responsable */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Responsable de la Orden
                        </label>
                        <select
                            value={responsableId}
                            onChange={(e) => setResponsableId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        >
                            <option value="">Seleccionar responsable...</option>
                            {empleadosDisponibles.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nombre} - {emp.rol}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Lista de empleados */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Equipo Asignado
                        </label>
                        <div className="space-y-2">
                            {empleadosDisponibles.map(emp => (
                                <label
                                    key={emp.id}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                        empleadosSeleccionados.includes(emp.id)
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={empleadosSeleccionados.includes(emp.id)}
                                        onChange={() => handleToggleEmpleado(emp.id)}
                                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{emp.nombre}</p>
                                        <p className="text-sm text-slate-500">{emp.rol}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
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
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Modal de Asignación de Vehículo
// ============================================
const ModalAsignarVehiculo = ({ orden, onClose, onSave }) => {
    const [vehiculoId, setVehiculoId] = useState(orden.vehiculo_id || '')
    const [saving, setSaving] = useState(false)

    // TODO: Obtener lista de vehículos desde API
    const vehiculosDisponibles = [
        { id: 1, placa: 'ABC-123', tipo: 'Camión', capacidad: '3 ton' },
        { id: 2, placa: 'DEF-456', tipo: 'Furgón', capacidad: '1.5 ton' },
        { id: 3, placa: 'GHI-789', tipo: 'Camioneta', capacidad: '500 kg' }
    ]

    const handleGuardar = async () => {
        setSaving(true)
        try {
            await onSave({ vehiculo_id: vehiculoId || null })
            onClose()
        } catch (error) {
            console.error('Error al asignar vehículo:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Asignar Vehículo
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="space-y-2">
                        {vehiculosDisponibles.map(veh => (
                            <label
                                key={veh.id}
                                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                    vehiculoId === veh.id.toString()
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="vehiculo"
                                    value={veh.id}
                                    checked={vehiculoId === veh.id.toString()}
                                    onChange={(e) => setVehiculoId(e.target.value)}
                                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                                />
                                <Car className="w-5 h-5 text-slate-400" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{veh.placa}</p>
                                    <p className="text-sm text-slate-500">
                                        {veh.tipo} - {veh.capacidad}
                                    </p>
                                </div>
                            </label>
                        ))}
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
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Modal de Editar Orden
// ============================================
const ModalEditarOrden = ({ orden, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        fecha_programada: orden.fecha_programada?.split('T')[0] || '',
        hora_programada: orden.fecha_programada?.split('T')[1]?.substring(0, 5) || '08:00',
        notas: orden.notas || '',
        prioridad: orden.prioridad || 'normal'
    })
    const [saving, setSaving] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleGuardar = async () => {
        setSaving(true)
        try {
            const fechaCompleta = `${formData.fecha_programada}T${formData.hora_programada}:00`
            await onSave({
                fecha_programada: fechaCompleta,
                notas: formData.notas,
                prioridad: formData.prioridad
            })
            onClose()
        } catch (error) {
            console.error('Error al actualizar orden:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Editar Orden #{orden.id}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* Fecha */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Fecha Programada
                        </label>
                        <input
                            type="date"
                            name="fecha_programada"
                            value={formData.fecha_programada}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Hora */}
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
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                            placeholder="Notas adicionales..."
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
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE: Modal de Registrar Retorno
// ============================================
const ModalRegistrarRetorno = ({ orden, elementos, onClose, onSave }) => {
    const [retornos, setRetornos] = useState(
        elementos?.map(elem => ({
            alquiler_elemento_id: elem.id,
            elemento_nombre: elem.elemento_nombre || elem.nombre,
            serie_numero: elem.serie_numero,
            cantidad: elem.cantidad || 1,
            estado_retorno: 'bueno',
            costo_dano: 0,
            notas: ''
        })) || []
    )
    const [saving, setSaving] = useState(false)

    const handleEstadoChange = (index, estado) => {
        setRetornos(prev => {
            const updated = [...prev]
            updated[index] = {
                ...updated[index],
                estado_retorno: estado,
                costo_dano: estado === 'bueno' ? 0 : updated[index].costo_dano
            }
            return updated
        })
    }

    const handleCostoDanoChange = (index, costo) => {
        setRetornos(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], costo_dano: parseFloat(costo) || 0 }
            return updated
        })
    }

    const handleNotasChange = (index, notas) => {
        setRetornos(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], notas }
            return updated
        })
    }

    const handleGuardar = async () => {
        setSaving(true)
        try {
            await onSave(retornos.map(r => ({
                alquiler_elemento_id: r.alquiler_elemento_id,
                estado_retorno: r.estado_retorno,
                costo_dano: r.costo_dano,
                notas: r.notas
            })))
        } catch (error) {
            console.error('Error al registrar retorno:', error)
        } finally {
            setSaving(false)
        }
    }

    const totalDanos = retornos.reduce((sum, r) => sum + (r.costo_dano || 0), 0)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Registrar Retorno
                            </h3>
                            <p className="text-sm text-slate-500">
                                Orden #{orden.id} - {orden.cliente_nombre}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="space-y-4">
                        {retornos.map((retorno, index) => (
                            <div
                                key={retorno.alquiler_elemento_id}
                                className="border border-slate-200 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {retorno.elemento_nombre}
                                        </p>
                                        {retorno.serie_numero && (
                                            <p className="text-sm text-slate-500">
                                                Serie: {retorno.serie_numero}
                                            </p>
                                        )}
                                        <p className="text-sm text-slate-500">
                                            Cantidad: {retorno.cantidad}
                                        </p>
                                    </div>
                                </div>

                                {/* Estado de retorno */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Estado del Elemento
                                    </label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'bueno', label: 'Bueno', color: 'green' },
                                            { value: 'dañado', label: 'Dañado', color: 'yellow' },
                                            { value: 'perdido', label: 'Perdido', color: 'red' }
                                        ].map(opcion => (
                                            <button
                                                key={opcion.value}
                                                onClick={() => handleEstadoChange(index, opcion.value)}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                                    retorno.estado_retorno === opcion.value
                                                        ? opcion.color === 'green'
                                                            ? 'bg-green-100 border-green-500 text-green-700'
                                                            : opcion.color === 'yellow'
                                                            ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                                                            : 'bg-red-100 border-red-500 text-red-700'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {opcion.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Costo de daño (solo si está dañado o perdido) */}
                                {retorno.estado_retorno !== 'bueno' && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Costo del Daño ($)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={retorno.costo_dano}
                                            onChange={(e) => handleCostoDanoChange(index, e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                )}

                                {/* Notas */}
                                {retorno.estado_retorno !== 'bueno' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Notas
                                        </label>
                                        <input
                                            type="text"
                                            value={retorno.notas}
                                            onChange={(e) => handleNotasChange(index, e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                            placeholder="Descripción del daño..."
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Resumen */}
                    {totalDanos > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-700">
                                Total Daños: ${totalDanos.toLocaleString('es-CO')}
                            </p>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="orange"
                        icon={Save}
                        onClick={handleGuardar}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Confirmar Retorno'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL: OrdenDetallePage
// ============================================
export default function OrdenDetallePage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente', 'operaciones'])

    // ============================================
    // ESTADO LOCAL
    // ============================================
    const [showModalEquipo, setShowModalEquipo] = useState(false)
    const [showModalVehiculo, setShowModalVehiculo] = useState(false)
    const [showModalEditar, setShowModalEditar] = useState(false)
    const [showModalRetorno, setShowModalRetorno] = useState(false)
    const [expandElementos, setExpandElementos] = useState(true)
    const [ejecutandoSalida, setEjecutandoSalida] = useState(false)

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const { orden, isLoading, error, refetch } = useGetOrden(id)
    const { elementos, isLoading: loadingElementos } = useGetElementosOrden(id)

    // ============================================
    // HOOKS: Mutaciones
    // ============================================
    const cambiarEstado = useCambiarEstadoOrden()
    const asignarEquipo = useAsignarEquipo()
    const asignarVehiculo = useAsignarVehiculo()
    const actualizarOrden = useUpdateOrden()
    const ejecutarSalida = useEjecutarSalida()
    const ejecutarRetorno = useEjecutarRetorno()

    // ============================================
    // HANDLERS
    // ============================================
    const handleCambiarEstado = async (nuevoEstado) => {
        const mensajes = {
            confirmado: 'Orden confirmada',
            en_preparacion: 'Preparación iniciada',
            en_ruta: 'Orden en ruta',
            en_sitio: 'Equipo llegó al sitio',
            en_proceso: 'Trabajo iniciado',
            completado: 'Orden completada exitosamente',
            cancelado: 'Orden cancelada'
        }

        try {
            await cambiarEstado.mutateAsync({
                id: orden.id,
                data: { estado: nuevoEstado }
            })
            toast.success(mensajes[nuevoEstado] || `Estado cambiado a ${nuevoEstado}`)
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al cambiar estado')
        }
    }

    const handleAsignarEquipo = async (data) => {
        await asignarEquipo.mutateAsync({ id: orden.id, data })
        toast.success('Equipo asignado correctamente')
        refetch()
    }

    const handleAsignarVehiculo = async (data) => {
        await asignarVehiculo.mutateAsync({ id: orden.id, data })
        toast.success('Vehículo asignado correctamente')
        refetch()
    }

    const handleActualizarOrden = async (data) => {
        await actualizarOrden.mutateAsync({ id: orden.id, data })
        toast.success('Orden actualizada correctamente')
        refetch()
    }

    const handleEjecutarSalida = async () => {
        if (!confirm('¿Confirmar ejecución de salida? Esta acción cambiará el estado del alquiler a "activo" y marcará los elementos como despachados.')) {
            return
        }

        setEjecutandoSalida(true)
        try {
            await ejecutarSalida.mutateAsync({ id: orden.id, data: {} })
            toast.success('Salida ejecutada correctamente. Alquiler ahora activo.')
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al ejecutar salida')
        } finally {
            setEjecutandoSalida(false)
        }
    }

    const handleEjecutarRetorno = async (retornos) => {
        try {
            await ejecutarRetorno.mutateAsync({ id: orden.id, retornos })
            toast.success('Retorno registrado correctamente. Alquiler finalizado.')
            setShowModalRetorno(false)
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al registrar retorno')
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
            confirmado: {
                color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                icon: CheckCircle,
                label: 'Confirmado'
            },
            en_preparacion: {
                color: 'bg-purple-100 text-purple-700 border-purple-200',
                icon: Package,
                label: 'En Preparación'
            },
            en_ruta: {
                color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                icon: Truck,
                label: 'En Ruta'
            },
            en_sitio: {
                color: 'bg-amber-100 text-amber-700 border-amber-200',
                icon: MapPin,
                label: 'En Sitio'
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

    const getPrioridadConfig = (prioridad) => {
        const config = {
            baja: { color: 'bg-slate-100 text-slate-600', label: 'Baja' },
            normal: { color: 'bg-blue-100 text-blue-600', label: 'Normal' },
            alta: { color: 'bg-orange-100 text-orange-600', label: 'Alta' },
            urgente: { color: 'bg-red-100 text-red-600', label: 'Urgente' }
        }
        return config[prioridad] || config.normal
    }

    const formatFecha = (fecha) => {
        if (!fecha) return 'Sin fecha'
        return new Date(fecha).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // ============================================
    // RENDER: Loading / Error
    // ============================================
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Spinner size="lg" text="Cargando orden..." />
            </div>
        )
    }

    if (error || !orden) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        Error al cargar la orden
                    </h2>
                    <p className="text-slate-600 mb-4">
                        {error?.message || 'No se encontró la orden solicitada'}
                    </p>
                    <Button onClick={() => navigate('/operaciones/ordenes')}>
                        Volver a Órdenes
                    </Button>
                </div>
            </div>
        )
    }

    const estadoConfig = getEstadoConfig(orden.estado)
    const tipoConfig = getTipoConfig(orden.tipo)
    const prioridadConfig = getPrioridadConfig(orden.prioridad)
    const EstadoIcon = estadoConfig.icon
    const TipoIcon = tipoConfig.icon

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    return (
        <div className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/operaciones/ordenes')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${tipoConfig.color}`}>
                                    <TipoIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoConfig.color}`}>
                                            {tipoConfig.label}
                                        </span>
                                        <h1 className="text-xl font-bold text-slate-900">
                                            Orden #{orden.id}
                                        </h1>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        {orden.cliente_nombre || 'Cliente'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Badge de estado */}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${estadoConfig.color}`}>
                                <EstadoIcon className="w-5 h-5" />
                                <span className="font-medium">{estadoConfig.label}</span>
                            </div>
                            {canManage && (
                                <Button
                                    icon={Edit3}
                                    variant="secondary"
                                    onClick={() => setShowModalEditar(true)}
                                >
                                    Editar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* COLUMNA PRINCIPAL */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* INFO DEL EVENTO */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Información del Evento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-500">Fecha Programada</p>
                                        <p className="font-medium text-slate-900">
                                            {formatFecha(orden.fecha_programada)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-500">Ubicación</p>
                                        <p className="font-medium text-slate-900">
                                            {orden.direccion_evento || 'Sin dirección'}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {orden.ciudad_evento || 'Sin ciudad'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-500">Prioridad</p>
                                        <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${prioridadConfig.color}`}>
                                            {prioridadConfig.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-500">Alquiler</p>
                                        <p className="font-medium text-slate-900">
                                            #{orden.alquiler_id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {orden.notas && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 mb-1">Notas</p>
                                    <p className="text-slate-700">{orden.notas}</p>
                                </div>
                            )}
                        </div>

                        {/* INFO DEL CLIENTE */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Información del Cliente
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-100 rounded-full">
                                    <User className="w-6 h-6 text-slate-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900">
                                        {orden.cliente_nombre || 'Sin cliente'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                        {orden.cliente_telefono && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-4 h-4" />
                                                {orden.cliente_telefono}
                                            </span>
                                        )}
                                        {orden.cliente_email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-4 h-4" />
                                                {orden.cliente_email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ELEMENTOS DE LA ORDEN */}
                        <div className="bg-white rounded-xl border border-slate-200">
                            <button
                                onClick={() => setExpandElementos(!expandElementos)}
                                className="w-full p-6 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-slate-400" />
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Elementos ({elementos?.length || 0})
                                    </h2>
                                </div>
                                {expandElementos ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>
                            {expandElementos && (
                                <div className="px-6 pb-6">
                                    {loadingElementos ? (
                                        <div className="py-4 text-center">
                                            <Spinner size="sm" />
                                        </div>
                                    ) : elementos?.length > 0 ? (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                                                            Elemento
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                                                            Cantidad
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                                                            Estado
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {elementos.map((elem) => (
                                                        <tr key={elem.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium text-slate-900">
                                                                    {elem.elemento_nombre || elem.nombre}
                                                                </p>
                                                                {elem.serie_numero && (
                                                                    <p className="text-sm text-slate-500">
                                                                        Serie: {elem.serie_numero}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {elem.cantidad || 1}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                    elem.estado === 'completado'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : elem.estado === 'con_problema'
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                    {elem.estado || 'pendiente'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-4">
                                            No hay elementos asignados a esta orden
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA LATERAL */}
                    <div className="space-y-6">

                        {/* ACCIONES DE ESTADO */}
                        {canManage && orden.estado !== 'completado' && orden.estado !== 'cancelado' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                    Acciones
                                </h3>
                                <div className="space-y-3">
                                    {/* Flujo: pendiente -> confirmado -> en_preparacion -> en_ruta -> en_sitio -> en_proceso -> completado */}

                                    {orden.estado === 'pendiente' && (
                                        <Button
                                            color="blue"
                                            icon={CheckCircle}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('confirmado')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Confirmar Orden
                                        </Button>
                                    )}

                                    {orden.estado === 'confirmado' && (
                                        <Button
                                            color="blue"
                                            icon={Package}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_preparacion')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Iniciar Preparación
                                        </Button>
                                    )}

                                    {orden.estado === 'en_preparacion' && orden.tipo === 'montaje' && (
                                        <>
                                            <Button
                                                color="green"
                                                icon={LogOut}
                                                className="w-full"
                                                onClick={handleEjecutarSalida}
                                                disabled={ejecutandoSalida || !elementos?.length}
                                            >
                                                {ejecutandoSalida ? 'Ejecutando...' : 'Ejecutar Salida'}
                                            </Button>
                                            {!elementos?.length && (
                                                <p className="text-xs text-amber-600 text-center">
                                                    No hay elementos asignados
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {orden.estado === 'en_preparacion' && orden.tipo === 'desmontaje' && (
                                        <Button
                                            color="blue"
                                            icon={Truck}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_ruta')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Enviar en Ruta
                                        </Button>
                                    )}

                                    {orden.estado === 'en_ruta' && (
                                        <Button
                                            color="blue"
                                            icon={MapPin}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_sitio')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Llegó al Sitio
                                        </Button>
                                    )}

                                    {orden.estado === 'en_sitio' && (
                                        <Button
                                            color="blue"
                                            icon={Play}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_proceso')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Iniciar Trabajo
                                        </Button>
                                    )}

                                    {orden.estado === 'en_proceso' && orden.tipo === 'montaje' && (
                                        <Button
                                            color="green"
                                            icon={CheckCircle}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('completado')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Marcar Completado
                                        </Button>
                                    )}

                                    {/* Para desmontaje en_sitio o en_proceso: Registrar Retorno */}
                                    {orden.tipo === 'desmontaje' && ['en_sitio', 'en_proceso'].includes(orden.estado) && (
                                        <Button
                                            color="orange"
                                            icon={RotateCcw}
                                            className="w-full"
                                            onClick={() => setShowModalRetorno(true)}
                                        >
                                            Registrar Retorno
                                        </Button>
                                    )}

                                    {/* Botón cancelar siempre disponible excepto en completado/cancelado */}
                                    <Button
                                        color="red"
                                        icon={XCircle}
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleCambiarEstado('cancelado')}
                                        disabled={cambiarEstado.isPending}
                                    >
                                        Cancelar Orden
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* EQUIPO ASIGNADO */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Equipo de Trabajo
                                </h3>
                                {canManage && (
                                    <button
                                        onClick={() => setShowModalEquipo(true)}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        {orden.equipo?.length > 0 ? 'Editar' : 'Asignar'}
                                    </button>
                                )}
                            </div>
                            {orden.equipo?.length > 0 ? (
                                <div className="space-y-3">
                                    {orden.equipo.map((miembro, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                                        >
                                            <div className="p-2 bg-white rounded-full">
                                                <User className="w-4 h-4 text-slate-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">
                                                    {miembro.nombre}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {miembro.rol}
                                                </p>
                                            </div>
                                            {miembro.es_responsable && (
                                                <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                                    Responsable
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">
                                        Sin equipo asignado
                                    </p>
                                    {canManage && (
                                        <button
                                            onClick={() => setShowModalEquipo(true)}
                                            className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            Asignar equipo
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* VEHÍCULO ASIGNADO */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Vehículo
                                </h3>
                                {canManage && (
                                    <button
                                        onClick={() => setShowModalVehiculo(true)}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        {orden.vehiculo_placa ? 'Cambiar' : 'Asignar'}
                                    </button>
                                )}
                            </div>
                            {orden.vehiculo_placa ? (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="p-2 bg-white rounded-full">
                                        <Car className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {orden.vehiculo_placa}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {orden.vehiculo_tipo || 'Vehículo'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">
                                        Sin vehículo asignado
                                    </p>
                                    {canManage && (
                                        <button
                                            onClick={() => setShowModalVehiculo(true)}
                                            className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            Asignar vehículo
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALES */}
            {showModalEquipo && (
                <ModalAsignarEquipo
                    orden={orden}
                    onClose={() => setShowModalEquipo(false)}
                    onSave={handleAsignarEquipo}
                />
            )}
            {showModalVehiculo && (
                <ModalAsignarVehiculo
                    orden={orden}
                    onClose={() => setShowModalVehiculo(false)}
                    onSave={handleAsignarVehiculo}
                />
            )}
            {showModalEditar && (
                <ModalEditarOrden
                    orden={orden}
                    onClose={() => setShowModalEditar(false)}
                    onSave={handleActualizarOrden}
                />
            )}
            {showModalRetorno && (
                <ModalRegistrarRetorno
                    orden={orden}
                    elementos={elementos}
                    onClose={() => setShowModalRetorno(false)}
                    onSave={handleEjecutarRetorno}
                />
            )}
        </div>
    )
}
