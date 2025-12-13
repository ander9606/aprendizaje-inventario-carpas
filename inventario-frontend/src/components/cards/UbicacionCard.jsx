// ============================================
// COMPONENTE: UbicacionCard
// Muestra una tarjeta de ubicación
// ============================================

import { MapPin, Edit, Trash2, Package } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'

/**
 * UbicacionCard
 *
 * Tarjeta que muestra una ubicación con:
 * - Tipo de ubicación
 * - Nombre
 * - Información adicional
 * - Botones de editar y eliminar
 *
 * @param {Object} ubicacion - Datos de la ubicación
 * @param {Function} onEdit - Callback para editar ubicación
 * @param {Function} onDelete - Callback para eliminar ubicación
 */
const UbicacionCard = ({
  ubicacion,
  onEdit,
  onDelete
}) => {

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtener emoji según el tipo de ubicación
   */
  const getEmojiPorTipo = (tipo) => {
    const emojis = {
      bodega: '🏢',
      finca: '🌾',
      evento: '🎪',
      taller: '🔧',
      transito: '🚚',
      otro: '📍'
    }
    return emojis[tipo] || '📍'
  }

  /**
   * Obtener color según el tipo de ubicación
   */
  const getColorPorTipo = (tipo) => {
    const colores = {
      bodega: 'blue',
      finca: 'green',
      evento: 'purple',
      taller: 'orange',
      transito: 'yellow',
      otro: 'gray'
    }
    return colores[tipo] || 'gray'
  }

  const color = getColorPorTipo(ubicacion.tipo)
  const emoji = getEmojiPorTipo(ubicacion.tipo)

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Manejar edición
   */
  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(ubicacion)
    }
  }

  /**
   * Manejar eliminación
   */
  const handleDelete = (e) => {
    e.stopPropagation()

    const confirmacion = confirm(
      `¿Estás seguro de eliminar la ubicación "${ubicacion.nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    )

    if (confirmacion && onDelete) {
      onDelete(ubicacion.id)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card
      variant="outlined"
      className={`hover:shadow-lg transition-all duration-200 ${
        !ubicacion.activo ? 'opacity-60' : ''
      }`}
    >
      {/* ============================================
          HEADER: Tipo y nombre
          ============================================ */}
      <Card.Header>
        <div className="flex items-start gap-3">
          {/* Emoji del tipo */}
          <div className={`text-4xl flex-shrink-0`}>
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badge del tipo */}
            <div className="mb-2">
              <span className={`
                inline-block px-2 py-1 text-xs font-medium rounded-full
                bg-${color}-100 text-${color}-700
              `}>
                {ubicacion.tipo}
              </span>
              {!ubicacion.activo && (
                <span className="ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  Inactiva
                </span>
              )}
            </div>

            {/* Nombre */}
            <Card.Title className="truncate">
              {ubicacion.nombre}
            </Card.Title>
          </div>
        </div>
      </Card.Header>

      {/* ============================================
          CONTENT: Información adicional
          ============================================ */}
      <Card.Content>
        <div className="space-y-2 text-sm text-slate-600">
          {/* Ciudad */}
          {ubicacion.ciudad && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{ubicacion.ciudad}</span>
            </div>
          )}

          {/* Responsable */}
          {ubicacion.responsable && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">👤</span>
              <span className="truncate">{ubicacion.responsable}</span>
            </div>
          )}

          {/* Total de items (si existe) */}
          {ubicacion.total_items !== undefined && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">
                {ubicacion.total_items} {ubicacion.total_items === 1 ? 'item' : 'items'}
              </span>
            </div>
          )}
        </div>
      </Card.Content>

      {/* ============================================
          FOOTER: Botones de acción
          ============================================ */}
      <Card.Footer>
        <div className="flex gap-2 justify-between">
          {/* Botón: Editar */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={handleEdit}
            className="flex-1"
          >
            Editar
          </Button>

          {/* Botón: Eliminar */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
            className="flex-1"
          >
            Eliminar
          </Button>
        </div>
      </Card.Footer>
    </Card>
  )
}

export default UbicacionCard
