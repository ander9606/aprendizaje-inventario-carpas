// ============================================
// COMPONENTE: SERIE ITEM
// Item individual de una serie (elemento con numero de serie)
// Incluye contexto de eventos (actual y proximo)
// ============================================

import { EstadoBadge } from '../../common/Badge'
import UbicacionBadge from '../../common/UbicacionBadge'
import DropdownMenu from '../../common/DropdownMenu'
import { Edit2, Trash2, MapPin, Package, RotateCcw, Calendar, User, Clock, ArrowRight } from 'lucide-react'
import { formatearFechaCorta } from '../../../utils/helpers'

/**
 * Componente SerieItem - Representa un elemento individual con numero de serie
 *
 * @param {object} serie - Datos de la serie
 * @param {string} serie.numero_serie - Numero de serie unico
 * @param {string} serie.estado - Estado del elemento
 * @param {string} serie.ubicacion - Ubicacion actual
 * @param {boolean} serie.con_alquiler - Si esta alquilado
 * @param {object} serie.alquiler - Datos del alquiler (opcional)
 * @param {function} onDevolverBodega - Callback para devolver a bodega principal
 * @param {function} onEdit - Callback para editar
 * @param {function} onDelete - Callback para eliminar
 * @param {function} onMove - Callback para mover de ubicacion
 * @param {function} onClick - Callback al hacer click en el item
 * @param {boolean} compact - Vista compacta
 */
export const SerieItem = ({
  serie,
  onDevolverBodega,
  onEdit,
  onDelete,
  onMove,
  onClick,
  compact = false,
  className = '',
  ...props
}) => {
  // Solo mostrar "Devolver a Bodega Principal" si NO esta en Bodega Principal
  const esBodegaPrincipal = serie.ubicacion === 'Bodega Principal' || serie.ubicacion === 'Bodega A'

  // ============================================
  // OPCIONES DEL MENU
  // ============================================
  const menuOptions = [
    {
      label: 'Devolver a Bodega Principal',
      icon: RotateCcw,
      onClick: () => onDevolverBodega && onDevolverBodega(serie),
      show: !!onDevolverBodega && !esBodegaPrincipal
    },
    {
      label: 'Editar estado',
      icon: Edit2,
      onClick: () => onEdit && onEdit(serie),
      show: !!onEdit
    },
    {
      label: 'Mover ubicacion',
      icon: MapPin,
      onClick: () => onMove && onMove(serie),
      show: !!onMove
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => onDelete && onDelete(serie),
      danger: true,
      show: !!onDelete
    }
  ]

  // ============================================
  // VISTA COMPACTA
  // ============================================
  if (compact) {
    return (
      <div
        className={`
          flex items-center justify-between gap-3
          p-3 bg-white border border-slate-200 rounded-lg
          hover:border-slate-300 transition-colors
          ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}
          ${className}
        `}
        onClick={onClick}
        {...props}
      >
        {/* Numero de serie */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="font-mono text-sm text-slate-700 truncate">
            {serie.numero_serie}
          </span>
        </div>

        {/* Estado */}
        <EstadoBadge estado={serie.estado} size="sm" />

        {/* Ubicacion */}
        <UbicacionBadge ubicacion={serie.ubicacion} size="sm" showIcon={false} />

        {/* Menu */}
        <DropdownMenu options={menuOptions} />
      </div>
    )
  }

  // ============================================
  // VISTA NORMAL
  // ============================================
  return (
    <div
      className={`
        bg-white border border-slate-200 rounded-lg p-4
        hover:border-slate-300 hover:shadow-sm transition-all
        ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {/* Header: Numero de serie + Menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Numero de serie */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span className="font-mono text-base font-semibold text-slate-900 truncate">
            {serie.numero_serie}
          </span>
        </div>

        {/* Menu */}
        <DropdownMenu options={menuOptions} iconSize="w-5 h-5" />
      </div>

      {/* Contenido: Estado + Ubicacion */}
      <div className="flex flex-wrap items-center gap-2">
        <EstadoBadge estado={serie.estado} size="md" />
        <UbicacionBadge ubicacion={serie.ubicacion} size="md" />
      </div>

      {/* Informacion de evento actual (si esta en alquiler) */}
      {serie.en_alquiler && serie.evento_actual && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="bg-orange-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span className="font-medium text-orange-900 text-sm">
                {serie.evento_actual.nombre || 'Evento sin nombre'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-orange-800">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{serie.evento_actual.cliente}</span>
            </div>

            {serie.evento_actual.ubicacion && (
              <div className="flex items-center gap-2 text-sm text-orange-800">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{serie.evento_actual.ubicacion}</span>
                {serie.evento_actual.ciudad && (
                  <span className="text-orange-600">({serie.evento_actual.ciudad})</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-orange-800">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {formatearFechaCorta(serie.evento_actual.fecha_inicio)}
                {serie.evento_actual.fecha_fin && (
                  <> - {formatearFechaCorta(serie.evento_actual.fecha_fin)}</>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Informacion de alquiler antiguo (fallback para compatibilidad) */}
      {!serie.en_alquiler && serie.con_alquiler && serie.alquiler && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Cliente:</span>
            <span>{serie.alquiler.cliente}</span>
          </div>
          {serie.alquiler.fecha_devolucion && (
            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
              <span className="font-medium">Devolucion:</span>
              <span>{new Date(serie.alquiler.fecha_devolucion).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Proximo evento (si esta reservada) */}
      {serie.proximo_evento && !serie.en_alquiler && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1">
              <ArrowRight className="w-3 h-3" />
              PROXIMO COMPROMISO
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">{serie.proximo_evento.evento_nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800 mt-1">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Montaje: {formatearFechaCorta(serie.proximo_evento.fecha_montaje)}</span>
            </div>
            {serie.proximo_evento.cliente_nombre && (
              <div className="flex items-center gap-2 text-sm text-blue-800 mt-1">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{serie.proximo_evento.cliente_nombre}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SerieItem
