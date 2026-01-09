// ============================================
// COMPONENTE: EventTooltip
// Tooltip para mostrar detalles de un evento
// ============================================

import { useEffect, useRef } from 'react'
import { X, Calendar, MapPin, User, DollarSign, Wrench, PartyPopper, PackageOpen } from 'lucide-react'
import { EVENT_TYPES } from '../../constants/calendarConfig'

/**
 * Formateador de moneda
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0)
}

/**
 * Formateador de fecha
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

/**
 * Icono por tipo de evento
 */
const TipoIcon = ({ tipo, className = '' }) => {
  const iconProps = { className: `w-4 h-4 ${className}` }

  switch (tipo) {
    case EVENT_TYPES.MONTAJE:
      return <Wrench {...iconProps} />
    case EVENT_TYPES.EVENTO:
      return <PartyPopper {...iconProps} />
    case EVENT_TYPES.DESMONTAJE:
      return <PackageOpen {...iconProps} />
    default:
      return <Calendar {...iconProps} />
  }
}

/**
 * Badge de estado
 */
const EstadoBadge = ({ estado }) => {
  const estilos = {
    pendiente: 'bg-amber-100 text-amber-800',
    aprobada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    vencida: 'bg-slate-100 text-slate-800'
  }

  return (
    <span className={`
      px-2 py-0.5 rounded-full text-xs font-medium capitalize
      ${estilos[estado] || estilos.pendiente}
    `}>
      {estado}
    </span>
  )
}

/**
 * EventTooltip
 *
 * Muestra información detallada de un evento
 *
 * @param {Object} event - Evento de FullCalendar
 * @param {Object} position - Posición {x, y} del tooltip
 * @param {Function} onClose - Callback para cerrar
 * @param {Function} onVerDetalle - Callback para ver detalle completo
 */
const EventTooltip = ({
  event,
  position,
  onClose,
  onVerDetalle
}) => {
  const tooltipRef = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!event) return null

  const { extendedProps } = event
  const {
    tipo,
    estado,
    cliente,
    eventoNombre,
    eventoCiudad,
    total,
    fechaMontaje,
    fechaEvento,
    fechaDesmontaje,
    cotizacionId
  } = extendedProps || {}

  // Calcular posición del tooltip
  const tooltipStyle = {
    position: 'fixed',
    left: position?.x || 0,
    top: position?.y || 0,
    zIndex: 9999
  }

  return (
    <div
      ref={tooltipRef}
      style={tooltipStyle}
      className="bg-white rounded-lg shadow-xl border border-slate-200 w-72 animate-in fade-in duration-150"
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"
        style={{ backgroundColor: event.backgroundColor }}
      >
        <div className="flex items-center gap-2 text-white">
          <TipoIcon tipo={tipo} />
          <span className="font-semibold capitalize">{tipo}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Cliente y Estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{cliente}</span>
          </div>
          <EstadoBadge estado={estado} />
        </div>

        {/* Nombre del evento */}
        {eventoNombre && (
          <p className="text-sm text-slate-600">
            {eventoNombre}
          </p>
        )}

        {/* Ciudad */}
        {eventoCiudad && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4" />
            <span>{eventoCiudad}</span>
          </div>
        )}

        {/* Fechas */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Wrench className="w-3 h-3" /> Montaje:
            </span>
            <span className="font-medium text-slate-700">{formatDate(fechaMontaje)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <PartyPopper className="w-3 h-3" /> Evento:
            </span>
            <span className="font-medium text-slate-700">{formatDate(fechaEvento)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <PackageOpen className="w-3 h-3" /> Desmontaje:
            </span>
            <span className="font-medium text-slate-700">{formatDate(fechaDesmontaje)}</span>
          </div>
        </div>

        {/* Total */}
        {total && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4" /> Total:
            </span>
            <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {onVerDetalle && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-lg">
          <button
            onClick={() => onVerDetalle(cotizacionId)}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Cotizacion Completa
          </button>
        </div>
      )}
    </div>
  )
}

export default EventTooltip
