// ============================================
// COMPONENTE: ProductCategoriaPadreCard
// Tarjeta de categoría padre para productos de alquiler
// ============================================

import { useState, useRef, useEffect } from 'react'
import { Folder, Tent, FolderOpen, Edit, Plus, MoreVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Card from '@shared/components/Card'
import Button from '@shared/components/Button'
import SymbolPicker from '@shared/components/picker/SymbolPicker'
import SymbolRenderer from '@shared/components/picker/SymbolRenderer'
import {
  useUpdateCategoriaProducto,
  useDeleteCategoriaProducto,
} from '../../hooks/useCategoriasProductos'

/**
 * ProductCategoriaPadreCard
 *
 * Tarjeta que muestra una categoría padre de productos con:
 * - Emoji/icono editable (click para cambiar con SymbolPicker)
 * - Nombre y descripción
 * - Contador de subcategorías y productos
 * - Menú de 3 puntos con acciones (editar, crear subcategoría, eliminar)
 *
 * @param {Object} categoria - Datos de la categoría
 * @param {number} totalSubcategorias - Cantidad de subcategorías
 * @param {number} totalProductos - Cantidad de productos directos
 * @param {Function} onClick - Callback al hacer click en la tarjeta
 * @param {Function} onEdit - Callback para editar categoría
 * @param {Function} onCrearSubcategoria - Callback para crear subcategoría
 * @param {Function} onDeleted - Callback después de eliminar (opcional)
 */
function ProductCategoriaPadreCard({
  categoria,
  totalSubcategorias,
  totalProductos,
  onClick,
  onEdit,
  onCrearSubcategoria,
  onDeleted,
}) {
  // Estado para el SymbolPicker
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)
  const [emojiActual, setEmojiActual] = useState(categoria.emoji || '📦')

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
        id: categoria.id,
        nombre: categoria.nombre,
        emoji: nuevoEmoji,
        padre_id: categoria.padre_id || null,
      },
      {
        onSuccess: () => {
          console.log('✅ Emoji de categoría actualizado')
        },
        onError: (error) => {
          console.error('❌ Error al actualizar emoji:', error)
          setEmojiActual(categoria.emoji || '📦')
        },
      }
    )
  }

  // Handler para eliminar categoría
  const handleDelete = async () => {
    setShowMenu(false)

    // Verificar si tiene subcategorías
    if (totalSubcategorias > 0) {
      toast.error(
        `No se puede eliminar. Esta categoría tiene ${totalSubcategorias} subcategoría(s).`
      )
      return
    }

    // Verificar si tiene productos
    if (totalProductos > 0) {
      toast.error(
        `No se puede eliminar. Esta categoría tiene ${totalProductos} plantilla(s) asociada(s).`
      )
      return
    }

    const confirmacion = confirm(
      `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?\n\nEsta acción no se puede deshacer.`
    )

    if (confirmacion) {
      try {
        await deleteCategoria(categoria.id)
        toast.success('Categoría eliminada exitosamente')
        onDeleted?.()
      } catch (error) {
        console.error('Error al eliminar categoría:', error)
        toast.error(
          error.response?.data?.mensaje || 'Error al eliminar la categoría'
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
            <Card.Title>{categoria.nombre}</Card.Title>
            {categoria.descripcion && (
              <p className="text-sm text-slate-500 mt-1 truncate">
                {categoria.descripcion}
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
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onCrearSubcategoria()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Subcategoría
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
        <div className="flex items-center gap-4 text-slate-600">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            <span className="font-medium">
              {totalSubcategorias} subcategoría
              {totalSubcategorias !== 1 ? 's' : ''}
            </span>
          </div>
          {totalProductos > 0 && (
            <div className="flex items-center gap-2">
              <Tent className="w-5 h-5" />
              <span>
                {totalProductos} plantilla{totalProductos !== 1 ? 's' : ''}
              </span>
            </div>
          )}
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
          Ver Subcategorías
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

export default ProductCategoriaPadreCard
