// ============================================
// COMPONENTE: CategoriaPadreCard
// Muestra una tarjeta de categoría padre con emoji editable
// ============================================

import { useState } from 'react'
import { Folder, Plus, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Card from '@shared/components/Card'
import Button from '@shared/components/Button'
import ConfirmModal from '@shared/components/ConfirmModal'
import SymbolPicker from '@shared/components/picker/SymbolPicker'
import { IconoCategoria } from '@shared/components/IconoCategoria'
import { useUpdateCategoria, useDeleteCategoria } from '../../hooks/useCategorias'
import { useTranslation } from 'react-i18next'

/**
 * CategoriaPadreCard
 * 
 * Tarjeta que muestra una categoría padre con:
 * - Emoji editable (click para cambiar)
 * - Nombre de la categoría
 * - Contador de subcategorías
 * - Botones de navegación y acciones
 * 
 * @param {Object} categoria - Datos de la categoría
 * @param {Function} onCreateSubcategoria - Callback para crear subcategoría
 * @param {Function} onEdit - Callback para editar categoría
 */
const CategoriaPadreCard = ({
  categoria,
  onCreateSubcategoria,
  onEdit
}) => {
  const { t } = useTranslation()
  
  const navigate = useNavigate()
  
  // ============================================
  // ESTADO LOCAL
  // ============================================
  
  // Controla si el EmojiPicker está visible
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false)

  // Emoji actual (para actualización optimista en la UI)
  const [emojiActual, setEmojiActual] = useState(categoria.emoji || '📦')

  // Modal de confirmación para eliminar
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // ============================================
  // REACT QUERY HOOKS
  // ============================================
  
  // Hook para actualizar categoría
  // Devuelve: { mutate, mutateAsync, isLoading, error }
  const updateCategoria = useUpdateCategoria()
  
  // Hook para eliminar categoría
  const deleteCategoria = useDeleteCategoria()
  
  // ============================================
  // HANDLERS - Navegación
  // ============================================
  
  /**
   * Navegar a la página de subcategorías
   */
  const handleVerSubcategorias = () => {
    navigate(`/inventario/categorias/${categoria.id}`)
  }
  
  /**
   * Abrir modal para crear subcategoría
   */
  const handleCreateSubcategoria = (e) => {
    e.stopPropagation()
    if (onCreateSubcategoria) {
      onCreateSubcategoria(categoria.id)
    }
  }
  
  /**
   * Abrir modal para editar categoría
   */
  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(categoria)
    }
  }
  
  // ============================================
  // HANDLER - Seleccionar Emoji (OPCIÓN 2)
  // ============================================
  
  /**
   * Handler para cuando se selecciona un nuevo emoji
   * 
   * VERSIÓN CON mutate() y callbacks (Opción 2)
   * 
   * FLUJO:
   * 1. Actualiza el emoji localmente (optimistic update)
   * 2. Cierra el picker
   * 3. Llama a la API con mutate()
   * 4. Si hay éxito: solo muestra mensaje (el cache se invalida automáticamente)
   * 5. Si hay error: revierte el emoji y muestra alerta
   */
  const handleSeleccionarEmoji = (nuevoEmoji) => {
    console.log('✨ Emoji seleccionado:', nuevoEmoji)
    
    // 1. Actualización optimista en la UI
    setEmojiActual(nuevoEmoji)
    
    // 2. Cerrar el picker
    setMostrarEmojiPicker(false)
    
    // 3. Llamar a la API usando mutate()
    // ✅ CORRECTO: usar .mutate() no updateCategoria() directamente
    updateCategoria.mutate(
      // PRIMER ARGUMENTO: datos a enviar
      { 
        id: categoria.id, 
        nombre: categoria.nombre,      // ✅ Obligatorio
        emoji: nuevoEmoji,             // ✅ El nuevo emoji
        padre_id: categoria.padre_id   // ✅ Mantener relación
      },
      // SEGUNDO ARGUMENTO: callbacks
      {
        onSuccess: () => {
          // ✅ Mutación exitosa
          console.log('✅ Emoji actualizado en el servidor')
          // React Query ya invalidó el cache automáticamente
          // gracias al onSuccess en useUpdateCategoria
        },
        onError: (error) => {
          // ❌ Error en la mutación
          console.error('❌ Error al actualizar emoji:', error)
          
          // Mostrar mensaje al usuario
          const mensaje = error.response?.data?.mensaje || 'No se pudo actualizar el emoji.'
          toast.error(mensaje)
          
          // Revertir al emoji original
          setEmojiActual(categoria.emoji || '📦')
        }
      }
    )
  }
  
  // ============================================
  // HANDLER - Eliminar Categoría
  // ============================================
  
  /**
   * Abrir modal de confirmación para eliminar
   */
  const handleDelete = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  /**
   * Confirmar eliminación de categoría
   */
  const handleConfirmDelete = () => {
    deleteCategoria.deleteCategoriaSync(
      categoria.id,
      {
        onSuccess: () => {
          setShowDeleteConfirm(false)
          toast.success(`Categoría "${categoria.nombre}" eliminada`)
        },
        onError: (error) => {
          setShowDeleteConfirm(false)
          const mensaje = error.response?.data?.mensaje ||
            'No se pudo eliminar la categoría. Puede tener subcategorías o elementos.'
          toast.error(mensaje)
        }
      }
    )
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <Card
      variant="outlined"
      className="shadow-sm hover:shadow-lg transition-shadow duration-200 border-slate-300"
    >
      {/* ============================================
          HEADER: Emoji en caja coloreada + nombre
          ============================================ */}
      <Card.Header>
        <div className="flex items-start gap-3">
          <button
            onClick={() => setMostrarEmojiPicker(true)}
            className="w-11 h-11 bg-blue-50 rounded-[10px] flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-100 transition-colors"
            title="Click para cambiar el icono"
            type="button"
          >
            <IconoCategoria
              value={emojiActual}
              className="text-2xl text-slate-700"
              size={24}
            />
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-slate-900 truncate">
              {categoria.nombre}
            </h3>
            {categoria.descripcion && (
              <p className="text-[13px] text-slate-500 mt-0.5 line-clamp-2">
                {categoria.descripcion}
              </p>
            )}
          </div>
        </div>
      </Card.Header>
      
      {/* ============================================
          CONTENT: Contador de subcategorías
          ============================================ */}
      <Card.Content>
        <div className="flex items-center gap-2 text-slate-600">
          <Folder className="w-5 h-5" />
          <span className="font-medium">
            {categoria.total_subcategorias || 0} subcategoría
            {categoria.total_subcategorias !== 1 ? 's' : ''}
          </span>
        </div>
      </Card.Content>
      
      {/* ============================================
          FOOTER: Botones de acción
          ============================================ */}
      <Card.Footer>
  {/* Botones principales */}
  <div className="space-y-2 mb-3">
    <Button
      variant="primary"
      fullWidth
      onClick={handleVerSubcategorias}
    >
      Ver subcategorías
    </Button>

    <Button
      variant="outline"
      color="green"
      fullWidth
      icon={<Plus />}
      onClick={handleCreateSubcategoria}
    >
      Nueva subcategoría
    </Button>
  </div>

  {/* Botones secundarios */}
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      icon={<Edit className="w-4 h-4" />}
      onClick={handleEdit}
      className="flex-1"
    >
      Editar
    </Button>

    <Button
      variant="outline"
      color="red"
      size="sm"
      icon={<Trash2 className="w-4 h-4" />}
      onClick={handleDelete}
      loading={deleteCategoria.isLoading}
      disabled={deleteCategoria.isLoading}
      className="flex-1"
    >
      Eliminar
    </Button>
  </div>
</Card.Footer>
      
      {/* ============================================
          EMOJI PICKER (Modal)
          Se renderiza solo cuando mostrarEmojiPicker es true
          ============================================ */}
      {mostrarEmojiPicker && (
        <SymbolPicker
          open={mostrarEmojiPicker}
          value={emojiActual}
          onSelect={handleSeleccionarEmoji}
          onClose={() => setMostrarEmojiPicker(false)}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={`¿Eliminar "${categoria.nombre}"?`}
        message="Se eliminarán todos los datos asociados a esta categoría. Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        loading={deleteCategoria.isLoading}
      />
    </Card>
  )
}

export default CategoriaPadreCard

/**
 * ============================================
 * NOTAS IMPORTANTES Y MEJORES PRÁCTICAS
 * ============================================
 * 
 * 1. ACTUALIZACIÓN OPTIMISTA:
 *    Se usa setEmojiActual() para actualizar la UI inmediatamente,
 *    antes de que la API responda. Esto hace que la app se sienta
 *    más rápida y responsiva.
 * 
 * 2. MANEJO DE ERRORES:
 *    Si la API falla, revertimos el emoji al valor original
 *    con setEmojiActual(categoria.emoji).
 * 
 * 3. MUTATE vs MUTATEASYNC:
 *    - mutate(): No devuelve Promise, usa callbacks
 *    - mutateAsync(): Devuelve Promise, usa async/await
 *    
 *    Usamos mutate() porque es más simple para este caso.
 * 
 * 4. INVALIDACIÓN DE CACHE:
 *    No la hacemos aquí porque ya está en useUpdateCategoria:
 *    - queryClient.invalidateQueries({ queryKey: ['categorias'] })
 *    - queryClient.invalidateQueries({ queryKey: ['categorias', 'padres'] })
 * 
 * 5. PROPS DEL COMPONENTE:
 *    - categoria: objeto con todos los datos de la categoría
 *    - onCreateSubcategoria: función para abrir modal de crear
 *    - onEdit: función para abrir modal de editar
 * 
 * 6. DATOS REQUERIDOS EN LA ACTUALIZACIÓN:
 *    El backend requiere estos campos en el PUT:
 *    - id (en la URL o en el body)
 *    - nombre (obligatorio)
 *    - emoji (opcional)
 *    - padre_id (opcional, puede ser null)
 * 
 * 7. REACT QUERY INVALIDATION:
 *    Cuando se ejecuta updateCategoria.mutate(), el onSuccess
 *    en useUpdateCategoria invalida automáticamente:
 *    - ['categorias']
 *    - ['categorias', 'padres']
 *    - ['categorias', id]
 *    
 *    Esto hace que React Query recargue los datos automáticamente
 *    y el componente se re-renderiza con los nuevos datos.
 */