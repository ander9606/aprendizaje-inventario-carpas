// ============================================
// COMPONENTE: SubcategoriaFormModal
// Modal para crear/editar subcategorías
// ============================================

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import EmojiPicker from '../common/Emojipicker'
import { useCreateCategoria, useUpdateCategoria } from '../../hooks/Usecategorias'

const SubcategoriaFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  padreId = null,
  subcategoria = null
}) => {
  
  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [formData, setFormData] = useState({
    nombre: '',
    emoji: '📦'
  })

  const [errors, setErrors] = useState({})
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false)

  // ============================================
  // HOOKS DE API
  // ============================================

  const { createCategoria, isLoading: isCreating } = useCreateCategoria()
  const { mutateAsync: updateCategoria, isLoading: isUpdating } = useUpdateCategoria()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (mode === 'editar' && subcategoria) {
      setFormData({
        nombre: subcategoria.nombre || '',
        emoji: subcategoria.emoji || '📦'
      })
    } else {
      setFormData({ nombre: '', emoji: '📦' })
    }

    setErrors({})
  }, [mode, subcategoria, isOpen])

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
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'Debe tener al menos 3 caracteres'
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'No puede exceder 100 caracteres'
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
      padre_id: mode === 'crear'
        ? padreId
        : subcategoria.padre_id
    }

    try {
      if (mode === 'crear') {
        console.log('📝 Creando subcategoría:', dataToSend)
        await createCategoria(dataToSend)
      } else {
        console.log('📝 Actualizando subcategoría:', dataToSend)
        await updateCategoria({
          id: subcategoria.id,
          ...dataToSend
        })
      }

      onClose()

    } catch (error) {
      console.error('❌ Error al guardar subcategoría:', error)

      const mensajeError =
        error.response?.data?.mensaje ||
        (mode === 'crear'
          ? 'Error al crear subcategoría'
          : 'Error al actualizar subcategoría')

      setErrors({ submit: mensajeError })
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ nombre: '', emoji: '📦' })
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
        title={mode === 'crear' ? '🆕 Nueva Subcategoría' : '✏️ Editar Subcategoría'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{errors.submit}</p>
            </div>
          )}
          
          {/* Campo Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre de la subcategoría *
            </label>

            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Carpa 3x3, Mesa redonda..."
              disabled={isLoading}
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100
                ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-300'}
              `}
            />

            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Campo Emoji */}
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
                hover:bg-slate-50
              "
            >
              <span className="text-3xl">{formData.emoji}</span>
              <span className="text-slate-600">Haz clic para cambiar el emoji</span>
            </button>

            <p className="mt-1 text-xs text-slate-500">
              El emoji ayuda a identificar visualmente la subcategoría
            </p>
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
            >
              {mode === 'crear' ? 'Crear Subcategoría' : 'Guardar Cambios'}
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

export default SubcategoriaFormModal
