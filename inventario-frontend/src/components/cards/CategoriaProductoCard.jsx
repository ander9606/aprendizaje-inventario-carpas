// ============================================
// COMPONENTE: CategoriaProductoCard
// Card adaptativa para categorías de productos (padre o hijo)
// ============================================

import { useState } from 'react'
import { Folder, Package, Plus, Edit, Trash2, ChevronRight } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import EmojiPicker from '../common/picker/Emojipicker'
import { IconoCategoria } from '../common/IconoCategoria'
import { useUpdateCategoriaProducto, useDeleteCategoriaProducto } from '../../hooks/UseCategoriasProductos'

/**
 * CategoriaProductoCard - Card adaptativa
 *
 * Se adapta según el tipo de categoría:
 * - Categoría padre (sin categoria_padre_id): muestra subcategorías
 * - Subcategoría (con categoria_padre_id): muestra productos
 */
const CategoriaProductoCard = ({
  categoria,
  onVerContenido,
  onCrearHijo,
  onEdit,
  totalHijos = 0,
  totalProductos = 0
}) => {
  // ============================================
  // ESTADO LOCAL
  // ============================================
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false)
  const [emojiActual, setEmojiActual] = useState(categoria.emoji || '📦')

  // ============================================
  // HOOKS
  // ============================================
  const { updateCategoria } = useUpdateCategoriaProducto()
  const { deleteCategoria, isPending: isDeleting } = useDeleteCategoriaProducto()

  // Determinar si es categoría padre o subcategoría
  const esPadre = !categoria.categoria_padre_id

  // ============================================
  // HANDLERS
  // ============================================

  const handleVerContenido = () => {
    onVerContenido?.(categoria)
  }

  const handleCrearHijo = (e) => {
    e.stopPropagation()
    onCrearHijo?.(categoria)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit?.(categoria)
  }

  const handleSeleccionarEmoji = (nuevoEmoji) => {
    setEmojiActual(nuevoEmoji)
    setMostrarEmojiPicker(false)

    updateCategoria(
      {
        id: categoria.id,
        nombre: categoria.nombre,
        emoji: nuevoEmoji,
        categoria_padre_id: categoria.categoria_padre_id
      },
      {
        onSuccess: () => console.log('Emoji actualizado'),
        onError: () => {
          alert('No se pudo actualizar el emoji.')
          setEmojiActual(categoria.emoji || '📦')
        }
      }
    )
  }

  const handleDelete = (e) => {
    e.stopPropagation()

    const mensaje = esPadre
      ? `¿Eliminar categoría "${categoria.nombre}"?\n\nSi tiene subcategorías, deberás eliminarlas primero.`
      : `¿Eliminar subcategoría "${categoria.nombre}"?\n\nSi tiene productos asociados, no podrá eliminarse.`

    if (!confirm(mensaje)) return

    deleteCategoria(
      categoria.id,
      {
        onSuccess: () => console.log('Categoría eliminada'),
        onError: (error) => {
          const msg = error.response?.data?.mensaje || 'Error al eliminar'
          alert(msg)
        }
      }
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card variant="outlined" className="hover:shadow-lg transition-all duration-200">

      {/* HEADER */}
      <Card.Header>
        <div className="flex items-center gap-3">
          {/* Emoji/Icono clickeable */}
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

          {/* Nombre y badge de tipo */}
          <div className="flex-1">
            <Card.Title>
              {categoria.nombre}
            </Card.Title>
            {/* Mostrar categoría padre si es subcategoría */}
            {!esPadre && categoria.categoria_padre_nombre && (
              <span className="text-xs text-slate-500">
                en {categoria.categoria_padre_nombre}
              </span>
            )}
          </div>

          {/* Badge indicador */}
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${esPadre
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
            }
          `}>
            {esPadre ? 'Categoría' : 'Subcategoría'}
          </span>
        </div>
      </Card.Header>

      {/* CONTENT - Contadores */}
      <Card.Content>
        <div className="flex items-center gap-4 text-slate-600">
          {/* Contador de subcategorías (solo para padres) */}
          {esPadre && (
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              <span className="font-medium">
                {totalHijos || categoria.hijos?.length || 0} subcategoría{(totalHijos || categoria.hijos?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Contador de productos */}
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-medium">
              {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </Card.Content>

      {/* FOOTER - Acciones */}
      <Card.Footer>
        {/* Botones principales */}
        <div className="space-y-2 mb-4">
          {/* Ver contenido */}
          <Button
            variant="primary"
            fullWidth
            icon={<ChevronRight />}
            onClick={handleVerContenido}
          >
            {esPadre ? `Ver subcategorías` : `Ver productos`}
          </Button>

          {/* Crear hijo (subcategoría para padres, o podría ser producto) */}
          {esPadre && (
            <Button
              variant="secondary"
              fullWidth
              icon={<Plus />}
              onClick={handleCrearHijo}
            >
              Nueva subcategoría
            </Button>
          )}
        </div>

        {/* Botones secundarios */}
        <div className="flex gap-2 justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={handleEdit}
            className="flex-1"
          >
            Editar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting}
            className="flex-1"
          >
            Eliminar
          </Button>
        </div>
      </Card.Footer>

      {/* EmojiPicker Modal */}
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

export default CategoriaProductoCard
