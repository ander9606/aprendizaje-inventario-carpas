// ============================================
// COMPONENTE: CategoriaForm
// Formulario para crear/editar categorías
// ============================================

import { useState, useEffect } from 'react'
import Button from '../common/Button'
import EmojiPicker from '../common/Emojipicker'

/**
 * CategoriaForm
 * 
 * Formulario reutilizable para crear y editar categorías.
 * Maneja solo la UI y validación, no la lógica de API.
 * 
 * @param {Object} initialData - Datos iniciales (null para crear, objeto para editar)
 * @param {Function} onSubmit - Callback al hacer submit con los datos
 * @param {Function} onCancel - Callback al cancelar
 * @param {boolean} isLoading - Si está guardando
 * @param {boolean} isSubcategoria - Si es una subcategoría
 * @param {string} mode - 'crear' o 'editar'
 */
const CategoriaForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false,
  isSubcategoria = false,
  mode = 'crear'
}) => {
  
  // ============================================
  // ESTADO LOCAL
  // ============================================
  
  /**
   * Estado del nombre
   * - En modo crear: string vacío
   * - En modo editar: nombre de la categoría
   */
  const [nombre, setNombre] = useState('')
  
  /**
   * Estado del emoji
   * - En modo crear: '📦' por defecto
   * - En modo editar: emoji de la categoría
   */
  const [emoji, setEmoji] = useState('📦')
  
  /**
   * Control del EmojiPicker
   */
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false)
  
  /**
   * Errores de validación
   */
  const [errors, setErrors] = useState({})
  
  // ============================================
  // EFFECTS
  // ============================================
  
  /**
   * Cargar datos iniciales al editar
   */
  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '')
      setEmoji(initialData.emoji || '📦')
      console.log('📝 Cargando datos para editar:', initialData)
    } else {
      // Resetear en modo crear
      setNombre('')
      setEmoji('📦')
      console.log('➕ Formulario en modo crear')
    }
  }, [initialData])
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Handler para seleccionar emoji
   */
  const handleSeleccionarEmoji = (nuevoEmoji) => {
    console.log('✨ Emoji seleccionado:', nuevoEmoji)
    setEmoji(nuevoEmoji)
    setMostrarEmojiPicker(false)
  }
  
  /**
   * Validar formulario
   */
  const validar = () => {
    const newErrors = {}
    
    // Validar nombre
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (nombre.trim().length > 50) {
      newErrors.nombre = 'El nombre no puede tener más de 50 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  /**
   * Handler para submit
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    
    console.log('📤 Intentando enviar formulario')
    console.log('📊 Datos actuales:', { nombre, emoji })
    
    // Validar
    if (!validar()) {
      console.log('❌ Validación fallida:', errors)
      return
    }
    
    // Preparar datos
    const datos = {
      nombre: nombre.trim(),
      emoji: emoji
    }
    
    console.log('✅ Validación exitosa, enviando:', datos)
    
    // Llamar al callback del padre
    onSubmit(datos)
  }
  
  /**
   * Handler para cancelar
   */
  const handleCancel = () => {
    console.log('❌ Cancelando formulario')
    onCancel()
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* ============================================
          CAMPO: Emoji
          ============================================ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emoji {mode === 'crear' && <span className="text-red-500">*</span>}
        </label>
        
        <div className="flex items-center gap-4">
          {/* Emoji grande clickeable */}
          <button
            type="button"
            onClick={() => setMostrarEmojiPicker(true)}
            disabled={isLoading}
            className="
              text-6xl cursor-pointer 
              hover:scale-110 transition-transform 
              p-4 
              border-2 border-gray-200 rounded-lg 
              hover:border-blue-400 
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            title="Click para cambiar el emoji"
          >
            {emoji}
          </button>
          
          {/* Información y botón */}
          <div className="flex-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMostrarEmojiPicker(true)}
              disabled={isLoading}
            >
              Cambiar emoji
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Seleccionado: <span className="font-mono">{emoji}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              El emoji ayuda a identificar visualmente la categoría
            </p>
          </div>
        </div>
      </div>
      
      {/* ============================================
          CAMPO: Nombre
          ============================================ */}
      <div>
        <label 
          htmlFor="nombre" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Nombre <span className="text-red-500">*</span>
        </label>
        
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={validar}
          placeholder={isSubcategoria ? "Ej: Carpas 2 personas" : "Ej: Carpas, Mesas, Herramientas..."}
          disabled={isLoading}
          className={`
            w-full px-4 py-2 
            border rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.nombre ? 'border-red-500' : 'border-gray-300'}
          `}
          required
          autoFocus={mode === 'crear'}
          maxLength={50}
        />
        
        {/* Error de validación */}
        {errors.nombre && (
          <p className="text-sm text-red-600 mt-1">
            {errors.nombre}
          </p>
        )}
        
        {/* Contador de caracteres */}
        <p className="text-xs text-gray-500 mt-1 text-right">
          {nombre.length} / 50 caracteres
        </p>
      </div>
      
      {/* ============================================
          INFORMACIÓN ADICIONAL
          ============================================ */}
      {isSubcategoria && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            ℹ️ Estás creando una <strong>subcategoría</strong>
          </p>
        </div>
      )}
      
      {/* ============================================
          BOTONES DE ACCIÓN
          ============================================ */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        {/* Botón: Cancelar */}
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        
        {/* Botón: Guardar */}
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading || !nombre.trim()}
        >
          {mode === 'crear' ? 'Crear Categoría' : 'Guardar Cambios'}
        </Button>
      </div>
      
      {/* ============================================
          EMOJI PICKER (Modal)
          ============================================ */}
      {mostrarEmojiPicker && (
        <EmojiPicker
          selectedEmoji={emoji}
          onSelect={handleSeleccionarEmoji}
          onClose={() => setMostrarEmojiPicker(false)}
        />
      )}
    </form>
  )
}

export default CategoriaForm

/**
 * ============================================
 * NOTAS IMPORTANTES
 * ============================================
 * 
 * 1. ESTADO DEL EMOJI:
 *    - Se inicializa con '📦' por defecto
 *    - Se actualiza cuando se selecciona otro emoji
 *    - Se carga desde initialData en modo editar
 * 
 * 2. VALIDACIÓN:
 *    - Nombre obligatorio y entre 2-50 caracteres
 *    - Se valida al perder foco (onBlur) y al submit
 *    - Los errores se muestran en tiempo real
 * 
 * 3. FLUJO DE DATOS:
 *    - El formulario NO se comunica con la API
 *    - Solo valida y prepara los datos
 *    - Llama a onSubmit({ nombre, emoji })
 *    - El componente padre maneja la API
 * 
 * 4. ACCESIBILIDAD:
 *    - Labels con htmlFor
 *    - Estados disabled visibles
 *    - Focus automático en campo nombre (modo crear)
 *    - Mensajes de error descriptivos
 * 
 * 5. UX:
 *    - Emoji grande y clickeable
 *    - Preview del emoji seleccionado
 *    - Contador de caracteres
 *    - Botón submit deshabilitado si nombre vacío
 *    - Loading states en todos los botones
 */