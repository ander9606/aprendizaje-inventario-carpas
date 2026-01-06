// ============================================
// COMPONENTE: ProductCategoriaPadreCard
// Tarjeta de categoría padre para productos de alquiler
// ============================================

import { useState } from 'react'
import { Folder, Tent, FolderOpen, Edit, Plus } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import SymbolPicker from '../common/picker/SymbolPicker'
import SymbolRenderer from '../common/picker/SymbolRenderer'
import { useUpdateCategoriaProducto } from '../../hooks/UseCategoriasProductos'

/**
 * ProductCategoriaPadreCard
 *
 * Tarjeta que muestra una categoría padre de productos con:
 * - Emoji/icono editable (click para cambiar con SymbolPicker)
 * - Nombre y descripción
 * - Contador de subcategorías y productos
 * - Botones de navegación y acciones
 *
 * @param {Object} categoria - Datos de la categoría
 * @param {number} totalSubcategorias - Cantidad de subcategorías
 * @param {number} totalProductos - Cantidad de productos directos
 * @param {Function} onClick - Callback al hacer click en la tarjeta
 * @param {Function} onEdit - Callback para editar categoría
 * @param {Function} onCrearSubcategoria - Callback para crear subcategoría
 */
function ProductCategoriaPadreCard({
  categoria,
  totalSubcategorias,
  totalProductos,
  onClick,
  onEdit,
  onCrearSubcategoria,
}) {
  // Estado para el SymbolPicker
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)
  const [emojiActual, setEmojiActual] = useState(categoria.emoji || '📦')

  // Hook para actualizar categoría
  const { updateCategoriaSync } = useUpdateCategoriaProducto()

  // Handler para cambiar emoji
  const handleSelectSymbol = (nuevoEmoji) => {
    // Actualización optimista
    setEmojiActual(nuevoEmoji)
    setShowSymbolPicker(false)

    // Guardar en la API
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
          // Revertir al emoji original
          setEmojiActual(categoria.emoji || '📦')
        },
      }
    )
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

          <div className="flex-1">
            <Card.Title>{categoria.nombre}</Card.Title>
            {categoria.descripcion && (
              <p className="text-sm text-slate-500 mt-1">
                {categoria.descripcion}
              </p>
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
        <div className="flex gap-2">
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
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="flex-1"
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation()
              onCrearSubcategoria()
            }}
            className="flex-1"
          >
            Subcategoría
          </Button>
        </div>
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
