// ============================================
// COMPONENTE: SubcategoriaCard (MISMO ESTILO QUE CategoriaPadreCard)
// ============================================

import { useState } from 'react'
import { Box, Plus, Edit, Trash2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Card from '@shared/components/Card'
import Button from '@shared/components/Button'
import ConfirmModal from '@shared/components/ConfirmModal'
import SymbolPicker from '@shared/components/picker/SymbolPicker'
import { IconoCategoria } from '@shared/components/IconoCategoria'
import { useUpdateCategoria, useDeleteCategoria } from '../../hooks/useCategorias'

const SubcategoriaCard = ({ 
  subcategoria,
  categoriaId,
  onEdit,
  onCreateElemento
}) => {

  const navigate = useNavigate()

  // Estado
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false)
  const [emojiActual, setEmojiActual] = useState(subcategoria.emoji || '📦')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // React Query
  const updateCategoria = useUpdateCategoria()
  const deleteCategoria = useDeleteCategoria()

  // Navegar a elementos
   const handleVerElementos = () => {
    navigate(`/inventario/categorias/${categoriaId}/subcategorias/${subcategoria.id}/elementos`)
  }

  // Crear elemento
  const handleCreateElemento = (e) => {
    e.stopPropagation()
    onCreateElemento?.(subcategoria.id)
  }

  // Editar
  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit?.(subcategoria)
  }

  // Cambiar emoji
  const handleSeleccionarEmoji = (nuevoEmoji) => {
    setEmojiActual(nuevoEmoji)
    setMostrarEmojiPicker(false)

    updateCategoria.mutate(
      {
        id: subcategoria.id,
        nombre: subcategoria.nombre,
        emoji: nuevoEmoji,
        padre_id: subcategoria.padre_id
      },
      {
        onSuccess: () => console.log('Emoji actualizado'),
        onError: () => {
          toast.error('No se pudo actualizar el emoji.')
          setEmojiActual(subcategoria.emoji || '📦')
        }
      }
    )
  }

  // Abrir modal de confirmación para eliminar
  const handleDelete = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    deleteCategoria.deleteCategoriaSync(
      subcategoria.id,
      {
        onSuccess: () => {
          setShowDeleteConfirm(false)
          toast.success(`Subcategoría "${subcategoria.nombre}" eliminada`)
        },
        onError: (error) => {
          setShowDeleteConfirm(false)
          const mensaje = error.response?.data?.mensaje || 'Error al eliminar subcategoría'
          toast.error(mensaje)
        }
      }
    )
  }

  return (
    <Card variant="outlined" className="shadow-sm hover:shadow-lg transition-all duration-200 border-slate-300">

      {/* HEADER */}
      <Card.Header>
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMostrarEmojiPicker(true)
            }}
            className="w-11 h-11 bg-blue-50 rounded-[10px] flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-100 transition-colors"
            title="Cambiar icono"
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
              {subcategoria.nombre}
            </h3>
          </div>
        </div>
      </Card.Header>

      {/* CONTENT */}
      <Card.Content>
        <div className="flex items-center gap-2 text-slate-600">
          <Box className="w-5 h-5" />
          <span className="font-medium">
            {subcategoria.total_elementos || 0} elemento{subcategoria.total_elementos !== 1 ? 's' : ''}
          </span>
        </div>
      </Card.Content>

      {/* FOOTER */}
      <Card.Footer>
        {/* Botones principales */}
        <div className="space-y-2 mb-3">
          <Button
            variant="primary"
            fullWidth
            icon={<ChevronRight />}
            onClick={handleVerElementos}
          >
            Ver elementos ({subcategoria.total_elementos || 0})
          </Button>

          <Button
            variant="outline"
            color="green"
            fullWidth
            icon={<Plus />}
            onClick={handleCreateElemento}
          >
            Crear elemento
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

      {/* SymbolPicker - Modal para elegir emoji o icono */}
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
        title={`¿Eliminar "${subcategoria.nombre}"?`}
        message="Se eliminarán todos los elementos asociados a esta subcategoría. Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        loading={deleteCategoria.isLoading}
      />

    </Card>
  )
}

export default SubcategoriaCard
