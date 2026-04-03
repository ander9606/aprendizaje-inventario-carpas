// ============================================
// COMPONENTE: UbicacionFormModal
// Modal para crear/editar ubicaciones
// ============================================

import { useState, useEffect } from 'react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { useCreateUbicacion, useUpdateUbicacion } from '../../hooks/useUbicaciones'
import { useGetCiudadesActivas } from '@clientes/hooks/useCiudades'
import { useTranslation } from 'react-i18next'

/**
 * COMPONENTE: UbicacionFormModal
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {Object|null} ubicacion - Datos de la ubicación (solo en modo editar)
 * @param {string|null} preselectedTipo - Tipo preseleccionado al crear (ej: 'bodega', 'evento')
 */
const UbicacionFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  ubicacion = null,
  preselectedTipo = null
}) => {
  const { t } = useTranslation()

  // ============================================
  // ESTADO LOCAL DEL FORMULARIO
  // ============================================

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'bodega',
    direccion: '',
    ciudad_id: '',
    responsable: '',
    telefono: '',
    email: '',
    capacidad_estimada: '',
    observaciones: '',
    activo: true,
    es_principal: false
  })

  const [errors, setErrors] = useState({})

  // ============================================
  // HOOKS DE API
  // ============================================

  const { mutateAsync: createUbicacion, isLoading: isCreating } = useCreateUbicacion()
  const { mutateAsync: updateUbicacion, isLoading: isUpdating } = useUpdateUbicacion()
  const { ciudades, isLoading: loadingCiudades } = useGetCiudadesActivas()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Efecto: Cargar datos en modo editar
   */
  useEffect(() => {
    if (mode === 'editar' && ubicacion) {
      setFormData({
        nombre: ubicacion.nombre || '',
        tipo: ubicacion.tipo || 'bodega',
        direccion: ubicacion.direccion || '',
        ciudad_id: ubicacion.ciudad_id || '',
        responsable: ubicacion.responsable || '',
        telefono: ubicacion.telefono || '',
        email: ubicacion.email || '',
        capacidad_estimada: ubicacion.capacidad_estimada || '',
        observaciones: ubicacion.observaciones || '',
        activo: ubicacion.activo !== undefined ? ubicacion.activo : true,
        es_principal: ubicacion.es_principal || false
      })
    } else {
      // Resetear formulario en modo crear
      setFormData({
        nombre: '',
        tipo: preselectedTipo || 'bodega',
        direccion: '',
        ciudad_id: '',
        responsable: '',
        telefono: '',
        email: '',
        capacidad_estimada: '',
        observaciones: '',
        activo: true,
        es_principal: false
      })
    }
    setErrors({})
  }, [mode, ubicacion, isOpen, preselectedTipo])

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Manejar cambios en los inputs
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  /**
   * Validar formulario
   */
  const validate = () => {
    const newErrors = {}

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = t('validation.nameRequired')
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = t('validation.nameMinLength')
    }

    // Validar ciudad
    if (!formData.ciudad_id) {
      newErrors.ciudad_id = t('validation.selectCity')
    }

    // Validar email si se proporciona
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t('validation.emailInvalid')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Manejar submit del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar
    if (!validate()) {
      return
    }

    // Preparar datos (limpiar campos vacíos)
    const dataToSend = {
      nombre: formData.nombre.trim(),
      tipo: formData.tipo,
      direccion: formData.direccion.trim() || null,
      ciudad_id: formData.ciudad_id ? parseInt(formData.ciudad_id) : null,
      responsable: formData.responsable.trim() || null,
      telefono: formData.telefono.trim() || null,
      email: formData.email.trim() || null,
      capacidad_estimada: formData.capacidad_estimada ? parseInt(formData.capacidad_estimada) : null,
      observaciones: formData.observaciones.trim() || null,
      activo: formData.activo,
      es_principal: formData.es_principal
    }

    try {
      if (mode === 'crear') {
        console.log('📝 Creando ubicación:', dataToSend)
        await createUbicacion(dataToSend)
        console.log('✅ Ubicación creada exitosamente')
      } else {
        console.log('📝 Actualizando ubicación:', dataToSend)
        await updateUbicacion({ id: ubicacion.id, data: dataToSend })
        console.log('✅ Ubicación actualizada exitosamente')
      }

      onClose()

    } catch (error) {
      console.error('❌ Error al guardar ubicación:', error)

      const mensajeError = error.response?.data?.message ||
        (mode === 'crear' ? t('inventory.errorCreatingLocation') : t('inventory.errorUpdatingLocation'))

      setErrors({ submit: mensajeError })
    }
  }

  /**
   * Cerrar modal y resetear
   */
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'crear' ? t('inventory.newLocationTitle') : t('inventory.editLocationTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ============================================
            ERROR GENERAL DEL SUBMIT
            ============================================ */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{errors.submit}</p>
          </div>
        )}

        {/* ============================================
            SECCIÓN: INFORMACIÓN BÁSICA
            ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">{t('inventory.basicInfo')}</h3>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('common.name')} *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder={t('inventory.locationNamePlaceholder')}
              disabled={isLoading}
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
                ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-300'}
              `}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.locationType')}
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              disabled={isLoading}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
              "
            >
              <optgroup label={t('inventory.storageOptgroup')}>
                <option value="bodega">{t('inventory.warehouseOption')}</option>
                <option value="taller">{t('inventory.workshopOption')}</option>
                <option value="transito">{t('inventory.transitOption')}</option>
              </optgroup>
              <optgroup label={t('inventory.eventVenuesOptgroup')}>
                <option value="finca">{t('inventory.farmOption')}</option>
                <option value="hacienda">{t('inventory.haciendaOption')}</option>
                <option value="jardin">{t('inventory.gardenOption')}</option>
                <option value="club">{t('inventory.clubOption')}</option>
                <option value="hotel">{t('inventory.hotelOption')}</option>
                <option value="playa">{t('inventory.beachOption')}</option>
                <option value="parque">{t('inventory.parkOption')}</option>
                <option value="residencia">{t('inventory.residenceOption')}</option>
                <option value="evento">{t('inventory.tempEventOption')}</option>
              </optgroup>
              <optgroup label={t('inventory.othersOptgroup')}>
                <option value="otro">{t('inventory.otherOption')}</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* ============================================
            SECCIÓN: UBICACIÓN
            ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">{t('inventory.locationSection')}</h3>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.city')}
            </label>
            <select
              name="ciudad_id"
              value={formData.ciudad_id}
              onChange={handleChange}
              disabled={isLoading || loadingCiudades}
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
                ${errors.ciudad_id ? 'border-red-300 bg-red-50' : 'border-slate-300'}
              `}
            >
              <option value="">
                {loadingCiudades ? t('inventory.loadingCities') : t('inventory.selectCity')}
              </option>
              {ciudades.map(ciudad => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.nombre}{ciudad.departamento ? ` (${ciudad.departamento})` : ''}
                </option>
              ))}
            </select>
            {errors.ciudad_id && (
              <p className="mt-1 text-sm text-red-600">{errors.ciudad_id}</p>
            )}
            {ciudades.length === 0 && !loadingCiudades && (
              <p className="mt-1 text-xs text-amber-600">
                {t('inventory.noCitiesAvailable')}
              </p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.addressLabel')}
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder={t('inventory.addressPlaceholder')}
              disabled={isLoading}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
              "
            />
          </div>
        </div>

        {/* ============================================
            SECCIÓN: CONTACTO
            ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">{t('inventory.contactSection')}</h3>

          {/* Responsable */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.responsiblePerson')}
            </label>
            <input
              type="text"
              name="responsable"
              value={formData.responsable}
              onChange={handleChange}
              placeholder={t('inventory.responsiblePlaceholder')}
              disabled={isLoading}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
              "
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('common.phone')}
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder={t('inventory.phonePlaceholder')}
                disabled={isLoading}
                className="
                  w-full px-4 py-2.5 border border-slate-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-slate-100 disabled:cursor-not-allowed
                "
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('common.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
                className={`
                  w-full px-4 py-2.5 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-slate-100 disabled:cursor-not-allowed
                  ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                `}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* ============================================
            SECCIÓN: INFORMACIÓN ADICIONAL
            ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">{t('inventory.additionalInfo')}</h3>

          {/* Capacidad Estimada */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.estimatedCapacity')}
            </label>
            <input
              type="number"
              name="capacidad_estimada"
              value={formData.capacidad_estimada}
              onChange={handleChange}
              placeholder="100"
              min="0"
              disabled={isLoading}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
              "
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('inventory.observations')}
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder={t('inventory.observationsPlaceholder')}
              rows={3}
              disabled={isLoading}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
                resize-none
              "
            />
          </div>

          {/* Estado Activo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={formData.activo}
              onChange={handleChange}
              disabled={isLoading}
              className="
                w-4 h-4 text-blue-600 border-slate-300 rounded
                focus:ring-2 focus:ring-blue-500
                disabled:cursor-not-allowed
              "
            />
            <label htmlFor="activo" className="text-sm font-medium text-slate-700">
              {t('inventory.activeLocation')}
            </label>
          </div>

          {/* Marcar como Principal */}
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              name="es_principal"
              id="es_principal"
              checked={formData.es_principal}
              onChange={handleChange}
              disabled={isLoading || !formData.activo}
              className="
                w-4 h-4 text-yellow-600 border-slate-300 rounded
                focus:ring-2 focus:ring-yellow-500
                disabled:cursor-not-allowed
              "
            />
            <label htmlFor="es_principal" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              {t('inventory.markAsMainLocation')}
            </label>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            {formData.es_principal
              ? t('inventory.mainLocationInfo')
              : t('inventory.mainLocationDefault')}
          </p>
        </div>

        {/* ============================================
            BOTONES DEL FORMULARIO
            ============================================ */}
        <div className="flex gap-3 pt-4 border-t">
          {/* Botón Cancelar */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
          >
            {t('common.cancel')}
          </Button>

          {/* Botón Guardar */}
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            fullWidth
          >
            {mode === 'crear' ? t('inventory.createLocation') : t('common.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default UbicacionFormModal
