// ============================================
// COMPONENTE: CalendarLegend
// Leyenda de colores del calendario
// ============================================

import { EVENT_TYPES, EVENT_COLORS, ESTADO_COLORS } from '../../constants/calendarConfig'
import { Wrench, PartyPopper, PackageOpen } from 'lucide-react'

/**
 * Icono por tipo
 */
const getTipoIcon = (tipo) => {
  const iconClass = 'w-3 h-3'
  switch (tipo) {
    case EVENT_TYPES.MONTAJE:
      return <Wrench className={iconClass} />
    case EVENT_TYPES.EVENTO:
      return <PartyPopper className={iconClass} />
    case EVENT_TYPES.DESMONTAJE:
      return <PackageOpen className={iconClass} />
    default:
      return null
  }
}

/**
 * Label por tipo
 */
const getTipoLabel = (tipo) => {
  const labels = {
    [EVENT_TYPES.MONTAJE]: 'Montaje',
    [EVENT_TYPES.EVENTO]: 'Evento',
    [EVENT_TYPES.DESMONTAJE]: 'Desmontaje'
  }
  return labels[tipo] || tipo
}

/**
 * CalendarLegend
 *
 * Muestra la leyenda de colores del calendario
 *
 * @param {boolean} showTipos - Mostrar leyenda por tipo
 * @param {boolean} showEstados - Mostrar leyenda por estado
 * @param {string} orientation - 'horizontal' o 'vertical'
 */
const CalendarLegend = ({
  showTipos = true,
  showEstados = false,
  orientation = 'horizontal'
}) => {
  const containerClass = orientation === 'horizontal'
    ? 'flex flex-wrap items-center gap-4'
    : 'flex flex-col gap-2'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Leyenda
      </p>

      {/* Leyenda por tipo */}
      {showTipos && (
        <div className={containerClass}>
          {Object.entries(EVENT_TYPES)
            .filter(([key]) => key !== 'RESERVA')
            .map(([key, tipo]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: EVENT_COLORS[tipo].backgroundColor,
                    color: EVENT_COLORS[tipo].textColor
                  }}
                >
                  {getTipoIcon(tipo)}
                </div>
                <span className="text-xs text-slate-600">
                  {getTipoLabel(tipo)}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Separador */}
      {showTipos && showEstados && (
        <hr className="my-2 border-slate-200" />
      )}

      {/* Leyenda por estado */}
      {showEstados && (
        <div className={containerClass}>
          {Object.entries(ESTADO_COLORS).map(([estado, colors]) => (
            <div key={estado} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor: colors.backgroundColor,
                  borderColor: colors.borderColor
                }}
              />
              <span className="text-xs text-slate-600 capitalize">
                {estado}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CalendarLegend
