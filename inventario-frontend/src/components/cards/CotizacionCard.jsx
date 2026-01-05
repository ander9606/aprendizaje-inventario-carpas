// ============================================
// COMPONENTE: CotizacionCard
// Muestra una tarjeta de cotización
// ============================================

import { Calendar, User, MapPin, Package, Eye } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'

/**
 * CotizacionCard
 *
 * Tarjeta que muestra una cotización con:
 * - Estado (pendiente, aprobada, rechazada, vencida)
 * - Cliente
 * - Fechas del evento
 * - Total
 * - Acciones
 */
const CotizacionCard = ({
  cotizacion,
  onVerDetalle
}) => {

  // ============================================
  // HELPERS
  // ============================================

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const getEstadoStyle = (estado) => {
    const estilos = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
      vencida: 'bg-gray-100 text-gray-800'
    }
    return estilos[estado] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoNombre = (estado) => {
    const nombres = {
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      vencida: 'Vencida'
    }
    return nombres[estado] || estado
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleVerDetalle = (e) => {
    e.stopPropagation()
    if (onVerDetalle) onVerDetalle(cotizacion)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card
      variant="outlined"
      className="hover:shadow-lg transition-all duration-200"
    >
      {/* HEADER */}
      <Card.Header>
        <div className="flex items-start justify-between">
          <div>
            {/* ID y Estado */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-slate-500">
                #{cotizacion.id}
              </span>
              <span className={`
                inline-block px-2 py-1 text-xs font-medium rounded-full
                ${getEstadoStyle(cotizacion.estado)}
              `}>
                {getEstadoNombre(cotizacion.estado)}
              </span>
            </div>

            {/* Evento */}
            <Card.Title className="truncate">
              {cotizacion.evento_nombre || 'Sin nombre'}
            </Card.Title>
          </div>

          {/* Total */}
          <div className="text-right">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">
              {formatearMoneda(cotizacion.total)}
            </p>
          </div>
        </div>
      </Card.Header>

      {/* CONTENT */}
      <Card.Content>
        <div className="space-y-2 text-sm text-slate-600">
          {/* Cliente */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{cotizacion.cliente_nombre || 'Sin cliente'}</span>
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              {formatearFecha(cotizacion.fecha_evento)}
              {cotizacion.fecha_fin_evento && cotizacion.fecha_fin_evento !== cotizacion.fecha_evento && (
                <> - {formatearFecha(cotizacion.fecha_fin_evento)}</>
              )}
            </span>
          </div>

          {/* Ciudad */}
          {cotizacion.evento_ciudad && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{cotizacion.evento_ciudad}</span>
            </div>
          )}

          {/* Productos */}
          {cotizacion.total_productos > 0 && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 flex-shrink-0" />
              <span>{cotizacion.total_productos} producto{cotizacion.total_productos !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </Card.Content>

      {/* FOOTER */}
      <Card.Footer>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          icon={<Eye className="w-4 h-4" />}
          onClick={handleVerDetalle}
        >
          Ver Detalles
        </Button>
      </Card.Footer>
    </Card>
  )
}

export default CotizacionCard
