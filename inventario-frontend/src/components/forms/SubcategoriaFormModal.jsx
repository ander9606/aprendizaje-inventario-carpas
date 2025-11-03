// ============================================
// COMPONENTE: SubcategoriaFormModal
// Modal para crear/editar subcategorías
// ============================================

import Modal from '../common/Modal'
import CategoriaForm from './CategoriaForm'
import { 
  useCreateCategoria, 
  useUpdateCategoria,
  useGetCategoriasPadre 
} from '../../hooks/Usecategorias'
import Spinner from '../common/Spinner'

/**
 * Componente SubcategoriaFormModal
 * 
 * Variante especializada de CategoriaFormModal para subcategorías.
 * La diferencia principal es que incluye el campo padre_id.
 * 
 * REUTILIZACIÓN:
 * - Usa el mismo CategoriaForm
 * - Usa los mismos hooks
 * - Solo cambia: isSubcategoria={true} y carga categorías padre
 * 
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar el modal
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {Object|null} subcategoria - Datos de la subcategoría (modo editar)
 * @param {number|null} padreId - ID de la categoría padre (modo crear)
 * 
 * @example
 * // Crear subcategoría para una categoría específica
 * <SubcategoriaFormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   mode="crear"
 *   padreId={1}  // ID de "Carpas"
 * />
 * 
 * // Editar subcategoría existente
 * <SubcategoriaFormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   mode="editar"
 *   subcategoria={subcategoriaSeleccionada}
 * />
 * 
 * DIFERENCIA CON CategoriaFormModal:
 * - CategoriaFormModal: padre_id = null (categorías padre)
 * - SubcategoriaFormModal: padre_id = requerido (subcategorías)
 */
export const SubcategoriaFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  subcategoria = null,
  padreId = null
}) => {
  
  // ============================================
  // HOOKS DE API
  // ============================================
  
  /**
   * Obtener categorías padre para el select
   * Solo se ejecuta si el modal está abierto
   */
  const { 
    categoriasPadre, 
    isLoading: isLoadingPadres 
  } = useGetCategoriasPadre()
  
  /**
   * Hooks para crear/actualizar
   */
  const { 
    createCategoria, 
    isLoading: isCreating 
  } = useCreateCategoria()
  
  const { 
    updateCategoria, 
    isLoading: isUpdating 
  } = useUpdateCategoria()
  
  // Estados combinados
  const isLoading = isCreating || isUpdating
  const isLoadingData = isLoadingPadres
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Manejar el submit del formulario
   * 
   * IMPORTANTE: Siempre incluir padre_id
   */
  const handleSubmit = async (data) => {
    try {
      // Asegurar que tenga padre_id
      const dataConPadre = {
        ...data,
        padre_id: mode === 'crear' 
          ? padreId || data.padre_id  // Priorizar padreId de props
          : data.padre_id             // Usar el del formulario
      }
      
      if (mode === 'crear') {
        // Validar que tenga padre_id
        if (!dataConPadre.padre_id) {
          console.error('❌ Error: padre_id es requerido para subcategorías')
          alert('Error: Debes seleccionar una categoría padre')
          return
        }
        
        await createCategoria(dataConPadre)
        console.log('✅ Subcategoría creada:', dataConPadre.nombre)
        
      } else {
        await updateCategoria({
          id: subcategoria.id,
          ...dataConPadre
        })
        console.log('✅ Subcategoría actualizada:', dataConPadre.nombre)
      }
      
      // Cerrar modal
      onClose()
      
    } catch (err) {
      console.error('❌ Error al guardar subcategoría:', err)
      // El modal no se cierra si hay error
    }
  }
  
  /**
   * Manejar cancelación
   */
  const handleCancel = () => {
    onClose()
  }
  
  // ============================================
  // DETERMINACIONES
  // ============================================
  
  // Título del modal
  const modalTitle = mode === 'crear' 
    ? '➕ Nueva Subcategoría' 
    : '✏️ Editar Subcategoría'
  
  // Datos iniciales del formulario
  const initialData = mode === 'editar' 
    ? subcategoria 
    : { padre_id: padreId }  // Pre-seleccionar padre si viene por props
  
  // Buscar nombre de la categoría padre (para mostrar)
  console.log('Categorias Padre:', categoriasPadre)
  const categoriaPadre = categoriasPadre.find(
    cat => cat.id === (padreId || subcategoria?.padre_id)
  )
  
  // ============================================
  // RENDER: Estado de carga de datos
  // ============================================
  
  if (isLoadingData && isOpen) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        size="md"
      >
        <div className="py-8">
          <Spinner size="lg" text="Cargando datos..." />
        </div>
      </Modal>
    )
  }
  
  // ============================================
  // RENDER: Formulario
  // ============================================
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      closeOnOverlay={!isLoading}
    >
      {/* Info de la categoría padre */}
      {categoriaPadre && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Categoría padre:</span>{' '}
            {categoriaPadre.icono} {categoriaPadre.nombre}
          </p>
        </div>
      )}
      
      {/* Formulario */}
      <CategoriaForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        isSubcategoria={true}              // ← DIFERENCIA CLAVE
        categoriasPadre={categoriasPadre}  // ← DIFERENCIA CLAVE
      />
      
      {/* Info adicional en modo editar */}
      {mode === 'editar' && subcategoria && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            ID: {subcategoria.id} | 
            Padre ID: {subcategoria.padre_id} | 
            Creada: {new Date(subcategoria.fecha_creacion).toLocaleDateString()}
          </p>
        </div>
      )}
      
      {/* Mensaje si no hay categorías padre disponibles */}
      {!isLoadingData && categoriasPadre.length === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ No hay categorías padre disponibles. 
            Crea primero una categoría padre.
          </p>
        </div>
      )}
    </Modal>
  )
}

export default SubcategoriaFormModal