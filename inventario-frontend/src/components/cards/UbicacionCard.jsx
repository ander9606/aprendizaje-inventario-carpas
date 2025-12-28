// ============================================
// COMPONENTE: UbicacionCard
// Muestra una tarjeta de ubicación
// ============================================

import { MapPin, Edit, Trash2, Package, Star } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import { useMarcarComoPrincipal } from '../../hooks/Useubicaciones'

/**
 * UbicacionCard
 *
 * Tarjeta que muestra una ubicación con:
 * - Tipo de ubicación
 * - Nombre
 * - Badge de "Principal" si es la ubicación principal
 * - Información adicional
 * - Botones de editar, eliminar y marcar como principal
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
  // HOOKS
  // ============================================

  const { mutateAsync: marcarComoPrincipal, isLoading: isMarcando } = useMarcarComoPrincipal()

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtener emoji según el tipo de ubicación
   */
  const getEmojiPorTipo = (tipo) => {
    const emojis = {
      // Almacenamiento
      bodega: '🏢',
      taller: '🔧',
      transito: '🚚',
      // Lugares de eventos
      finca: '🌾',
      hacienda: '🏡',
      jardin: '🎊',
      club: '🏌️',
      hotel: '🏨',
      playa: '🏖️',
      parque: '🌳',
      residencia: '🏠',
      evento: '🎪',
      // Otros
      otro: '📍'
    }
    return emojis[tipo] || '📍'
  }

  /**
   * Obtener estilo del badge según el tipo de ubicación
   * Usamos clases completas para que Tailwind las incluya en el build
   */
  const getBadgeStyle = (tipo) => {
    const estilos = {
      // Almacenamiento
      bodega: 'bg-blue-100 text-blue-700',
      taller: 'bg-orange-100 text-orange-700',
      transito: 'bg-yellow-100 text-yellow-700',
      // Lugares de eventos
      finca: 'bg-green-100 text-green-700',
      hacienda: 'bg-amber-100 text-amber-700',
      jardin: 'bg-pink-100 text-pink-700',
      club: 'bg-emerald-100 text-emerald-700',
      hotel: 'bg-indigo-100 text-indigo-700',
      playa: 'bg-cyan-100 text-cyan-700',
      parque: 'bg-lime-100 text-lime-700',
      residencia: 'bg-rose-100 text-rose-700',
      evento: 'bg-purple-100 text-purple-700',
      // Otros
      otro: 'bg-gray-100 text-gray-700'
    }
    return estilos[tipo] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Obtener nombre legible del tipo
   */
  const getNombreTipo = (tipo) => {
    const nombres = {
      bodega: 'Bodega',
      taller: 'Taller',
      transito: 'Tránsito',
      finca: 'Finca',
      hacienda: 'Hacienda',
      jardin: 'Jardín',
      club: 'Club',
      hotel: 'Hotel',
      playa: 'Playa',
      parque: 'Parque',
      residencia: 'Residencia',
      evento: 'Evento',
      otro: 'Otro'
    }
    return nombres[tipo] || tipo
  }

  const badgeStyle = getBadgeStyle(ubicacion.tipo)
  const emoji = getEmojiPorTipo(ubicacion.tipo)
  const nombreTipo = getNombreTipo(ubicacion.tipo)

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

  /**
   * Marcar como principal
   */
  const handleMarcarComoPrincipal = async (e) => {
    e.stopPropagation()

    try {
      await marcarComoPrincipal(ubicacion.id)
      console.log('✅ Ubicación marcada como principal')
    } catch (error) {
      console.error('❌ Error al marcar como principal:', error)
      const mensaje = error.response?.data?.message || 'No se pudo marcar como principal'
      alert(mensaje)
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
      } ${ubicacion.es_principal ? 'ring-2 ring-yellow-400' : ''}`}
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
            {/* Badges */}
            <div className="mb-2 flex flex-wrap gap-2">
              {/* Badge: Principal */}
              {ubicacion.es_principal && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                  <Star className="w-3 h-3 fill-yellow-500" />
                  PRINCIPAL
                </span>
              )}

              {/* Badge: Tipo */}
              <span className={`
                inline-block px-2 py-1 text-xs font-medium rounded-full capitalize
                ${badgeStyle}
              `}>
                {nombreTipo}
              </span>

              {/* Badge: Inactiva */}
              {!ubicacion.activo && (
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
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
        {/* Botón: Marcar como principal (solo si NO es principal) */}
        {!ubicacion.es_principal && ubicacion.activo && (
          <div className="mb-3">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              icon={<Star className="w-4 h-4" />}
              onClick={handleMarcarComoPrincipal}
              loading={isMarcando}
              disabled={isMarcando}
            >
              Marcar como principal
            </Button>
          </div>
        )}

        {/* Botones: Editar y Eliminar */}
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
