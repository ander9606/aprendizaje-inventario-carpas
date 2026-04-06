// ============================================
// COMPONENTE: EventoFormModal
// Modal para crear/editar eventos
// ============================================

import { useState, useEffect } from 'react'
import { Calendar, MapPin, FileText, Save } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { useGetClientes } from '@clientes/hooks/useClientes'
import { useGetCiudadesActivas } from '@clientes/hooks/useCiudades'
import { useGetUbicacionesActivas } from '@inventario/hooks/useUbicaciones'
import { useTranslation } from 'react-i18next'

/**
 * Modal para crear o editar un evento
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onSave - Recibe los datos del evento
 * @param {Object} props.evento - Evento a editar (opcional)
 * @param {number} props.clientePreseleccionado - ID del cliente preseleccionado
 * @param {Object} props.eventoReferencia - Evento base para repetir (pre-llena todo excepto fechas)
 */
const EventoFormModal = ({
    isOpen,
    onClose,
    onSave,
    evento = null,
    clientePreseleccionado = null,
    eventoReferencia = null
}) => {
  const { t } = useTranslation()
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
        } else if (eventoReferencia) {
            // Repetir evento: pre-llenar todo excepto fechas
            setFormData({
                cliente_id: eventoReferencia.cliente_id || '',
                nombre: eventoReferencia.nombre || '',
                descripcion: eventoReferencia.descripcion || '',
                fecha_inicio: '',
                fecha_fin: '',
                direccion: eventoReferencia.direccion || '',
                ciudad_id: eventoReferencia.ciudad_id || '',
                notas: eventoReferencia.notas || ''
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
    }, [evento, eventoReferencia, clientePreseleccionado, isOpen])

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
            newErrors.cliente_id = t('rentals.eventForm.clientRequired')
        }
        if (!formData.nombre.trim()) {
            newErrors.nombre = t('rentals.eventForm.nameRequired')
        }
        if (!formData.fecha_inicio) {
            newErrors.fecha_inicio = t('rentals.eventForm.startDateRequired')
        }
        if (!formData.fecha_fin) {
            newErrors.fecha_fin = t('rentals.eventForm.endDateRequired')
        }
        if (formData.fecha_inicio && formData.fecha_fin) {
            if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
                newErrors.fecha_fin = t('rentals.eventForm.endDateAfterStart')
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? t('rentals.eventForm.editEvent') : eventoReferencia ? t('rentals.eventForm.repeatEvent') : t('rentals.eventForm.newEvent')}
            size="md"
        >
            <div className="space-y-4">
                {/* Cliente */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('rentals.eventForm.client')} *
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
                        <option value="">{t('rentals.eventForm.selectClient')}</option>
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
                        {t('rentals.eventForm.eventName')} *
                    </label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder={t("rentals.eventNamePlaceholder")}
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
                        {t('rentals.eventForm.description')}
                    </label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={2}
                        placeholder={t("rentals.eventDescPlaceholder")}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                </div>

                {/* Fechas */}
                <div className={`rounded-xl p-3 -mx-1 ${eventoReferencia ? 'bg-amber-50 border-2 border-amber-300 ring-2 ring-amber-100' : ''}`}>
                    {eventoReferencia && (
                        <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {t('rentals.eventForm.selectNewDates')}
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${eventoReferencia ? 'text-amber-800' : 'text-slate-700'}`}>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {t('rentals.eventForm.startDate')} *
                        </label>
                        <input
                            type="date"
                            name="fecha_inicio"
                            value={formData.fecha_inicio}
                            onChange={handleChange}
                            autoFocus={!!eventoReferencia}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.fecha_inicio ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' :
                                eventoReferencia ? 'border-amber-300 bg-white focus:ring-amber-500/20 focus:border-amber-500' :
                                'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                        />
                        {errors.fecha_inicio && (
                            <p className="text-xs text-red-500 mt-1">{errors.fecha_inicio}</p>
                        )}
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${eventoReferencia ? 'text-amber-800' : 'text-slate-700'}`}>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {t('rentals.eventForm.endDate')} *
                        </label>
                        <input
                            type="date"
                            name="fecha_fin"
                            value={formData.fecha_fin}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.fecha_fin ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' :
                                eventoReferencia ? 'border-amber-300 bg-white focus:ring-amber-500/20 focus:border-amber-500' :
                                'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                        />
                        {errors.fecha_fin && (
                            <p className="text-xs text-red-500 mt-1">{errors.fecha_fin}</p>
                        )}
                    </div>
                </div>
                </div>

                {/* Ciudad y Ubicación */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {t('rentals.eventForm.city')}
                        </label>
                        <select
                            name="ciudad_id"
                            value={formData.ciudad_id}
                            onChange={handleChange}
                            disabled={loadingCiudades}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="">{t('rentals.eventForm.selectCity')}</option>
                            {ciudades.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        {ciudades.length === 0 && !loadingCiudades && (
                            <p className="text-xs text-amber-600 mt-1">
                                {t('rentals.eventForm.noCities')}
                            </p>
                        )}
                    </div>

                    {formData.ciudad_id && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('rentals.eventForm.predefinedLocation')}
                            </label>
                            <select
                                onChange={handleUbicacionChange}
                                disabled={loadingUbicaciones}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">{t('rentals.eventForm.selectLocation')}</option>
                                {ubicacionesFiltradas.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombre}</option>
                                ))}
                            </select>
                            {ubicacionesFiltradas.length === 0 && !loadingUbicaciones && (
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('rentals.eventForm.noLocationsForCity')}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Dirección */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('rentals.eventForm.address')}
                    </label>
                    <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        placeholder={t("rentals.eventAddressPlaceholder")}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        {t('rentals.eventForm.addressHint')}
                    </p>
                </div>

                {/* Notas */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('rentals.eventForm.notes')}
                    </label>
                    <textarea
                        name="notas"
                        value={formData.notas}
                        onChange={handleChange}
                        rows={2}
                        placeholder={t("rentals.additionalNotesPlaceholder")}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                </div>
            </div>

            {/* Footer */}
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    {t('rentals.eventForm.cancel')}
                </Button>
                <Button
                    color="blue"
                    icon={Save}
                    onClick={handleGuardar}
                    disabled={saving}
                >
                    {saving ? t('rentals.eventForm.saving') : isEditing ? t('rentals.eventForm.update') : t('rentals.eventForm.createEvent')}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default EventoFormModal
