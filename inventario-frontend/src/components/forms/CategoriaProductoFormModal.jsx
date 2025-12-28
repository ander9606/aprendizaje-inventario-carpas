// ============================================
// COMPONENTE: CategoriaProductoFormModal
// Modal para crear/editar categorías de productos
// ============================================

import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import EmojiPicker from '../common/Emojipicker'
import {
  useCreateCategoriaProducto,
  useUpdateCategoriaProducto
} from '../../hooks/UseCategoriasProductos'

/**
 * COMPONENTE: CategoriaProductoFormModal
 *
 * Modal para crear/editar categorías de productos (ej: Carpas, Salas Lounge)
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {Object|null} categoria - Datos de la categoría (solo en modo editar)
 * @param {Function} onSuccess - Callback al guardar exitosamente
 */
const CategoriaProductoFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  categoria = null,
  onSuccess
}) => {
  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    emoji: '📦'
  })

  const [errors, setErrors] = useState({})
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false)

  // ============================================
  // HOOKS DE API
  // ============================================

  const { createCategoria, isLoading: isCreating } = useCreateCategoriaProducto()
  const { updateCategoria, isLoading: isUpdating } = useUpdateCategoriaProducto()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (mode === 'editar' && categoria) {
      setFormData({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        emoji: categoria.emoji || '📦'
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        emoji: '📦'
      })
    }
    setErrors({})
  }, [mode, categoria, isOpen])

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectEmoji = (emoji) => {
    setFormData(prev => ({ ...prev, emoji }))
    setMostrarEmojiPicker(false)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
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
      emoji: formData.emoji
    }

    try {
      if (mode === 'crear') {
        await createCategoria(dataToSend)
      } else {
        await updateCategoria({ id: categoria.id, ...dataToSend })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al guardar categoría:', error)
      const mensajeError = error.response?.data?.mensaje ||
        (mode === 'crear' ? 'Error al crear la categoría' : 'Error al actualizar la categoría')
      setErrors({ submit: mensajeError })
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ nombre: '', descripcion: '', emoji: '📦' })
      setErrors({})
      onClose()
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={mode === 'crear' ? 'Nueva Categoría de Productos' : 'Editar Categoría'}
        size="md"
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
              Nombre de la categoría *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Carpas, Salas Lounge, Mobiliario..."
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

          {/* Campo: Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Breve descripción de la categoría..."
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

          {/* Campo: Emoji */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Icono (Emoji)
            </label>
            <button
              type="button"
              onClick={() => setMostrarEmojiPicker(true)}
              disabled={isLoading}
              className="
                w-full px-4 py-3 border border-slate-300 rounded-lg
                flex items-center gap-3
                hover:bg-slate-50 transition-colors
                disabled:bg-slate-100 disabled:cursor-not-allowed
              "
            >
              <span className="text-3xl">{formData.emoji}</span>
              <span className="text-slate-600">
                Haz clic para cambiar el emoji
              </span>
            </button>
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
              {mode === 'crear' ? 'Crear Categoría' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Emoji Picker */}
      {mostrarEmojiPicker && (
        <EmojiPicker
          selectedEmoji={formData.emoji}
          onSelect={handleSelectEmoji}
          onClose={() => setMostrarEmojiPicker(false)}
        />
      )}
    </>
  )
}

export default CategoriaProductoFormModal
