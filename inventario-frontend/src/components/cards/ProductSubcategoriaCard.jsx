// ============================================
// COMPONENTE: ProductSubcategoriaCard
// Tarjeta de subcategoría para productos de alquiler
// ============================================

import { useState, useRef, useEffect } from 'react'
import { Tent, FolderOpen, Edit, MoreVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../common/Card'
import Button from '../common/Button'
import SymbolPicker from '../common/picker/SymbolPicker'
import SymbolRenderer from '../common/picker/SymbolRenderer'
import {
  useUpdateCategoriaProducto,
  useDeleteCategoriaProducto,
} from '../../hooks/UseCategoriasProductos'

/**
 * ProductSubcategoriaCard
 *
 * Tarjeta que muestra una subcategoría de productos con:
 * - Emoji/icono editable (click para cambiar con SymbolPicker)
 * - Nombre y descripción
 * - Contador de plantillas/productos
 * - Menú de 3 puntos con acciones (editar, eliminar)
 *
 * @param {Object} subcategoria - Datos de la subcategoría
 * @param {number} totalProductos - Cantidad de plantillas en esta subcategoría
 * @param {Function} onClick - Callback al hacer click en la tarjeta
 * @param {Function} onEdit - Callback para editar subcategoría
 * @param {Function} onDeleted - Callback después de eliminar (opcional)
 */
function ProductSubcategoriaCard({
  subcategoria,
  totalProductos,
  onClick,
  onEdit,
  onDeleted,
}) {
  // Estado para el SymbolPicker
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)
  const [emojiActual, setEmojiActual] = useState(subcategoria.emoji || '📦')

  // Estado para el menú desplegable
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Hooks
  const { updateCategoriaSync } = useUpdateCategoriaProducto()
  const { deleteCategoria, isPending: isDeleting } = useDeleteCategoriaProducto()

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Handler para cambiar emoji
  const handleSelectSymbol = (nuevoEmoji) => {
    setEmojiActual(nuevoEmoji)
    setShowSymbolPicker(false)

    updateCategoriaSync(
      {
        id: subcategoria.id,
        nombre: subcategoria.nombre,
        emoji: nuevoEmoji,
        padre_id: subcategoria.padre_id,
      },
      {
        onSuccess: () => {
          console.log('✅ Emoji de subcategoría actualizado')
        },
        onError: (error) => {
          console.error('❌ Error al actualizar emoji:', error)
          setEmojiActual(subcategoria.emoji || '📦')
        },
      }
    )
  }

  // Handler para eliminar subcategoría
  const handleDelete = async () => {
    setShowMenu(false)

    // Verificar si tiene productos
    if (totalProductos > 0) {
      toast.error(
        `No se puede eliminar. Esta subcategoría tiene ${totalProductos} plantilla(s) asociada(s).`
      )
      return
    }

    const confirmacion = confirm(
      `¿Estás seguro de eliminar la subcategoría "${subcategoria.nombre}"?\n\nEsta acción no se puede deshacer.`
    )

    if (confirmacion) {
      try {
        await deleteCategoria(subcategoria.id)
        toast.success('Subcategoría eliminada exitosamente')
        onDeleted?.()
      } catch (error) {
        console.error('Error al eliminar subcategoría:', error)
        toast.error(
          error.response?.data?.mensaje || 'Error al eliminar la subcategoría'
        )
      }
    }
  }

  return (
    <Card
      variant="outlined"
      className="hover:shadow-lg transition-all duration-200 hover:border-emerald-300 cursor-pointer"
      onClick={onClick}
    >
      <Card.Header>
        <div className="flex items-center gap-3">
          {/* Emoji/Icono clickeable */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowSymbolPicker(true)
            }}
            className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
            title="Click para cambiar el icono"
          >
            <SymbolRenderer
              value={emojiActual}
              size={40}
              className="text-4xl"
            />
          </button>

          <div className="flex-1 min-w-0">
            <Card.Title>{subcategoria.nombre}</Card.Title>
            {subcategoria.descripcion && (
              <p className="text-sm text-slate-500 mt-1 truncate">
                {subcategoria.descripcion}
              </p>
            )}
          </div>

          {/* Menú de 3 puntos */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Más opciones"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onEdit()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Content>
        <div className="flex items-center gap-2 text-slate-600">
          <Tent className="w-5 h-5" />
          <span className="font-medium">
            {totalProductos} plantilla{totalProductos !== 1 ? 's' : ''}
          </span>
        </div>
      </Card.Content>

      <Card.Footer>
        <Button
          variant="primary"
          fullWidth
          icon={<FolderOpen className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          Ver Plantillas
        </Button>
      </Card.Footer>

      {/* SymbolPicker Modal */}
      <SymbolPicker
        open={showSymbolPicker}
        value={emojiActual}
        onSelect={handleSelectSymbol}
        onClose={() => setShowSymbolPicker(false)}
      />
    </Card>
  )
}

export default ProductSubcategoriaCard
