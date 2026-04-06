// ============================================
// MODAL: Cotizaciones del Día (Calendario)
// Se abre al hacer clic en una fecha del calendario
// Muestra todas las cotizaciones programadas ese día
// ============================================

import {
  Calendar,
  Wrench,
  PartyPopper,
  PackageOpen,
  User,
  MapPin,
  DollarSign,
  ChevronRight
} from 'lucide-react'
import { Modal } from '@shared/components/Modal'
import { EVENT_TYPES } from '@calendario/constants/calendarConfig'
import { useTranslation } from 'react-i18next'

// ============================================
// HELPERS
// ============================================

const formatFechaCompleta = (fechaStr) => {
  const fecha = new Date(fechaStr + 'T12:00:00')
  return fecha.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const ESTADO_STYLES = {
  borrador: { bg: 'bg-amber-100', text: 'text-amber-700' },
  pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  aprobada: { bg: 'bg-green-100', text: 'text-green-700' },
  rechazada: { bg: 'bg-red-100', text: 'text-red-700' },
  vencida: { bg: 'bg-slate-100', text: 'text-slate-700' }
}

const TIPO_ICONS = {
  [EVENT_TYPES.MONTAJE]: { icon: Wrench, label: 'Montaje', bg: 'bg-blue-100', color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  [EVENT_TYPES.EVENTO]: { icon: PartyPopper, label: 'Evento', bg: 'bg-green-100', color: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  [EVENT_TYPES.DESMONTAJE]: { icon: PackageOpen, label: 'Desmontaje', bg: 'bg-amber-100', color: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' }
}

/**
 * Fila de un evento/cotización dentro del modal de día
 */
const CotizacionRow = ({ evento, onClickEvento }) => {
  const tipo = evento.extendedProps?.tipo
  const tipoConfig = TIPO_ICONS[tipo] || TIPO_ICONS[EVENT_TYPES.EVENTO]
  const TipoIcon = tipoConfig.icon
  const estado = evento.extendedProps?.estado
  const estadoStyle = ESTADO_STYLES[estado] || ESTADO_STYLES.pendiente
  const esAprobada = estado === 'aprobada'

  return (
    <button
      onClick={() => onClickEvento(evento)}
      className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
        esAprobada
          ? 'border-green-200 bg-green-50/50 hover:bg-green-50'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icono tipo */}
        <div className={`p-2 rounded-lg shrink-0 ${tipoConfig.bg}`}>
          <TipoIcon className={`w-5 h-5 ${tipoConfig.color}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tipoConfig.badge}`}>
              {tipoConfig.label}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoStyle.bg} ${estadoStyle.text}`}>
              {estado?.charAt(0).toUpperCase() + estado?.slice(1)}
            </span>
            <span className="text-xs text-slate-400">#{evento.extendedProps?.cotizacionId}</span>
          </div>

          <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {evento.extendedProps?.cliente || 'Sin cliente'}
          </p>
          {evento.extendedProps?.eventoNombre && (
            <p className="text-sm text-slate-500 truncate">{evento.extendedProps.eventoNombre}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            {evento.extendedProps?.eventoCiudad && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5" />
                {evento.extendedProps.eventoCiudad}
              </span>
            )}
            {evento.extendedProps?.total && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {formatCurrency(evento.extendedProps.total)}
              </span>
            )}
          </div>
        </div>

        {/* Flecha */}
        <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 mt-2" />
      </div>
    </button>
  )
}

/**
 * Modal que muestra todas las cotizaciones de un día específico
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} fecha - Fecha seleccionada (YYYY-MM-DD)
 * @param {Array} eventos - Eventos del calendario para esa fecha
 * @param {function} onClickEvento - Handler al seleccionar un evento
 */
export default function ModalDiaCotizaciones({ isOpen, onClose, fecha, eventos = [], onClickEvento }) {
    const { t } = useTranslation()
  const montajes = eventos.filter(e => e.extendedProps?.tipo === EVENT_TYPES.MONTAJE)
  const eventosMain = eventos.filter(e => e.extendedProps?.tipo === EVENT_TYPES.EVENTO)
  const desmontajes = eventos.filter(e => e.extendedProps?.tipo === EVENT_TYPES.DESMONTAJE)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="block text-lg">Cotizaciones del día</span>
            {fecha && (
              <span className="block text-sm font-normal text-slate-500 capitalize">
                {formatFechaCompleta(fecha)}
              </span>
            )}
          </div>
        </div>
      }
      size="lg"
    >
      {/* Resumen rápido */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
          <span className="text-sm text-slate-600">Total:</span>
          <span className="text-sm font-bold text-slate-900">{eventos.length}</span>
        </div>
        {montajes.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{montajes.length} montaje{montajes.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {eventosMain.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
            <PartyPopper className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{eventosMain.length} evento{eventosMain.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {desmontajes.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
            <PackageOpen className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">{desmontajes.length} desmontaje{desmontajes.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Lista de eventos */}
      {eventos.length === 0 ? (
        <div className="py-8 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay cotizaciones este día</p>
          <p className="text-sm text-slate-400">Este día no tiene eventos programados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map(evento => (
            <CotizacionRow
              key={evento.id}
              evento={evento}
              onClickEvento={onClickEvento}
            />
          ))}
        </div>
      )}

      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  )
}
