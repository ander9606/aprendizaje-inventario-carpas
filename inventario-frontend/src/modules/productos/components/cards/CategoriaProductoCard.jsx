// ============================================
// COMPONENTE: CategoriaProductoCard
// Card adaptativa para categorías de productos (padre o hijo)
// ============================================

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, Package, Plus, Edit, Trash2, ChevronRight } from 'lucide-react'
import Card from '@shared/components/Card'
import Button from '@shared/components/Button'
import EmojiPicker from '@shared/components/picker/Emojipicker'
import { IconoCategoria } from '@shared/components/IconoCategoria'
import { useUpdateCategoriaProducto, useDeleteCategoriaProducto } from '../../hooks/useCategoriasProductos'

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
  const { t } = useTranslation()
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
      ? `${t('products.categoryCard.confirmDeleteCategory', { name: categoria.nombre })}\n\n${t('products.categoryCard.deleteHasSubcategoriesWarning')}`
      : `${t('products.categoryCard.confirmDeleteSubcategory', { name: categoria.nombre })}\n\n${t('products.categoryCard.deleteHasProductsWarning')}`

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
            title={t('common.clickToChangeIcon')}
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
                {t('common.in')} {categoria.categoria_padre_nombre}
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
            {esPadre ? t('common.category') : t('common.subcategory')}
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
                {t('products.categoryCard.subcategoriesCount', { count: totalHijos || categoria.hijos?.length || 0 })}
              </span>
            </div>
          )}

          {/* Contador de productos */}
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-medium">
              {t('products.categoryCard.productsCount', { count: totalProductos })}
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
            {esPadre ? t('products.viewSubcategories') : t('products.categoryCard.viewProducts')}
          </Button>

          {/* Crear hijo (subcategoría para padres, o podría ser producto) */}
          {esPadre && (
            <Button
              variant="secondary"
              fullWidth
              icon={<Plus />}
              onClick={handleCrearHijo}
            >
              {t('products.newSubcategory')}
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
            {t('common.edit')}
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
            {t('common.delete')}
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
