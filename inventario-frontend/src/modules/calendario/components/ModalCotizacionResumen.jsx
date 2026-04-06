// ============================================
// MODAL: Resumen de Cotización (Calendario)
// Se abre al hacer clic en un evento del calendario
// Muestra info rápida con productos y permite abrir detalle completo
// ============================================

import {
  User,
  MapPin,
  DollarSign,
  Wrench,
  PartyPopper,
  PackageOpen,
  ExternalLink,
  Phone,
  Package
} from 'lucide-react'
import { Modal } from '@shared/components/Modal'
import Spinner from '@shared/components/Spinner'
import { EVENT_TYPES } from '@calendario/constants/calendarConfig'
import { useGetCotizacionCompleta } from '@alquileres/hooks/cotizaciones'
import { useTranslation } from 'react-i18next'

// ============================================
// HELPERS
// ============================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

const ESTADO_STYLES = {
  borrador: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-400' },
  pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  aprobada: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
  rechazada: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
  vencida: { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-400' }
}

const TIPO_CONFIG = {
  [EVENT_TYPES.MONTAJE]: { icon: Wrench, label: 'Montaje', bg: 'bg-blue-100', color: 'text-blue-600' },
  [EVENT_TYPES.EVENTO]: { icon: PartyPopper, label: 'Evento', bg: 'bg-green-100', color: 'text-green-600' },
  [EVENT_TYPES.DESMONTAJE]: { icon: PackageOpen, label: 'Desmontaje', bg: 'bg-amber-100', color: 'text-amber-600' }
}

/**
 * Modal resumen de cotización desde el calendario
 * Carga los productos vía useGetCotizacionCompleta
 */
export default function ModalCotizacionResumen({ isOpen, onClose, cotizacion, tipoEvento, onVerDetalle }) {
    const { t } = useTranslation()
  // Cargar cotización completa (con productos) cuando el modal está abierto
  const { cotizacion: cotizacionCompleta, isLoading } = useGetCotizacionCompleta(
    isOpen ? cotizacion?.id : null
  )

  if (!cotizacion) return null

  const estadoStyle = ESTADO_STYLES[cotizacion.estado] || ESTADO_STYLES.pendiente
  const tipoConfig = TIPO_CONFIG[tipoEvento] || TIPO_CONFIG[EVENT_TYPES.EVENTO]
  const TipoIcon = tipoConfig.icon
  const productos = cotizacionCompleta?.productos || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${tipoConfig.bg}`}>
            <TipoIcon className={`w-5 h-5 ${tipoConfig.color}`} />
          </div>
          <span>
            {tipoConfig.label} - Cotización #{cotizacion.id}
          </span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-5">
        {/* Estado */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${estadoStyle.bg} ${estadoStyle.text}`}>
            <span className={`w-2 h-2 rounded-full ${estadoStyle.dot}`} />
            {cotizacion.estado?.charAt(0).toUpperCase() + cotizacion.estado?.slice(1)}
          </span>
          {cotizacion.alquiler_estado && (
            <span className="text-xs text-slate-500">
              Alquiler: {cotizacion.alquiler_estado}
            </span>
          )}
        </div>

        {/* Cliente y Evento en grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</h4>
            <p className="text-base font-semibold text-slate-900">
              {cotizacion.cliente_nombre || cotizacion.cliente?.nombre || 'Sin cliente'}
            </p>
            {(cotizacion.cliente_telefono || cotizacion.cliente?.telefono) && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {cotizacion.cliente_telefono || cotizacion.cliente?.telefono}
              </p>
            )}
          </div>

          {/* Evento */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Evento</h4>
            <p className="text-base font-medium text-slate-900">
              {cotizacion.evento_nombre || 'Sin nombre'}
            </p>
            {cotizacion.evento_ciudad && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-blue-400" />
                {cotizacion.evento_ciudad}
              </p>
            )}
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Fechas</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className={`text-center p-2 rounded-lg ${tipoEvento === EVENT_TYPES.MONTAJE ? 'bg-blue-100 ring-2 ring-blue-300' : ''}`}>
              <Wrench className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xs text-slate-500">Montaje</p>
              <p className="text-sm font-semibold text-slate-800">{formatDate(cotizacion.fecha_montaje)}</p>
            </div>
            <div className={`text-center p-2 rounded-lg ${tipoEvento === EVENT_TYPES.EVENTO ? 'bg-green-100 ring-2 ring-green-300' : ''}`}>
              <PartyPopper className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <p className="text-xs text-slate-500">Evento</p>
              <p className="text-sm font-semibold text-slate-800">{formatDate(cotizacion.fecha_evento)}</p>
            </div>
            <div className={`text-center p-2 rounded-lg ${tipoEvento === EVENT_TYPES.DESMONTAJE ? 'bg-amber-100 ring-2 ring-amber-300' : ''}`}>
              <PackageOpen className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <p className="text-xs text-slate-500">Desmontaje</p>
              <p className="text-sm font-semibold text-slate-800">{formatDate(cotizacion.fecha_desmontaje)}</p>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Productos
          </h4>
          {isLoading ? (
            <div className="py-4">
              <Spinner size="sm" text={t("calendar.loadingProducts")} />
            </div>
          ) : productos.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Producto</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-600 w-16">Cant.</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 w-28">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto, index) => {
                    const precioTotal = (parseFloat(producto.precio_base || 0) + parseFloat(producto.precio_adicionales || 0)) * parseInt(producto.cantidad || 1)
                    return (
                      <tr key={producto.id || index} className="border-t border-slate-100">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-sm text-slate-900">
                            {producto.categoria_emoji && `${producto.categoria_emoji} `}
                            {producto.producto_nombre}
                          </p>
                          {producto.categoria_nombre && (
                            <p className="text-xs text-slate-400">{producto.categoria_nombre}</p>
                          )}
                        </td>
                        <td className="text-center px-3 py-2.5 text-sm text-slate-600">{producto.cantidad}</td>
                        <td className="text-right px-4 py-2.5 text-sm font-medium text-slate-900">{formatCurrency(precioTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic py-2">Sin productos</p>
          )}
        </div>

        {/* Total */}
        {cotizacion.total && (
          <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Total cotización:
            </span>
            <span className="text-lg font-bold text-green-700">{formatCurrency(cotizacion.total)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cerrar
        </button>
        {onVerDetalle && (
          <button
            onClick={() => {
              onVerDetalle(cotizacion.id)
              onClose()
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Cotización Completa
          </button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
