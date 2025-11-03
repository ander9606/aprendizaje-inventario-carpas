// ============================================
// COMPONENTE: CategoriaForm
// Formulario puro para categorías/subcategorías
// ============================================

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../common/Button'
import EmojiPicker from '../common/Emojipicker'
import { categoriaValidation } from '../../utils/validation'
import { Save, X, Smile } from 'lucide-react'

/**
 * Componente CategoriaForm
 * 
 * Formulario puro para crear/editar categorías.
 * NO maneja la lógica de API ni modales.
 * Solo renderiza campos y emite eventos.
 * 
 * @param {Object} initialData - Datos iniciales (para editar)
 * @param {Function} onSubmit - Callback cuando se envía el form (recibe data)
 * @param {Function} onCancel - Callback cuando se cancela
 * @param {boolean} isLoading - Si está guardando
 * @param {boolean} isSubcategoria - Si es subcategoría (muestra campo padre)
 * @param {Array} categoriasPadre - Lista de categorías padre (para select)
 * 
 * @example
 * <CategoriaForm
 *   initialData={{ nombre: 'Carpas', icono: '🏕️' }}
 *   onSubmit={(data) => console.log(data)}
 *   onCancel={() => console.log('Cancelado')}
 *   isLoading={false}
 * />
 * 
 * SEPARACIÓN DE RESPONSABILIDADES:
 * - Este componente: UI y validación de campos
 * - El padre (Modal): Lógica de API y estado del modal
 * - Los hooks: Comunicación con el backend
 */
export const CategoriaForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false,
  isSubcategoria = false,
  categoriasPadre = []
}) => {
  
  // ============================================
  // REACT HOOK FORM
  // ============================================
  
  /**
   * useForm: Hook principal de React Hook Form
   * 
   * - register: función para registrar campos
   * - handleSubmit: wrapper para el submit
   * - formState: estado del formulario (errors, isDirty, etc.)
   * - reset: resetear formulario
   * - setValue: actualizar valor de un campo
   * - watch: observar valor de un campo
   * 
   * defaultValues: Valores iniciales del formulario
   * - En modo CREAR: campos vacíos con emoji por defecto
   * - En modo EDITAR: datos de la categoría
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: initialData || {
      nombre: '',
      icono: '📦',  // Emoji por defecto
      descripcion: '',
      padre_id: null
    }
  })
  
  // ============================================
  // STATE LOCAL: Control del EmojiPicker
  // ============================================
  
  /**
   * Estado para controlar la visibilidad del EmojiPicker
   */
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  /**
   * Observar el valor actual del emoji en el formulario
   * watch() de React Hook Form permite leer valores en tiempo real
   */
  const emojiActual = watch('icono') || '📦'
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Manejar la selección de un emoji
   * 
   * FLUJO:
   * 1. Usuario hace clic en un emoji del picker
   * 2. Esta función recibe el emoji seleccionado
   * 3. Actualiza el valor en React Hook Form
   * 4. Cierra el picker automáticamente
   */
  const handleSelectEmoji = (emoji) => {
    console.log('✅ Emoji seleccionado:', emoji)
    
    // Actualizar el valor en el formulario
    setValue('icono', emoji, { 
      shouldDirty: true,      // Marcar como modificado
      shouldValidate: true    // Validar el campo
    })
    
    // Cerrar el picker
    setShowEmojiPicker(false)
  }
  
  /**
   * Manejar el submit del formulario
   * 
   * handleSubmit de React Hook Form:
   * 1. Valida todos los campos
   * 2. Si hay errores, NO llama a onFormSubmit
   * 3. Si todo OK, llama a onFormSubmit con los datos limpios
   */
  const onFormSubmit = (data) => {
    console.log('📤 Enviando formulario:', data)
    
    // Limpiar datos antes de enviar
    const cleanData = {
      nombre: data.nombre.trim(),
      icono: data.icono?.trim() || '📦',
      descripcion: data.descripcion?.trim() || null,
      padre_id: isSubcategoria ? data.padre_id : null
    }
    
    console.log('📦 Datos limpios:', cleanData)
    
    // Emitir evento al padre
    onSubmit(cleanData)
  }
  
  /**
   * Manejar cancelación
   */
  const handleCancel = () => {
    // Resetear formulario a valores iniciales
    reset()
    
    // Emitir evento al padre
    if (onCancel) {
      onCancel()
    }
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        
        {/* ============================================
            CAMPO: NOMBRE (obligatorio)
            ============================================ */}
        <div>
          <label 
            htmlFor="nombre" 
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Nombre <span className="text-red-500">*</span>
          </label>
          
          <input
            id="nombre"
            type="text"
            placeholder="Ej: Carpas, Mobiliario, Herramientas..."
            className={`
              w-full px-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.nombre 
                ? 'border-red-300 bg-red-50' 
                : 'border-slate-300 bg-white'
              }
            `}
            {...register('nombre', categoriaValidation.nombre)}
            disabled={isLoading}
          />
          
          {/* Mensaje de error */}
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">
              {errors.nombre.message}
            </p>
          )}
          
          {/* Ayuda */}
          <p className="mt-1 text-xs text-slate-500">
            Mínimo 3 caracteres, máximo 50
          </p>
        </div>
        
        {/* ============================================
            CAMPO: ICONO (con EmojiPicker)
            ============================================ */}
        <div>
          <label 
            htmlFor="icono" 
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Icono (emoji)
          </label>
          
          {/* 
            CAMPO HIDDEN para React Hook Form
            Este campo guarda el valor del emoji
            pero no es visible para el usuario
          */}
          <input
            type="hidden"
            {...register('icono', categoriaValidation.icono)}
          />
          
          {/* 
            BOTÓN SELECTOR DE EMOJI
            
            ¿QUÉ HACE?
            - Muestra el emoji actualmente seleccionado (grande)
            - Muestra un icono de carita sonriente como indicador
            - Al hacer clic, abre el EmojiPicker
          */}
          <button
            type="button"
            onClick={() => {
              console.log('🖱️ Clic en botón de emoji')
              console.log('📊 Estado actual showEmojiPicker:', showEmojiPicker)
              console.log('😀 Emoji actual:', emojiActual)
              setShowEmojiPicker(true)
              console.log('✅ showEmojiPicker cambiado a true')
            }}
            disabled={isLoading}
            className={`
              w-full px-4 py-3 border-2 rounded-lg
              flex items-center gap-3
              transition-all
              ${isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:border-blue-400 hover:bg-blue-50'
              }
              ${errors.icono 
                ? 'border-red-300 bg-red-50' 
                : 'border-slate-300 bg-white'
              }
            `}
          >
            {/* Emoji actual (grande) */}
            <span className="text-3xl">
              {emojiActual}
            </span>
            
            {/* Texto y icono */}
            <div className="flex-1 text-left">
              <span className="text-sm text-slate-600">
                Haz clic para cambiar el emoji
              </span>
            </div>
            
            {/* Icono de carita sonriente */}
            <Smile className="w-5 h-5 text-slate-400" />
          </button>
          
          {/* Mensaje de error */}
          {errors.icono && (
            <p className="mt-1 text-sm text-red-600">
              {errors.icono.message}
            </p>
          )}
          
          {/* Ayuda */}
          <p className="mt-1 text-xs text-slate-500">
            Emoji actual: {emojiActual}
          </p>
        </div>
        
        {/* ============================================
            CAMPO: DESCRIPCIÓN (opcional)
            ============================================ */}
        <div>
          <label 
            htmlFor="descripcion" 
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Descripción
          </label>
          
          <textarea
            id="descripcion"
            rows={3}
            placeholder="Descripción breve de la categoría..."
            className={`
              w-full px-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              resize-none
              ${errors.descripcion 
                ? 'border-red-300 bg-red-50' 
                : 'border-slate-300 bg-white'
              }
            `}
            {...register('descripcion', categoriaValidation.descripcion)}
            disabled={isLoading}
          />
          
          {errors.descripcion && (
            <p className="mt-1 text-sm text-red-600">
              {errors.descripcion.message}
            </p>
          )}
          
          <p className="mt-1 text-xs text-slate-500">
            Máximo 200 caracteres
          </p>
        </div>
        
        {/* ============================================
            CAMPO: CATEGORÍA PADRE (solo si es subcategoría)
            ============================================ */}
        {isSubcategoria && (
          <div>
            <label 
              htmlFor="padre_id" 
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Categoría Padre <span className="text-red-500">*</span>
            </label>
            
            <select
              id="padre_id"
              className={`
                w-full px-3 py-2 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.padre_id 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-300 bg-white'
                }
              `}
              {...register('padre_id', {
                required: 'Debes seleccionar una categoría padre'
              })}
              disabled={isLoading}
            >
              <option value="">Selecciona una categoría...</option>
              {categoriasPadre.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.icono} {categoria.nombre}
                </option>
              ))}
            </select>
            
            {errors.padre_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.padre_id.message}
              </p>
            )}
          </div>
        )}
        
        {/* ============================================
            BOTONES DE ACCIÓN
            ============================================ */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          {/* Botón Cancelar */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
            icon={<X />}
          >
            Cancelar
          </Button>
          
          {/* Botón Guardar */}
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading || !isDirty}
            className="flex-1"
            icon={<Save />}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
        
        {/* Info: isDirty */}
        {!isDirty && initialData && (
          <p className="text-xs text-slate-500 text-center -mt-2">
            No hay cambios para guardar
          </p>
        )}
      </form>
      
      {/* ============================================
          EMOJI PICKER MODAL
          
          Se muestra solo cuando showEmojiPicker es true
          ============================================ */}
      {showEmojiPicker && (
        <>
          {console.log('🎨 Renderizando EmojiPicker')}
          <EmojiPicker
            selectedEmoji={emojiActual}
            onSelect={handleSelectEmoji}
            onClose={() => {
              console.log('❌ Cerrando EmojiPicker')
              setShowEmojiPicker(false)
            }}
          />
        </>
      )}
    </>
  )
}

export default CategoriaForm