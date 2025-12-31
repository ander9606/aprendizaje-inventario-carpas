// ============================================
// COMPONENTE: CotizacionCard
// Muestra una tarjeta de cotización
// ============================================

import { Calendar, User, MapPin, DollarSign, Edit, Trash2, Check, Copy } from 'lucide-react'
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
  onEdit,
  onDelete,
  onAprobar,
  onDuplicar,
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

  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit) onEdit(cotizacion)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    const confirmacion = confirm(
      `Eliminar cotizacion #${cotizacion.id}?\n\nEsta accion no se puede deshacer.`
    )
    if (confirmacion && onDelete) {
      onDelete(cotizacion.id)
    }
  }

  const handleAprobar = (e) => {
    e.stopPropagation()
    if (onAprobar) onAprobar(cotizacion)
  }

  const handleDuplicar = (e) => {
    e.stopPropagation()
    if (onDuplicar) onDuplicar(cotizacion.id)
  }

  const handleVerDetalle = () => {
    if (onVerDetalle) onVerDetalle(cotizacion)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card
      variant="outlined"
      className="hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={handleVerDetalle}
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
          {cotizacion.total_productos && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>{cotizacion.total_productos} producto{cotizacion.total_productos !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </Card.Content>

      {/* FOOTER */}
      <Card.Footer>
        <div className="space-y-2">
          {/* Boton aprobar (solo para pendientes) */}
          {cotizacion.estado === 'pendiente' && onAprobar && (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              icon={<Check className="w-4 h-4" />}
              onClick={handleAprobar}
            >
              Aprobar
            </Button>
          )}

          {/* Botones secundarios */}
          <div className="flex gap-2">
            {cotizacion.estado === 'pendiente' && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit className="w-4 h-4" />}
                onClick={handleEdit}
                className="flex-1"
              >
                Editar
              </Button>
            )}

            {onDuplicar && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy className="w-4 h-4" />}
                onClick={handleDuplicar}
                className="flex-1"
              >
                Duplicar
              </Button>
            )}

            {cotizacion.estado === 'pendiente' && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleDelete}
                className="flex-1"
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </Card.Footer>
    </Card>
  )
}

export default CotizacionCard
