// ============================================
// COMPONENTE: EVENTOS DESGLOSE
// Muestra el desglose de cantidades en eventos activos
// ============================================

import { Calendar, User, MapPin, Clock, Package } from 'lucide-react'

/**
 * Formatea una fecha para mostrar
 */
const formatDate = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short'
  })
}

/**
 * Componente EventosDesglose - Muestra cantidades en eventos
 *
 * @param {array} eventos - Array de eventos con cantidades
 * @param {number} totalEnEventos - Total de unidades en eventos
 * @param {boolean} compact - Vista compacta
 *
 * @example
 * <EventosDesglose
 *   eventos={[
 *     {
 *       alquiler_id: 5,
 *       evento_nombre: "Boda Martínez",
 *       cliente: "Familia Martínez",
 *       cantidad: 20,
 *       fecha_evento: "2024-01-20",
 *       fecha_desmontaje: "2024-01-22"
 *     }
 *   ]}
 *   totalEnEventos={55}
 * />
 */
export const EventosDesglose = ({
  eventos = [],
  totalEnEventos = 0,
  compact = false,
  className = '',
  ...props
}) => {
  if (eventos.length === 0) {
    return null
  }

  // ============================================
  // VISTA COMPACTA
  // ============================================
  if (compact) {
    return (
      <div className={`bg-orange-50 rounded-lg p-3 ${className}`} {...props}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-800 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            <span>En eventos</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-orange-900">{totalEnEventos}</span>
            <span className="text-sm text-orange-700">
              en {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // VISTA NORMAL
  // ============================================
  return (
    <div className={`bg-orange-50 rounded-lg overflow-hidden ${className}`} {...props}>
      {/* Header */}
      <div className="px-4 py-3 bg-orange-100 border-b border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-900 font-medium">
            <Calendar className="w-5 h-5" />
            <span>En Eventos Activos</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-700" />
            <span className="text-xl font-bold text-orange-900">{totalEnEventos}</span>
            <span className="text-sm text-orange-700">unidades</span>
          </div>
        </div>
      </div>

      {/* Lista de eventos */}
      <div className="divide-y divide-orange-200">
        {eventos.map((evento, idx) => (
          <EventoItem key={evento.alquiler_id || idx} evento={evento} />
        ))}
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: EVENTO ITEM
// ============================================
const EventoItem = ({ evento }) => {
  const {
    evento_nombre,
    cliente,
    cantidad,
    fecha_evento,
    fecha_desmontaje,
    ubicacion,
    ciudad,
    estado
  } = evento

  // Determinar color por estado del alquiler
  const esActivo = estado === 'activo'

  return (
    <div className="p-4 hover:bg-orange-100/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Info del evento */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Nombre del evento */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-orange-900 truncate">
              {evento_nombre || 'Evento sin nombre'}
            </span>
            {esActivo && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                En curso
              </span>
            )}
          </div>

          {/* Cliente */}
          {cliente && (
            <div className="flex items-center gap-2 text-sm text-orange-800">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{cliente}</span>
            </div>
          )}

          {/* Ubicación */}
          {ubicacion && (
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {ubicacion}
                {ciudad && <span className="text-orange-600"> ({ciudad})</span>}
              </span>
            </div>
          )}

          {/* Fechas */}
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {formatDate(fecha_evento)}
              {fecha_desmontaje && (
                <> - Desmontaje: {formatDate(fecha_desmontaje)}</>
              )}
            </span>
          </div>
        </div>

        {/* Cantidad */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-2xl font-bold text-orange-900">{cantidad}</span>
          <span className="text-xs text-orange-700">
            {cantidad === 1 ? 'unidad' : 'unidades'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default EventosDesglose
