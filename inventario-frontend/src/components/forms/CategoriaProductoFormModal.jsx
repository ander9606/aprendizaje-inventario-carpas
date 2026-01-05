// ============================================
// COMPONENTE: CategoriaProductoFormModal
// Modal para crear/editar categorías de productos de alquiler
// ============================================

import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import SymbolPicker from '../common/picker/SymbolPicker'
import IconoCategoria from '../common/IconoCategoria'
import {
  useCreateCategoriaProducto,
  useUpdateCategoriaProducto
} from '../../hooks/UseCategoriasProductos'
import { toast } from 'sonner'

const CategoriaProductoFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  categoria = null
}) => {
  const isEditMode = categoria && categoria.id

  // ============================================
  // ESTADO LOCAL DEL FORMULARIO
  // ============================================

  const [formData, setFormData] = useState({
    nombre: '',
    emoji: '📦',
    descripcion: ''
  })

  const [errors, setErrors] = useState({})
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false)

  // ============================================
  // HOOKS DE API
  // ============================================

  const { createCategoria, isPending: isCreating } = useCreateCategoriaProducto()
  const { updateCategoria, isPending: isUpdating } = useUpdateCategoriaProducto()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          nombre: categoria.nombre || '',
          emoji: categoria.emoji || '📦',
          descripcion: categoria.descripcion || ''
        })
      } else {
        setFormData({
          nombre: '',
          emoji: '📦',
          descripcion: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, categoria, isEditMode])

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
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSelectSymbol = (symbol) => {
    setFormData(prev => ({
      ...prev,
      emoji: symbol
    }))
    setMostrarEmojiPicker(false)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    const dataToSend = {
      nombre: formData.nombre.trim(),
      emoji: formData.emoji,
      descripcion: formData.descripcion.trim() || null
    }

    try {
      if (isEditMode) {
        await updateCategoria({
          id: categoria.id,
          ...dataToSend
        })
        toast.success('Categoría actualizada exitosamente')
      } else {
        await createCategoria(dataToSend)
        toast.success('Categoría creada exitosamente')
      }

      onSuccess?.()
      onClose()

    } catch (error) {
      console.error('Error al guardar categoría:', error)

      const mensajeError =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        (isEditMode
          ? 'Error al actualizar la categoría'
          : 'Error al crear la categoría')

      if (mensajeError.includes('Duplicate') || mensajeError.includes('duplicado')) {
        setErrors({ nombre: 'Ya existe una categoría con este nombre' })
      } else {
        setErrors({ submit: mensajeError })
      }
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ nombre: '', emoji: '📦', descripcion: '' })
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
        title={isEditMode ? 'Editar Categoría' : 'Nueva Categoría de Producto'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre de la categoría *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Carpas, Mobiliario, Iluminación..."
              disabled={isLoading}
              autoFocus
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
                ${errors.nombre
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-300'
                }
              `}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Icono
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
              <IconoCategoria value={formData.emoji} className="text-3xl" />
              <span className="text-slate-600">
                Haz clic para cambiar el icono
              </span>
            </button>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Breve descripción de esta categoría..."
              disabled={isLoading}
              rows={2}
              className="
                w-full px-4 py-2.5 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
                resize-none
              "
            />
          </div>

          {/* Botones */}
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
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isEditMode ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      {mostrarEmojiPicker && (
        <SymbolPicker
          open={mostrarEmojiPicker}
          value={formData.emoji}
          onSelect={handleSelectSymbol}
          onClose={() => setMostrarEmojiPicker(false)}
        />
      )}
    </>
  )
}

export default CategoriaProductoFormModal
