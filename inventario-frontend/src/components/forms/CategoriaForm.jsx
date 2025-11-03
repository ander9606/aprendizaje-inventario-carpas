// ============================================
// COMPONENTE: CategoriaForm
// Formulario puro para categorías/subcategorías
// ============================================

import { useForm } from 'react-hook-form'
import Button from '../common/Button'
import { categoriaValidation } from '../../utils/validation'
import { Save, X } from 'lucide-react'

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
   * 
   * defaultValues: Valores iniciales del formulario
   * - En modo CREAR: campos vacíos
   * - En modo EDITAR: datos de la categoría
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm({
    defaultValues: initialData || {
      nombre: '',
      icono: '',
      descripcion: '',
      padre_id: null
    }
  })
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Manejar el submit del formulario
   * 
   * handleSubmit de React Hook Form:
   * 1. Valida todos los campos
   * 2. Si hay errores, NO llama a onFormSubmit
   * 3. Si todo OK, llama a onFormSubmit con los datos limpios
   */
  const onFormSubmit = (data) => {
    // Limpiar datos antes de enviar
    const cleanData = {
      nombre: data.nombre.trim(),
      icono: data.icono?.trim() || null,
      descripcion: data.descripcion?.trim() || null,
      padre_id: isSubcategoria ? data.padre_id : null
    }
    
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
          CAMPO: ICONO (opcional)
          ============================================ */}
      <div>
        <label 
          htmlFor="icono" 
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Icono (emoji)
        </label>
        
        <input
          id="icono"
          type="text"
          placeholder="🏕️ 🪑 🔧 💡"
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.icono 
              ? 'border-red-300 bg-red-50' 
              : 'border-slate-300 bg-white'
            }
          `}
          {...register('icono', categoriaValidation.icono)}
          disabled={isLoading}
        />
        
        {errors.icono && (
          <p className="mt-1 text-sm text-red-600">
            {errors.icono.message}
          </p>
        )}
        
        <p className="mt-1 text-xs text-slate-500">
          Agrega un emoji para identificar visualmente la categoría
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
  )
}

export default CategoriaForm