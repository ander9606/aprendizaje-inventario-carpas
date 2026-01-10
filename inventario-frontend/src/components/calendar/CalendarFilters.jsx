// ============================================
// COMPONENTE: CalendarFilters
// Filtros para el calendario
// ============================================

import { Filter, Eye, EyeOff } from 'lucide-react'
import { EVENT_TYPES } from '../../constants/calendarConfig'

/**
 * CalendarFilters
 *
 * Permite filtrar los eventos del calendario
 *
 * @param {Object} filters - Estado actual de filtros
 * @param {Function} onFilterChange - Callback para cambio de filtros
 */
const CalendarFilters = ({
  filters = {},
  onFilterChange
}) => {
  const {
    showMontaje = true,
    showEvento = true,
    showDesmontaje = true,
    filtroEstado = 'todos'
  } = filters

  const handleToggle = (key) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key]
    })
  }

  const handleEstadoChange = (e) => {
    onFilterChange({
      ...filters,
      filtroEstado: e.target.value
    })
  }

  const toggleButtons = [
    { key: 'showMontaje', label: 'Montaje', active: showMontaje, color: 'blue' },
    { key: 'showEvento', label: 'Evento', active: showEvento, color: 'green' },
    { key: 'showDesmontaje', label: 'Desmontaje', active: showDesmontaje, color: 'amber' }
  ]

  const getButtonClasses = (active, color) => {
    const baseClasses = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all'

    if (active) {
      const colorMap = {
        blue: 'bg-blue-100 text-blue-700 border border-blue-200',
        green: 'bg-green-100 text-green-700 border border-green-200',
        amber: 'bg-amber-100 text-amber-700 border border-amber-200'
      }
      return `${baseClasses} ${colorMap[color]}`
    }

    return `${baseClasses} bg-slate-100 text-slate-400 border border-slate-200`
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Label */}
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-2">
          {toggleButtons.map(({ key, label, active, color }) => (
            <button
              key={key}
              onClick={() => handleToggle(key)}
              className={getButtonClasses(active, color)}
            >
              {active ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              {label}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Filtro por estado */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Estado:</label>
          <select
            value={filtroEstado}
            onChange={handleEstadoChange}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="vencida">Vencidas</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default CalendarFilters
