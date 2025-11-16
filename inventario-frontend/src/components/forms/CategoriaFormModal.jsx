// ============================================
// COMPONENTE: SubcategoriaFormModal
// Modal para crear/editar subcategorías (categorías con padre_id)
// ============================================

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import EmojiPicker from '../common/Emojipicker'
import { useCreateCategoria, useUpdateCategoria } from '../../hooks/Usecategorias'

/**
 * ¿QUÉ ES UNA SUBCATEGORÍA?
 * 
 * Una subcategoría es simplemente una categoría que tiene un padre_id.
 * 
 * Ejemplo:
 * - Categoría Padre: "Carpas" (padre_id = NULL)
 * - Subcategoría: "Carpa 3x3" (padre_id = ID de "Carpas")
 * 
 * En la base de datos, ambas están en la misma tabla "categorias",
 * la diferencia es el valor de padre_id.
 */

/**
 * COMPONENTE: SubcategoriaFormModal
 * 
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {number} padreId - ID de la categoría padre (requerido en modo crear)
 * @param {Object|null} subcategoria - Datos de la subcategoría (solo en modo editar)
 * 
 * @example
 * // Crear subcategoría
 * <SubcategoriaFormModal
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   mode="crear"
 *   padreId={5}  // ID de la categoría padre
 * />
 * 
 * // Editar subcategoría
 * <SubcategoriaFormModal
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   mode="editar"
 *   subcategoria={{ id: 10, nombre: 'Carpa 3x3', emoji: '🏕️', padre_id: 5 }}
 * />
 */
const SubcategoriaFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  padreId = null,
  subcategoria = null
}) => {
  
  // ============================================
  // ESTADO LOCAL DEL FORMULARIO
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
  
  /**
   * IMPORTANTE: Cómo funcionan estos hooks
   * 
   * useCreateCategoria() devuelve:
   *   { createCategoria, isLoading, error }
   *   - createCategoria ya ES mutateAsync
   *   - Uso: await createCategoria(data)
   * 
   * useUpdateCategoria() devuelve:
   *   { mutate, mutateAsync, isLoading, error }
   *   - Necesitamos renombrar mutateAsync
   *   - Uso: await updateCategoria(data)
   */
  
  const { 
    createCategoria,      // Ya es mutateAsync
    isLoading: isCreating 
  } = useCreateCategoria()
  
  const { 
    mutateAsync: updateCategoria,  // Renombrar mutateAsync a updateCategoria
    isLoading: isUpdating 
  } = useUpdateCategoria()
  
  const isLoading = isCreating || isUpdating
  
  // ============================================
  // EFFECTS
  // ============================================
  
  /**
   * Efecto: Cargar datos en modo editar
   */
  useEffect(() => {
    if (mode === 'editar' && subcategoria) {
      setFormData({
        nombre: subcategoria.nombre || '',
        emoji: subcategoria.emoji || '📦'
      })
    } else {
      // Resetear formulario en modo crear
      setFormData({
        nombre: '',
        emoji: '📦'
      })
    }
    setErrors({})
  }, [mode, subcategoria, isOpen])
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Manejar cambios en los inputs
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
   * Seleccionar emoji
   */
  const handleSelectEmoji = (emoji) => {
    setFormData(prev => ({
      ...prev,
      emoji
    }))
    setMostrarEmojiPicker(false)
  }
  
  /**
   * Validar formulario
   */
  const validate = () => {
    const newErrors = {}
    
    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres'
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres'
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
    
    // Preparar datos
    const dataToSend = {
      nombre: formData.nombre.trim(),
      emoji: formData.emoji,
      padre_id: mode === 'crear' ? padreId : subcategoria.padre_id
    }
    
    try {
      if (mode === 'crear') {
        // CREAR NUEVA SUBCATEGORÍA
        console.log('📝 Creando subcategoría:', dataToSend)
        
        // ✅ CORRECTO: usar createCategoria directamente (ya es mutateAsync)
        await createCategoria(dataToSend)
        
        console.log('✅ Subcategoría creada exitosamente')
        onClose()
        
      } else {
        // EDITAR SUBCATEGORÍA EXISTENTE
        console.log('📝 Actualizando subcategoría:', dataToSend)
        
        // ✅ CORRECTO: usar updateCategoria directamente (ya es mutateAsync)
        await updateCategoria({
          id: subcategoria.id,
          ...dataToSend
        })
        
        console.log('✅ Subcategoría actualizada exitosamente')
        onClose()
      }
      
    } catch (error) {
      console.error('❌ Error al guardar subcategoría:', error)
      
      // Mostrar error del servidor si existe
      const mensajeError = error.response?.data?.mensaje || 
        (mode === 'crear' ? 'Error al crear la subcategoría' : 'Error al actualizar la subcategoría')
      
      setErrors({ submit: mensajeError })
    }
  }
  
  /**
   * Cerrar modal y resetear
   */
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
          
          {/* ============================================
              ERROR GENERAL DEL SUBMIT
              ============================================ */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{errors.submit}</p>
            </div>
          )}
          
          {/* ============================================
              CAMPO: NOMBRE
              ============================================ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre de la subcategoría *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Carpa 3x3, Mesa redonda, Silla plegable..."
              disabled={isLoading}
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
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
          
          {/* ============================================
              CAMPO: EMOJI
              ============================================ */}
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
            <p className="mt-1 text-xs text-slate-500">
              El emoji ayuda a identificar visualmente la subcategoría
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
              Cancelar
            </Button>
            
            {/* Botón Guardar */}
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
      
      {/* ============================================
          EMOJI PICKER
          ============================================ */}
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