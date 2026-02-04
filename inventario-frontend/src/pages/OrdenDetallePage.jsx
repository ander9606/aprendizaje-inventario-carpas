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
    Clock,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Edit3,
    Play,
    AlertTriangle,
    Phone,
    Mail,
    FileText,
    RefreshCw,
    User,
    ChevronDown,
    ChevronUp,
    Save,
    X,
    LogOut,
    RotateCcw,
    Box,
    Hash
} from 'lucide-react'
import {
    useGetOrden,
    useGetElementosOrden,
    useGetElementosDisponibles,
    usePrepararElementos,
    useCambiarEstadoOrden,
    useAsignarEquipo,
    useUpdateOrden,
    useEjecutarSalida,
    useEjecutarRetorno
} from '../hooks/useOrdenesTrabajo'
import { useGetEmpleadosCampo } from '../hooks/useEmpleados'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { toast } from 'sonner'

// ============================================
// COMPONENTE: Modal de Asignación de Responsable
// ============================================
const ModalAsignarResponsable = ({ orden, onClose, onSave }) => {
    // Inicializar con responsable actual (primer miembro del equipo)
    const responsableActual = orden.equipo?.find(e => e.rol_en_orden === 'responsable' || e.es_responsable)
        || orden.equipo?.[0]
    const [responsableId, setResponsableId] = useState(
        responsableActual?.empleado_id?.toString() || responsableActual?.id?.toString() || ''
    )
    const [saving, setSaving] = useState(false)

    // Obtener empleados disponibles desde API
    const fechaOrden = orden.fecha_programada?.split('T')[0] || null
    const { empleados: empleadosDisponibles, isLoading: loadingEmpleados } = useGetEmpleadosCampo(fechaOrden)

    const handleGuardar = async () => {
        if (!responsableId) return
        setSaving(true)
        try {
            await onSave({
                empleados: [{ empleado_id: parseInt(responsableId), rol_en_orden: 'responsable' }]
            })
            onClose()
        } catch (error) {
            console.error('Error al asignar responsable:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Asignar Responsable
                            </h3>
                            <p className="text-sm text-slate-500">
                                Persona encargada de esta orden
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
                    {loadingEmpleados ? (
                        <div className="py-8 text-center">
                            <Spinner size="sm" text="Cargando empleados..." />
                        </div>
                    ) : empleadosDisponibles?.length > 0 ? (
                        <div className="space-y-2">
                            {empleadosDisponibles.map(emp => (
                                <label
                                    key={emp.id}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                        responsableId === emp.id.toString()
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="responsable"
                                        value={emp.id}
                                        checked={responsableId === emp.id.toString()}
                                        onChange={(e) => setResponsableId(e.target.value)}
                                        className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                                    />
                                    <div className="p-2 bg-slate-100 rounded-full">
                                        <User className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">
                                            {emp.nombre} {emp.apellido || ''}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {emp.rol_empleado || emp.cargo || 'Empleado'}
                                            {emp.telefono ? ` - ${emp.telefono}` : ''}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500">
                            <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p>No hay empleados disponibles</p>
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
                        disabled={saving || !responsableId}
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
// COMPONENTE: Modal de Asignación de Inventario
// Permite al operador asignar series/lotes reales
// a elementos que no tienen inventario asignado
// ============================================
const ModalAsignarInventario = ({ ordenId, elementosPendientes, onClose, onSave }) => {
    const { disponibles, isLoading } = useGetElementosDisponibles(ordenId)
    const [seleccion, setSeleccion] = useState({}) // { elemento_id: { serie_id?, lote_id?, cantidad? } }
    const [saving, setSaving] = useState(false)

    // Mapear disponibles por elemento_id para acceso rápido
    const disponiblesPorElemento = {}
    if (disponibles?.productos) {
        for (const producto of disponibles.productos) {
            for (const comp of (producto.componentes || [])) {
                disponiblesPorElemento[comp.elemento_id] = comp
            }
        }
    }

    const handleSeleccionarSerie = (elementoId, serieId) => {
        setSeleccion(prev => ({
            ...prev,
            [elementoId]: serieId
                ? { serie_id: serieId, lote_id: null, cantidad: 1 }
                : undefined
        }))
    }

    const handleSeleccionarLote = (elementoId, loteId, cantidadMax) => {
        setSeleccion(prev => {
            const actual = prev[elementoId]
            if (actual?.lote_id === loteId) {
                // Deseleccionar
                return { ...prev, [elementoId]: undefined }
            }
            return {
                ...prev,
                [elementoId]: { serie_id: null, lote_id: loteId, cantidad: Math.min(cantidadMax, elementosPendientes.find(e => e.elemento_id === elementoId)?.cantidad || 1) }
            }
        })
    }

    const handleCantidadLote = (elementoId, cantidad) => {
        setSeleccion(prev => ({
            ...prev,
            [elementoId]: { ...prev[elementoId], cantidad: Math.max(1, cantidad) }
        }))
    }

    const todosAsignados = elementosPendientes.every(ep => seleccion[ep.elemento_id])

    const handleGuardar = async () => {
        const elementos = Object.entries(seleccion)
            .filter(([, val]) => val)
            .map(([elementoId, val]) => ({
                elemento_id: parseInt(elementoId),
                serie_id: val.serie_id || null,
                lote_id: val.lote_id || null,
                cantidad: val.cantidad || 1
            }))

        if (!elementos.length) {
            toast.error('Selecciona al menos un elemento del inventario')
            return
        }

        setSaving(true)
        try {
            await onSave(elementos)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al asignar inventario')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Box className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Asignar Inventario</h2>
                                <p className="text-sm text-slate-500">
                                    {elementosPendientes.length} elemento(s) sin inventario asignado
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="py-8 text-center">
                            <Spinner size="md" text="Buscando inventario disponible..." />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {elementosPendientes.map((elem) => {
                                const info = disponiblesPorElemento[elem.elemento_id]
                                const disponiblesItems = info?.disponibles || []
                                const series = disponiblesItems.filter(d => d.tipo === 'serie')
                                const lotes = disponiblesItems.filter(d => d.tipo === 'lote')
                                const selActual = seleccion[elem.elemento_id]

                                return (
                                    <div key={elem.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                        {/* Elemento header */}
                                        <div className={`px-4 py-3 flex items-center justify-between ${
                                            selActual ? 'bg-green-50 border-b border-green-200' : 'bg-slate-50 border-b border-slate-200'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-slate-500" />
                                                <span className="font-medium text-slate-900">
                                                    {elem.elemento_nombre || elem.nombre}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    (cant: {elem.cantidad || 1})
                                                </span>
                                            </div>
                                            {selActual && (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>

                                        {/* Opciones disponibles */}
                                        <div className="p-3">
                                            {disponiblesItems.length === 0 ? (
                                                <p className="text-sm text-red-600 flex items-center gap-2 py-2">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    No hay inventario disponible para este elemento
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {/* Series disponibles */}
                                                    {series.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-500 uppercase mb-1.5">
                                                                Series disponibles
                                                            </p>
                                                            <div className="space-y-1">
                                                                {series.map(serie => (
                                                                    <label
                                                                        key={serie.id}
                                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                                            selActual?.serie_id === serie.id
                                                                                ? 'bg-green-50 border border-green-200'
                                                                                : 'hover:bg-slate-50 border border-transparent'
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={`elem-${elem.elemento_id}`}
                                                                            checked={selActual?.serie_id === serie.id}
                                                                            onChange={() => handleSeleccionarSerie(elem.elemento_id, serie.id)}
                                                                            className="text-green-600"
                                                                        />
                                                                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span className="text-sm font-medium text-slate-800">
                                                                            {serie.identificador}
                                                                        </span>
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                                            serie.estado === 'nuevo' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                                        }`}>
                                                                            {serie.estado}
                                                                        </span>
                                                                        {serie.ubicacion && (
                                                                            <span className="text-xs text-slate-400 ml-auto">
                                                                                {serie.ubicacion}
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Lotes disponibles */}
                                                    {lotes.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-500 uppercase mb-1.5">
                                                                Lotes disponibles
                                                            </p>
                                                            <div className="space-y-1">
                                                                {lotes.map(lote => (
                                                                    <label
                                                                        key={lote.id}
                                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                                            selActual?.lote_id === lote.id
                                                                                ? 'bg-green-50 border border-green-200'
                                                                                : 'hover:bg-slate-50 border border-transparent'
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={`elem-${elem.elemento_id}`}
                                                                            checked={selActual?.lote_id === lote.id}
                                                                            onChange={() => handleSeleccionarLote(elem.elemento_id, lote.id, lote.cantidad)}
                                                                            className="text-green-600"
                                                                        />
                                                                        <Box className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span className="text-sm font-medium text-slate-800">
                                                                            {lote.identificador}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">
                                                                            Disp: {lote.cantidad}
                                                                        </span>
                                                                        {selActual?.lote_id === lote.id && (
                                                                            <div className="flex items-center gap-1 ml-auto">
                                                                                <span className="text-xs text-slate-500">Cant:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min={1}
                                                                                    max={lote.cantidad}
                                                                                    value={selActual.cantidad}
                                                                                    onChange={(e) => handleCantidadLote(elem.elemento_id, parseInt(e.target.value) || 1)}
                                                                                    className="w-16 px-2 py-0.5 border border-slate-300 rounded text-sm text-center"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {lote.ubicacion && !selActual?.lote_id === lote.id && (
                                                                            <span className="text-xs text-slate-400 ml-auto">
                                                                                {lote.ubicacion}
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        {Object.values(seleccion).filter(Boolean).length} de {elementosPendientes.length} asignados
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            color="green"
                            icon={CheckCircle}
                            onClick={handleGuardar}
                            disabled={saving || !todosAsignados}
                        >
                            {saving ? 'Asignando...' : 'Confirmar Asignación'}
                        </Button>
                    </div>
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
    const [showModalResponsable, setShowModalResponsable] = useState(false)
    const [showModalEditar, setShowModalEditar] = useState(false)
    const [showModalRetorno, setShowModalRetorno] = useState(false)
    const [showModalInventario, setShowModalInventario] = useState(false)
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
    const actualizarOrden = useUpdateOrden()
    const prepararElementos = usePrepararElementos()
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

    const handleAsignarResponsable = async (data) => {
        await asignarEquipo.mutateAsync({ id: orden.id, data })
        toast.success('Responsable asignado correctamente')
        refetch()
    }

    const handleActualizarOrden = async (data) => {
        await actualizarOrden.mutateAsync({ id: orden.id, data })
        toast.success('Orden actualizada correctamente')
        refetch()
    }

    const handleAsignarInventario = async (elementosSeleccionados) => {
        await prepararElementos.mutateAsync({ ordenId: orden.id, elementos: elementosSeleccionados })
        toast.success('Inventario asignado correctamente')
        setShowModalInventario(false)
        refetch()
    }

    const handleEjecutarSalida = async () => {
        if (!confirm('¿Confirmar ejecución de salida? Esta acción cambiará el estado del alquiler a "activo" y marcará los elementos como despachados.')) {
            return
        }

        setEjecutandoSalida(true)
        try {
            await ejecutarSalida.mutateAsync({ ordenId: orden.id, datos: {} })
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
            await ejecutarRetorno.mutateAsync({ ordenId: orden.id, retornos })
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
            <div className="flex justify-center py-12">
                <Spinner size="lg" text="Cargando orden..." />
            </div>
        )
    }

    if (error || !orden) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
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
    // HELPERS: Progreso del flujo
    // ============================================
    const tieneResponsable = orden.equipo?.length > 0

    const getPasosFlujo = () => {
        if (orden.tipo === 'montaje') {
            return [
                { key: 'pendiente', label: 'Pendiente', short: 'Pend.' },
                { key: 'confirmado', label: 'Confirmado', short: 'Conf.' },
                { key: 'en_preparacion', label: 'Preparación', short: 'Prep.' },
                { key: 'en_ruta', label: 'En Ruta', short: 'Ruta' },
                { key: 'en_sitio', label: 'En Sitio', short: 'Sitio' },
                { key: 'en_proceso', label: 'En Proceso', short: 'Proc.' },
                { key: 'completado', label: 'Completado', short: 'Listo' }
            ]
        }
        return [
            { key: 'pendiente', label: 'Pendiente', short: 'Pend.' },
            { key: 'confirmado', label: 'Confirmado', short: 'Conf.' },
            { key: 'en_preparacion', label: 'Preparación', short: 'Prep.' },
            { key: 'en_ruta', label: 'En Ruta', short: 'Ruta' },
            { key: 'en_sitio', label: 'En Sitio', short: 'Sitio' },
            { key: 'completado', label: 'Completado', short: 'Listo' }
        ]
    }

    const pasos = getPasosFlujo()
    const pasoActualIndex = pasos.findIndex(p => p.key === orden.estado)
    const esCancelado = orden.estado === 'cancelado'
    const esCompletado = orden.estado === 'completado'

    // Detectar elementos sin inventario asignado
    const elementosPendientesInv = (elementos || []).filter(
        e => !e.serie_id && !e.lote_id
    )
    const hayElementosSinInventario = elementosPendientesInv.length > 0

    const getDescripcionEstado = () => {
        const desc = {
            pendiente: 'Esta orden está pendiente de confirmación. Asigna un responsable y confirma para iniciar.',
            confirmado: 'Orden confirmada. Inicia la preparación de los elementos necesarios.',
            en_preparacion: orden.tipo === 'montaje'
                ? 'Preparando elementos para despacho. Cuando todo esté listo, ejecuta la salida.'
                : 'Preparando para el desmontaje. Cuando esté listo, envía al equipo en ruta.',
            en_ruta: 'El equipo está en camino al sitio del evento.',
            en_sitio: orden.tipo === 'montaje'
                ? 'El equipo llegó al sitio. Inicia el trabajo de montaje.'
                : 'El equipo llegó al sitio. Realiza el desmontaje y registra el retorno.',
            en_proceso: orden.tipo === 'montaje'
                ? 'Montaje en curso. Marca como completado cuando termine.'
                : 'Desmontaje en curso. Registra el retorno de los elementos.',
            completado: 'Esta orden ha sido completada exitosamente.',
            cancelado: 'Esta orden fue cancelada.'
        }
        return desc[orden.estado] || ''
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/operaciones/ordenes')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
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
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Orden #{orden.id}
                                    </h1>
                                </div>
                                <p className="text-slate-500 mt-0.5">
                                    {orden.cliente_nombre || 'Cliente'}
                                    {orden.evento_nombre ? ` — ${orden.evento_nombre}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${estadoConfig.color}`}>
                            <EstadoIcon className="w-5 h-5" />
                            <span className="font-medium">{estadoConfig.label}</span>
                        </div>
                        {canManage && !esCompletado && !esCancelado && (
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

            {/* BARRA DE PROGRESO */}
            {!esCancelado && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex items-center justify-between">
                        {pasos.map((paso, idx) => {
                            const esActual = paso.key === orden.estado
                            const esCompletadoPaso = idx < pasoActualIndex || esCompletado
                            return (
                                <div key={paso.key} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                            esActual
                                                ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                                                : esCompletadoPaso
                                                ? 'bg-green-500 text-white'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {esCompletadoPaso && !esActual ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                        <span className={`text-[10px] mt-1 text-center leading-tight ${
                                            esActual ? 'font-bold text-orange-600' : esCompletadoPaso ? 'text-green-600' : 'text-slate-400'
                                        }`}>
                                            <span className="hidden sm:inline">{paso.label}</span>
                                            <span className="sm:hidden">{paso.short}</span>
                                        </span>
                                    </div>
                                    {idx < pasos.length - 1 && (
                                        <div className={`h-0.5 flex-1 -mt-4 mx-1 ${
                                            idx < pasoActualIndex ? 'bg-green-400' : 'bg-slate-200'
                                        }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ESTADO CANCELADO */}
            {esCancelado && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-700 font-medium">Esta orden fue cancelada</p>
                </div>
            )}

            {/* CONTENIDO */}
            <div>
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
                                {orden.alquiler_id && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500">Alquiler</p>
                                            <p className="font-medium text-slate-900">
                                                #{orden.alquiler_id}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {orden.notas && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 mb-1">Notas</p>
                                    <p className="text-slate-700">{orden.notas}</p>
                                </div>
                            )}
                        </div>

                        {/* INFO DEL CLIENTE */}
                        {orden.cliente_nombre && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                    Cliente
                                </h2>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-full">
                                        <User className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">
                                            {orden.cliente_nombre}
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
                        )}

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
                                                    {elementos.map((elem) => {
                                                        const sinInventario = !elem.serie_id && !elem.lote_id
                                                        return (
                                                            <tr key={elem.id} className={sinInventario ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                                                                <td className="px-4 py-3">
                                                                    <p className="font-medium text-slate-900">
                                                                        {elem.elemento_nombre || elem.nombre}
                                                                    </p>
                                                                    {elem.numero_serie && (
                                                                        <p className="text-sm text-slate-500">
                                                                            Serie: {elem.numero_serie}
                                                                        </p>
                                                                    )}
                                                                    {elem.lote_numero && (
                                                                        <p className="text-sm text-slate-500">
                                                                            Lote: {elem.lote_numero}
                                                                        </p>
                                                                    )}
                                                                    {sinInventario && !esCompletado && !esCancelado && (
                                                                        <p className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            Sin inventario asignado
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {elem.cantidad || 1}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                        elem.estado === 'completado' || elem.estado === 'retornado'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : elem.estado === 'con_problema' || elem.estado === 'incidencia'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : elem.estado === 'preparado' || elem.estado === 'cargado' || elem.estado === 'instalado'
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                        {elem.estado || 'pendiente'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-4">
                                            No hay elementos asignados a esta orden
                                        </p>
                                    )}

                                    {/* Botón asignar inventario si hay elementos pendientes */}
                                    {hayElementosSinInventario && canManage && !esCompletado && !esCancelado && (
                                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                                    <p className="text-sm text-amber-700">
                                                        <span className="font-medium">{elementosPendientesInv.length} elemento(s)</span> sin inventario del almacen
                                                    </p>
                                                </div>
                                                <Button
                                                    color="orange"
                                                    icon={Box}
                                                    size="sm"
                                                    onClick={() => setShowModalInventario(true)}
                                                >
                                                    Asignar Inventario
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA LATERAL */}
                    <div className="space-y-6">

                        {/* SIGUIENTE PASO + ACCIONES */}
                        {canManage && !esCompletado && !esCancelado && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Descripción del estado actual */}
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <p className="text-sm text-slate-600">
                                        {getDescripcionEstado()}
                                    </p>
                                </div>

                                <div className="p-6 space-y-3">
                                    {/* Advertencia sin responsable */}
                                    {!tieneResponsable && ['pendiente', 'confirmado'].includes(orden.estado) && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm text-amber-700 font-medium">Sin responsable</p>
                                                <button
                                                    onClick={() => setShowModalResponsable(true)}
                                                    className="text-xs text-amber-600 hover:text-amber-700 underline"
                                                >
                                                    Asignar ahora
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* === ACCIÓN PRINCIPAL por estado === */}

                                    {orden.estado === 'pendiente' && (
                                        <Button
                                            color="blue"
                                            icon={CheckCircle}
                                            className="w-full"
                                            onClick={() => {
                                                if (!tieneResponsable) {
                                                    if (!confirm('No hay responsable asignado. ¿Deseas confirmar la orden de todas formas?')) return
                                                }
                                                handleCambiarEstado('confirmado')
                                            }}
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
                                            {hayElementosSinInventario ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-amber-700 font-medium">
                                                                No se puede despachar
                                                            </p>
                                                            <p className="text-xs text-amber-600 mt-0.5">
                                                                {elementosPendientesInv.length} elemento(s) sin inventario asignado del almacen
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        color="orange"
                                                        icon={Box}
                                                        className="w-full"
                                                        onClick={() => setShowModalInventario(true)}
                                                    >
                                                        Asignar Inventario
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    color="green"
                                                    icon={LogOut}
                                                    className="w-full"
                                                    onClick={handleEjecutarSalida}
                                                    disabled={ejecutandoSalida || !elementos?.length}
                                                >
                                                    {ejecutandoSalida ? 'Ejecutando...' : 'Ejecutar Salida'}
                                                </Button>
                                            )}
                                            {!elementos?.length && !hayElementosSinInventario && (
                                                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                                    <p className="text-xs text-amber-700">
                                                        Asigna elementos antes de ejecutar la salida
                                                    </p>
                                                </div>
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

                                    {orden.estado === 'en_sitio' && orden.tipo === 'montaje' && (
                                        <Button
                                            color="blue"
                                            icon={Play}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_proceso')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Iniciar Montaje
                                        </Button>
                                    )}

                                    {orden.estado === 'en_sitio' && orden.tipo === 'desmontaje' && (
                                        <Button
                                            color="orange"
                                            icon={RotateCcw}
                                            className="w-full"
                                            onClick={() => setShowModalRetorno(true)}
                                        >
                                            Registrar Retorno
                                        </Button>
                                    )}

                                    {orden.estado === 'en_proceso' && orden.tipo === 'montaje' && (
                                        <Button
                                            color="green"
                                            icon={CheckCircle}
                                            className="w-full"
                                            onClick={() => {
                                                if (!confirm('¿Marcar esta orden como completada?')) return
                                                handleCambiarEstado('completado')
                                            }}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Marcar Completado
                                        </Button>
                                    )}

                                    {orden.estado === 'en_proceso' && orden.tipo === 'desmontaje' && (
                                        <Button
                                            color="orange"
                                            icon={RotateCcw}
                                            className="w-full"
                                            onClick={() => setShowModalRetorno(true)}
                                        >
                                            Registrar Retorno
                                        </Button>
                                    )}

                                    {/* Separador antes de cancelar */}
                                    <div className="border-t border-slate-200 pt-3">
                                        <Button
                                            color="red"
                                            icon={XCircle}
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                if (!confirm('¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer.')) return
                                                handleCambiarEstado('cancelado')
                                            }}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Cancelar Orden
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ESTADO COMPLETADO */}
                        {esCompletado && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                <p className="font-semibold text-green-800">Orden Completada</p>
                                <p className="text-sm text-green-600 mt-1">
                                    Esta orden fue completada exitosamente
                                </p>
                            </div>
                        )}

                        {/* RESPONSABLE ASIGNADO */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Responsable
                                </h3>
                                {canManage && !esCompletado && !esCancelado && (
                                    <button
                                        onClick={() => setShowModalResponsable(true)}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        {tieneResponsable ? 'Cambiar' : 'Asignar'}
                                    </button>
                                )}
                            </div>
                            {tieneResponsable ? (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="p-2 bg-white rounded-full">
                                        <User className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {orden.equipo[0].nombre} {orden.equipo[0].apellido || ''}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {orden.equipo[0].rol_empleado || orden.equipo[0].cargo || 'Empleado'}
                                        </p>
                                        {orden.equipo[0].telefono && (
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                {orden.equipo[0].telefono}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">
                                        Sin responsable asignado
                                    </p>
                                    {canManage && !esCompletado && !esCancelado && (
                                        <button
                                            onClick={() => setShowModalResponsable(true)}
                                            className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            Asignar responsable
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALES */}
            {showModalResponsable && (
                <ModalAsignarResponsable
                    orden={orden}
                    onClose={() => setShowModalResponsable(false)}
                    onSave={handleAsignarResponsable}
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
            {showModalInventario && (
                <ModalAsignarInventario
                    ordenId={orden.id}
                    elementosPendientes={elementosPendientesInv}
                    onClose={() => setShowModalInventario(false)}
                    onSave={handleAsignarInventario}
                />
            )}
        </div>
    )
}
