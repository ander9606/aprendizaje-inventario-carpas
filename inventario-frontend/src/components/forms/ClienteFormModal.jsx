// ============================================
// COMPONENTE: ClienteFormModal
// Modal para crear/editar clientes
// ============================================

import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useCreateCliente, useUpdateCliente } from '../../hooks/UseClientes'

/**
 * COMPONENTE: ClienteFormModal
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {Object|null} cliente - Datos del cliente (solo en modo editar)
 */
const ClienteFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  cliente = null
}) => {

  // ============================================
  // ESTADO LOCAL DEL FORMULARIO
  // ============================================

  const [formData, setFormData] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    notas: '',
    activo: true
  })

  const [errors, setErrors] = useState({})

  // ============================================
  // HOOKS DE API
  // ============================================

  const { mutateAsync: createCliente, isLoading: isCreating } = useCreateCliente()
  const { mutateAsync: updateCliente, isLoading: isUpdating } = useUpdateCliente()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (mode === 'editar' && cliente) {
      setFormData({
        tipo_documento: cliente.tipo_documento || 'CC',
        numero_documento: cliente.numero_documento || '',
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        notas: cliente.notas || '',
        activo: cliente.activo !== undefined ? cliente.activo : true
      })
    } else {
      setFormData({
        tipo_documento: 'CC',
        numero_documento: '',
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        notas: '',
        activo: true
      })
    }
    setErrors({})
  }, [mode, cliente, isOpen])

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.numero_documento.trim()) {
      newErrors.numero_documento = 'El número de documento es obligatorio'
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres'
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email no válido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const dataToSend = {
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento.trim(),
      nombre: formData.nombre.trim(),
      telefono: formData.telefono.trim() || null,
      email: formData.email.trim() || null,
      direccion: formData.direccion.trim() || null,
      ciudad: formData.ciudad.trim() || null,
      notas: formData.notas.trim() || null,
      activo: formData.activo
    }

    try {
      if (mode === 'crear') {
        await createCliente(dataToSend)
      } else {
        await updateCliente({ id: cliente.id, data: dataToSend })
      }

      onClose()

    } catch (error) {
      console.error('Error al guardar cliente:', error)

      const mensajeError = error.response?.data?.message ||
        (mode === 'crear' ? 'Error al crear el cliente' : 'Error al actualizar el cliente')

      setErrors({ submit: mensajeError })
    }
  }

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
      title={mode === 'crear' ? 'Nuevo Cliente' : 'Editar Cliente'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ERROR GENERAL */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{errors.submit}</p>
          </div>
        )}

        {/* DOCUMENTO */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Documento</h3>

          <div className="grid grid-cols-3 gap-4">
            {/* Tipo documento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo *
              </label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                disabled={isLoading}
                className="
                  w-full px-4 py-2.5 border border-slate-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-slate-100 disabled:cursor-not-allowed
                "
              >
                <option value="CC">C.C.</option>
                <option value="NIT">NIT</option>
                <option value="CE">C.E.</option>
              </select>
            </div>

            {/* Número documento */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                placeholder="Ej: 123456789"
                disabled={isLoading}
                className={`
                  w-full px-4 py-2.5 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-slate-100 disabled:cursor-not-allowed
                  ${errors.numero_documento ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                `}
              />
              {errors.numero_documento && (
                <p className="mt-1 text-sm text-red-600">{errors.numero_documento}</p>
              )}
            </div>
          </div>
        </div>

        {/* INFORMACIÓN PERSONAL */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Información Personal</h3>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre del cliente o empresa"
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

          <div className="grid grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="300 123 4567"
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
                Email
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

        {/* UBICACIÓN */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Ubicación</h3>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle, número, barrio..."
              disabled={isLoading}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
              "
            />
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              placeholder="Ciudad o municipio"
              disabled={isLoading}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
              "
            />
          </div>
        </div>

        {/* NOTAS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Información Adicional</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Notas adicionales sobre el cliente..."
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
              Cliente activo
            </label>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            fullWidth
          >
            {mode === 'crear' ? 'Crear Cliente' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ClienteFormModal
