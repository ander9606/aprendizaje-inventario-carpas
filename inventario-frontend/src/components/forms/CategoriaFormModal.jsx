// ============================================
// COMPONENTE: CategoriaFormModal
// Modal wrapper para crear/editar categorías
// ============================================

import { useEffect } from 'react'
import Modal from '../common/Modal'
import CategoriaForm from './CategoriaForm'
import { 
  useCreateCategoria, 
  useUpdateCategoria 
} from '../../hooks/Usecategorias'

/**
 * Componente CategoriaFormModal
 * 
 * Modal que envuelve el formulario de categoría.
 * Maneja la lógica de API (crear/actualizar).
 * 
 * ARQUITECTURA:
 * - Este componente: Lógica de API + Estado del modal
 * - CategoriaForm: Solo UI y validación
 * - Hooks: Comunicación con backend
 * 
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar el modal
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {Object|null} categoria - Datos de la categoría (solo en modo editar)
 * 
 * @example
 * // Modo crear
 * <CategoriaFormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   mode="crear"
 *   categoria={null}
 * />
 * 
 * // Modo editar
 * <CategoriaFormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   mode="editar"
 *   categoria={categoriaSeleccionada}
 * />
 * 
 * FLUJO DE DATOS:
 * 
 * CREAR:
 * Usuario llena formulario → Submit → useCreateCategoria
 *   → API POST → React Query invalida cache → Dashboard se actualiza
 *   → Modal se cierra
 * 
 * EDITAR:
 * Formulario carga con datos → Usuario modifica → Submit → useUpdateCategoria
 *   → API PUT → React Query invalida cache → Dashboard se actualiza
 *   → Modal se cierra
 */
export const CategoriaFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  categoria = null
}) => {
  
  // ============================================
  // HOOKS DE API
  // ============================================
  
  /**
   * Hook para crear categoría
   * 
   * createCategoria: función async para crear
   * isCreating: boolean - si está creando
   * createError: objeto de error (si falla)
   */
  const { 
    createCategoria, 
    isLoading: isCreating,
    error: createError
  } = useCreateCategoria()
  
  /**
   * Hook para actualizar categoría
   * 
   * updateCategoria: función async para actualizar
   * isUpdating: boolean - si está actualizando
   * updateError: objeto de error (si falla)
   */
  const { 
    updateCategoria, 
    isLoading: isUpdating,
    error: updateError
  } = useUpdateCategoria()
  
  // Estado de carga combinado
  const isLoading = isCreating || isUpdating
  
  // Error combinado
  const error = createError || updateError
  
  // ============================================
  // EFFECTS
  // ============================================
  
  /**
   * Efecto: Limpiar errores al abrir el modal
   */
  useEffect(() => {
    if (isOpen) {
      // Aquí podrías resetear estados si fuera necesario
      // Por ahora, React Query maneja los errores automáticamente
    }
  }, [isOpen])
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Manejar el submit del formulario
   * 
   * @param {Object} data - Datos del formulario validados
   * 
   * FLUJO:
   * 1. Determinar si es crear o editar
   * 2. Llamar al hook correspondiente
   * 3. Esperar respuesta
   * 4. Si OK: cerrar modal (React Query actualiza automáticamente)
   * 5. Si ERROR: mostrar error (manejado por React Query)
   */
  const handleSubmit = async (data) => {
    try {
      if (mode === 'crear') {
        // CREAR nueva categoría
        await createCategoria(data)
        
        console.log('✅ Categoría creada:', data.nombre)
        
        // Cerrar modal
        onClose()
        
      } else {
        // EDITAR categoría existente
        await updateCategoria({
          id: categoria.id,
          ...data
        })
        
        console.log('✅ Categoría actualizada:', data.nombre)
        
        // Cerrar modal
        onClose()
      }
    } catch (err) {
      // El error ya está manejado por React Query
      // Solo lo logueamos para debugging
      console.error('❌ Error al guardar categoría:', err)
      
      // El modal NO se cierra si hay error
      // El usuario puede corregir y reintentar
    }
  }
  
  /**
   * Manejar cancelación
   */
  const handleCancel = () => {
    // Cerrar modal sin guardar
    onClose()
  }
  
  // ============================================
  // DETERMINACIONES
  // ============================================
  
  // Título del modal según el modo
  const modalTitle = mode === 'crear' 
    ? '➕ Nueva Categoría' 
    : '✏️ Editar Categoría'
  
  // Datos iniciales del formulario
  const initialData = mode === 'editar' ? categoria : null
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      closeOnOverlay={!isLoading}  // No cerrar si está guardando
    >
      {/* Mostrar error si hay */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            ⚠️ Error al guardar
          </p>
          <p className="text-xs text-red-600 mt-1">
            {error.message || 'Ocurrió un error inesperado'}
          </p>
        </div>
      )}
      
      {/* Formulario */}
      <CategoriaForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        isSubcategoria={false}  // Categorías padre
        categoriasPadre={[]}    // No aplica para categorías padre
      />
      
      {/* Info adicional */}
      {mode === 'editar' && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            ID: {categoria?.id} | Creada: {new Date(categoria?.fecha_creacion).toLocaleDateString()}
          </p>
        </div>
      )}
    </Modal>
  )
}

export default CategoriaFormModal