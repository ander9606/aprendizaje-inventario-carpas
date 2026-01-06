// ============================================
// COMPONENTE: ProductSubcategoriaCard
// Tarjeta de subcategoría para productos de alquiler
// ============================================

import { useState } from 'react'
import { Tent, FolderOpen, Edit } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import SymbolPicker from '../common/picker/SymbolPicker'
import SymbolRenderer from '../common/picker/SymbolRenderer'
import { useUpdateCategoriaProducto } from '../../hooks/UseCategoriasProductos'

/**
 * ProductSubcategoriaCard
 *
 * Tarjeta que muestra una subcategoría de productos con:
 * - Emoji/icono editable (click para cambiar con SymbolPicker)
 * - Nombre y descripción
 * - Contador de plantillas/productos
 * - Botones de navegación y acciones
 *
 * @param {Object} subcategoria - Datos de la subcategoría
 * @param {number} totalProductos - Cantidad de plantillas en esta subcategoría
 * @param {Function} onClick - Callback al hacer click en la tarjeta
 * @param {Function} onEdit - Callback para editar subcategoría
 */
function ProductSubcategoriaCard({
  subcategoria,
  totalProductos,
  onClick,
  onEdit,
}) {
  // Estado para el SymbolPicker
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)
  const [emojiActual, setEmojiActual] = useState(subcategoria.emoji || '📦')

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
          // Revertir al emoji original
          setEmojiActual(subcategoria.emoji || '📦')
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
            <Card.Title>{subcategoria.nombre}</Card.Title>
            {subcategoria.descripcion && (
              <p className="text-sm text-slate-500 mt-1">
                {subcategoria.descripcion}
              </p>
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
          className="mb-2"
        >
          Ver Plantillas
        </Button>
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          icon={<Edit className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          Editar
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
