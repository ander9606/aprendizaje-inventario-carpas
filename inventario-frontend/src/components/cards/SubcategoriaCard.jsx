// ============================================
// COMPONENTE: SubcategoriaCard (MISMO ESTILO QUE CategoriaPadreCard)
// ============================================

import { useState } from 'react'
import { Box, Plus, Edit, Trash2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Card from '../common/Card'
import Button from '../common/Button'
import ConfirmModal from '../common/ConfirmModal'
import SymbolPicker from '../common/picker/SymbolPicker'
import { IconoCategoria } from '../common/IconoCategoria'
import { useUpdateCategoria, useDeleteCategoria } from '../../hooks/Usecategorias'

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
    <Card variant="outlined" className="hover:shadow-lg transition-all duration-200">

      {/* HEADER */}
      <Card.Header>
        <div className="flex items-center gap-3">

          {/* Emoji/Icono */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMostrarEmojiPicker(true)
            }}
            className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
            title="Cambiar icono"
            type="button"
          >
            <IconoCategoria
              value={emojiActual}
              className="text-4xl text-slate-700"
              size={40}
            />
          </button>

          {/* Nombre */}
          <Card.Title className="flex-1">
            {subcategoria.nombre}
          </Card.Title>

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
        <div className="space-y-2 mb-4">

          {/* Ver elementos */}
          <Button 
            variant="primary"
            fullWidth
            icon={<ChevronRight />}
            onClick={handleVerElementos}
          >
            Ver elementos ({subcategoria.total_elementos || 0})
          </Button>

          {/* Crear elemento */}
          <Button 
            variant="secondary"
            fullWidth
            icon={<Plus />}
            onClick={handleCreateElemento}
          >
            Crear elemento
          </Button>
        </div>

        {/* Botones secundarios */}
        <div className="flex gap-2 justify-between">
          
          {/* Editar */}
          <Button 
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={handleEdit}
            className="flex-1"
          >
            Editar
          </Button>

          {/* Eliminar */}
          <Button
            variant="danger"
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
