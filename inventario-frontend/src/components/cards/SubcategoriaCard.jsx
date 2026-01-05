// ============================================
// COMPONENTE: SubcategoriaCard (MISMO ESTILO QUE CategoriaPadreCard)
// ============================================

import { useState } from 'react'
import { Box, Plus, Edit, Trash2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../common/Card'
import Button from '../common/Button'
import EmojiPicker from '../common/picker/Emojipicker'
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
          alert('No se pudo actualizar el emoji.')
          setEmojiActual(subcategoria.emoji || '📦')
        }
      }
    )
  }

  // Eliminar
  const handleDelete = (e) => {
    e.stopPropagation()

    if (!confirm(`¿Eliminar subcategoría "${subcategoria.nombre}"?`)) return

    deleteCategoria.deleteCategoriaSync(
      subcategoria.id,
      {
        onSuccess: () => console.log('Subcategoría eliminada'),
        onError: (error) => {
            console.error('Error al eliminar subcategoría:', error)
            const mensaje = error.response?.data?.mensaje || 'Error al eliminar subcategoría'
            alert(mensaje)
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
            variant="ghost"
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

      {/* EmojiPicker */}
      {mostrarEmojiPicker && (
        <EmojiPicker
          open={mostrarEmojiPicker}
          onSelect={handleSeleccionarEmoji}
          onClose={() => setMostrarEmojiPicker(false)}
        />
      )}

    </Card>
  )
}

export default SubcategoriaCard
