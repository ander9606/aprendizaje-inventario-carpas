// ============================================
// COMPONENTE: EventoFormModal
// Modal para crear/editar eventos
// ============================================

import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, FileText, Save } from 'lucide-react'
import Button from '../common/Button'
import { useGetClientes } from '../../hooks/UseClientes'
import { useGetCiudadesActivas } from '../../hooks/UseCiudades'
import { useGetUbicacionesActivas } from '../../hooks/Useubicaciones'

/**
 * Modal para crear o editar un evento
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onSave - Recibe los datos del evento
 * @param {Object} props.evento - Evento a editar (opcional)
 * @param {number} props.clientePreseleccionado - ID del cliente preseleccionado
 */
const EventoFormModal = ({
    isOpen,
    onClose,
    onSave,
    evento = null,
    clientePreseleccionado = null
}) => {
    const [formData, setFormData] = useState({
        cliente_id: '',
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        direccion: '',
        ciudad_id: '',
        notas: ''
    })
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState({})

    const { clientes, isLoading: loadingClientes } = useGetClientes()
    const { ciudades, isLoading: loadingCiudades } = useGetCiudadesActivas()
    const { ubicaciones, isLoading: loadingUbicaciones } = useGetUbicacionesActivas()

    // Filtrar ubicaciones por ciudad seleccionada
    const ciudadSeleccionada = ciudades.find(c => c.id === parseInt(formData.ciudad_id))
    const ubicacionesFiltradas = ciudadSeleccionada
        ? ubicaciones.filter(u => u.ciudad === ciudadSeleccionada.nombre)
        : []

    const isEditing = !!evento

    // Inicializar formulario
    useEffect(() => {
        if (evento) {
            setFormData({
                cliente_id: evento.cliente_id || '',
                nombre: evento.nombre || '',
                descripcion: evento.descripcion || '',
                fecha_inicio: evento.fecha_inicio ? evento.fecha_inicio.split('T')[0] : '',
                fecha_fin: evento.fecha_fin ? evento.fecha_fin.split('T')[0] : '',
                direccion: evento.direccion || '',
                ciudad_id: evento.ciudad_id || '',
                notas: evento.notas || ''
            })
        } else {
            setFormData({
                cliente_id: clientePreseleccionado || '',
                nombre: '',
                descripcion: '',
                fecha_inicio: '',
                fecha_fin: '',
                direccion: '',
                ciudad_id: '',
                notas: ''
            })
        }
        setErrors({})
    }, [evento, clientePreseleccionado, isOpen])

    // Manejar cambios
    const handleChange = (e) => {
        const { name, value } = e.target

        // Si cambia fecha_inicio, auto-completar fecha_fin con el mismo valor
        if (name === 'fecha_inicio') {
            setFormData(prev => ({
                ...prev,
                fecha_inicio: value,
                // Solo auto-completar si fecha_fin está vacía o es igual a la fecha_inicio anterior
                fecha_fin: (!prev.fecha_fin || prev.fecha_fin === prev.fecha_inicio) ? value : prev.fecha_fin
            }))
        }
        // Si cambia la ciudad, limpiar dirección
        else if (name === 'ciudad_id') {
            setFormData(prev => ({
                ...prev,
                ciudad_id: value,
                direccion: ''
            }))
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }

        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    // Manejar selección de ubicación
    const handleUbicacionChange = (e) => {
        const ubicacionId = e.target.value
        const ubicacion = ubicacionesFiltradas.find(u => u.id === parseInt(ubicacionId))
        setFormData(prev => ({
            ...prev,
            direccion: ubicacion ? ubicacion.direccion : ''
        }))
    }

    // Validar formulario
    const validar = () => {
        const newErrors = {}

        if (!formData.cliente_id) {
            newErrors.cliente_id = 'El cliente es obligatorio'
        }
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio'
        }
        if (!formData.fecha_inicio) {
            newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
        }
        if (!formData.fecha_fin) {
            newErrors.fecha_fin = 'La fecha de fin es obligatoria'
        }
        if (formData.fecha_inicio && formData.fecha_fin) {
            if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
                newErrors.fecha_fin = 'La fecha de fin debe ser igual o posterior a la de inicio'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Guardar
    const handleGuardar = async () => {
        if (!validar()) return

        setSaving(true)
        try {
            await onSave({
                cliente_id: parseInt(formData.cliente_id),
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim() || null,
                fecha_inicio: formData.fecha_inicio,
                fecha_fin: formData.fecha_fin,
                direccion: formData.direccion.trim() || null,
                ciudad_id: formData.ciudad_id ? parseInt(formData.ciudad_id) : null,
                notas: formData.notas.trim() || null
            })
            onClose()
        } catch (error) {
            console.error('Error al guardar evento:', error)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                    {/* Cliente */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Cliente *
                        </label>
                        <select
                            name="cliente_id"
                            value={formData.cliente_id}
                            onChange={handleChange}
                            disabled={loadingClientes || isEditing}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                errors.cliente_id ? 'border-red-300' : 'border-slate-200'
                            } ${isEditing ? 'bg-slate-50' : ''}`}
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        {errors.cliente_id && (
                            <p className="text-xs text-red-500 mt-1">{errors.cliente_id}</p>
                        )}
                    </div>

                    {/* Nombre del evento */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre del Evento *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Boda García-López"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                errors.nombre ? 'border-red-300' : 'border-slate-200'
                            }`}
                        />
                        {errors.nombre && (
                            <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Descripción del evento..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Fecha Inicio *
                            </label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={formData.fecha_inicio}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                    errors.fecha_inicio ? 'border-red-300' : 'border-slate-200'
                                }`}
                            />
                            {errors.fecha_inicio && (
                                <p className="text-xs text-red-500 mt-1">{errors.fecha_inicio}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Fecha Fin *
                            </label>
                            <input
                                type="date"
                                name="fecha_fin"
                                value={formData.fecha_fin}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                    errors.fecha_fin ? 'border-red-300' : 'border-slate-200'
                                }`}
                            />
                            {errors.fecha_fin && (
                                <p className="text-xs text-red-500 mt-1">{errors.fecha_fin}</p>
                            )}
                        </div>
                    </div>

                    {/* Ciudad y Ubicación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Ciudad
                            </label>
                            <select
                                name="ciudad_id"
                                value={formData.ciudad_id}
                                onChange={handleChange}
                                disabled={loadingCiudades}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">Seleccionar ciudad...</option>
                                {ciudades.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                            {ciudades.length === 0 && !loadingCiudades && (
                                <p className="text-xs text-amber-600 mt-1">
                                    No hay ciudades. Cree ciudades en Configuración.
                                </p>
                            )}
                        </div>

                        {formData.ciudad_id && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Ubicación predefinida
                                </label>
                                <select
                                    onChange={handleUbicacionChange}
                                    disabled={loadingUbicaciones}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Seleccionar ubicación...</option>
                                    {ubicacionesFiltradas.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                                {ubicacionesFiltradas.length === 0 && !loadingUbicaciones && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        No hay ubicaciones para esta ciudad
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Dirección
                        </label>
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Dirección del evento..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Seleccione una ubicación predefinida o ingrese la dirección manualmente
                        </p>
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
                            rows={2}
                            placeholder="Notas adicionales..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="blue"
                        icon={Save}
                        onClick={handleGuardar}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Evento'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EventoFormModal
