// ============================================
// COMPONENTE: ElementoCompuestoFormModal
// Modal para crear/editar elementos compuestos (plantillas de productos)
// ============================================

import { useState, useEffect } from 'react'
import { DollarSign, Layers } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import {
  useCreateElementoCompuesto,
  useUpdateElementoCompuesto
} from '../../hooks/UseElementosCompuestos'

/**
 * COMPONENTE: ElementoCompuestoFormModal
 *
 * Modal para crear/editar plantillas de productos compuestos
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {Object|null} elemento - Datos del elemento (solo en modo editar)
 * @param {Array} categorias - Lista de categorías disponibles
 * @param {number|null} categoriaPreseleccionada - ID de categoría preseleccionada
 * @param {Function} onSuccess - Callback al guardar exitosamente
 */
const ElementoCompuestoFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  elemento = null,
  categorias = [],
  categoriaPreseleccionada = null,
  onSuccess
}) => {
  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    precio_base: '',
    activo: true
  })

  const [errors, setErrors] = useState({})

  // ============================================
  // HOOKS DE API
  // ============================================

  const { createElemento, isLoading: isCreating } = useCreateElementoCompuesto()
  const { updateElemento, isLoading: isUpdating } = useUpdateElementoCompuesto()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (mode === 'editar' && elemento) {
      setFormData({
        nombre: elemento.nombre || '',
        descripcion: elemento.descripcion || '',
        categoria_id: elemento.categoria_id?.toString() || '',
        precio_base: elemento.precio_base?.toString() || '',
        activo: elemento.activo !== false
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        categoria_id: categoriaPreseleccionada?.toString() || '',
        precio_base: '',
        activo: true
      })
    }
    setErrors({})
  }, [mode, elemento, isOpen, categoriaPreseleccionada])

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
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres'
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Debe seleccionar una categoría'
    }

    if (!formData.precio_base || parseFloat(formData.precio_base) < 0) {
      newErrors.precio_base = 'El precio base debe ser un número válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    const dataToSend = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      categoria_id: parseInt(formData.categoria_id),
      precio_base: parseFloat(formData.precio_base),
      activo: formData.activo
    }

    try {
      if (mode === 'crear') {
        await createElemento(dataToSend)
      } else {
        await updateElemento({ id: elemento.id, ...dataToSend })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al guardar elemento:', error)
      const mensajeError = error.response?.data?.mensaje ||
        (mode === 'crear' ? 'Error al crear el elemento' : 'Error al actualizar el elemento')
      setErrors({ submit: mensajeError })
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        nombre: '',
        descripcion: '',
        categoria_id: '',
        precio_base: '',
        activo: true
      })
      setErrors({})
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
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <span>{mode === 'crear' ? 'Nuevo Elemento Compuesto' : 'Editar Elemento Compuesto'}</span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error general */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{errors.submit}</p>
          </div>
        )}

        {/* Campo: Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nombre del producto *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Carpa 10x10, Sala Lounge Premium..."
            disabled={isLoading}
            className={`
              w-full px-4 py-2.5 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-purple-500
              disabled:bg-slate-100 disabled:cursor-not-allowed
              ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
          )}
        </div>

        {/* Campo: Categoría */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Categoría *
          </label>
          <select
            name="categoria_id"
            value={formData.categoria_id}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              w-full px-4 py-2.5 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-purple-500
              disabled:bg-slate-100 disabled:cursor-not-allowed
              ${errors.categoria_id ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
          >
            <option value="">Seleccionar categoría...</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.nombre}
              </option>
            ))}
          </select>
          {errors.categoria_id && (
            <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
          )}
        </div>

        {/* Campo: Precio Base */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Precio base *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              name="precio_base"
              value={formData.precio_base}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="1000"
              disabled={isLoading}
              className={`
                w-full pl-10 pr-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-purple-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
                ${errors.precio_base ? 'border-red-300 bg-red-50' : 'border-slate-300'}
              `}
            />
          </div>
          {errors.precio_base && (
            <p className="mt-1 text-sm text-red-600">{errors.precio_base}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Precio base del producto sin adicionales. Los componentes con alternativas pueden agregar costos extra.
          </p>
        </div>

        {/* Campo: Descripción */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Descripción del producto compuesto..."
            rows={3}
            disabled={isLoading}
            className="
              w-full px-4 py-2.5 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-purple-500
              disabled:bg-slate-100 disabled:cursor-not-allowed
              resize-none
            "
          />
        </div>

        {/* Campo: Activo */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="activo"
            id="activo"
            checked={formData.activo}
            onChange={handleChange}
            disabled={isLoading}
            className="w-4 h-4 text-purple-600 border-slate-300 rounded
                     focus:ring-purple-500"
          />
          <label htmlFor="activo" className="text-sm text-slate-700">
            Producto activo (visible para cotizaciones)
          </label>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
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
            {mode === 'crear' ? 'Crear Elemento' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ElementoCompuestoFormModal
