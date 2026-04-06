// ============================================
// COMPONENTE: CalendarStats
// Estadísticas del calendario
// ============================================

import { Calendar, Wrench, PartyPopper, PackageOpen, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * StatCard
 *
 * Tarjeta individual de estadística
 */
const StatCard = (props) => {
  const { t } = useTranslation()
  const { icon, label, value, color = 'slate' } = props
  const IconComponent = icon

  const colorMap = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * CalendarStats
 *
 * Muestra estadísticas de eventos del calendario
 *
 * @param {Object} stats - Estadísticas de useCalendarEvents
 */
const CalendarStats = ({ stats = {} }) => {
  const { t } = useTranslation()
  const { total = 0, porTipo = {}, porEstado = {} } = stats

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <StatCard
        icon={Calendar}
        label={t("calendar.totalEvents")}
        value={total}
        color="slate"
      />

      <StatCard
        icon={Wrench}
        label={t("calendar.assemblies")}
        value={porTipo.montaje || 0}
        color="blue"
      />

      <StatCard
        icon={PartyPopper}
        label={t("calendar.events")}
        value={porTipo.evento || 0}
        color="green"
      />

      <StatCard
        icon={PackageOpen}
        label={t("calendar.disassemblies")}
        value={porTipo.desmontaje || 0}
        color="amber"
      />

      <StatCard
        icon={TrendingUp}
        label={t("calendar.approved")}
        value={porEstado.aprobada || 0}
        color="purple"
      />
    </div>
  )
}

export default CalendarStats
