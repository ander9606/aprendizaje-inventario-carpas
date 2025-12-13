// ============================================
// COMPONENTE: SERIE ITEM
// Item individual de una serie (elemento con número de serie)
// ============================================

import { EstadoBadge } from '../../common/Badge'
import UbicacionBadge from '../../common/UbicacionBadge'
import { MoreVertical, Edit2, Trash2, MapPin, Package, RotateCcw } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente SerieItem - Representa un elemento individual con número de serie
 *
 * @param {object} serie - Datos de la serie
 * @param {string} serie.numero_serie - Número de serie único
 * @param {string} serie.estado - Estado del elemento
 * @param {string} serie.ubicacion - Ubicación actual
 * @param {boolean} serie.con_alquiler - Si está alquilado
 * @param {object} serie.alquiler - Datos del alquiler (opcional)
 * @param {function} onDevolverBodega - Callback para devolver a bodega principal
 * @param {function} onEdit - Callback para editar
 * @param {function} onDelete - Callback para eliminar
 * @param {function} onMove - Callback para mover de ubicación
 * @param {function} onClick - Callback al hacer click en el item
 * @param {boolean} compact - Vista compacta
 *
 * @example
 * <SerieItem
 *   serie={{
 *     numero_serie: "SN-001",
 *     estado: "disponible",
 *     ubicacion: "Bodega A",
 *     con_alquiler: false
 *   }}
 *   onDevolverBodega={handleDevolver}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onMove={handleMove}
 * />
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
  const [menuOpen, setMenuOpen] = useState(false)

  // Solo mostrar "Devolver a Bodega A" si NO está en Bodega A
  const esBodegaA = serie.ubicacion === 'Bodega A'

  // ============================================
  // OPCIONES DEL MENÚ
  // ============================================
  const menuOptions = [
    {
      label: 'Devolver a Bodega A',
      icon: RotateCcw,
      onClick: () => onDevolverBodega && onDevolverBodega(serie),
      show: !!onDevolverBodega && !esBodegaA // Solo mostrar si NO está en Bodega A
    },
    {
      label: 'Editar estado',
      icon: Edit2,
      onClick: () => onEdit && onEdit(serie),
      show: !!onEdit
    },
    {
      label: 'Mover ubicación',
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
  ].filter(option => option.show)

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
        {/* Número de serie */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="font-mono text-sm text-slate-700 truncate">
            {serie.numero_serie}
          </span>
        </div>

        {/* Estado */}
        <EstadoBadge estado={serie.estado} size="sm" />

        {/* Ubicación */}
        <UbicacionBadge ubicacion={serie.ubicacion} size="sm" showIcon={false} />

        {/* Menú (si hay opciones) */}
        {menuOptions.length > 0 && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              aria-label="Opciones"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-lg border border-slate-200 py-2 z-50">
                  {menuOptions.map((option, idx) => {
                    const IconComp = option.icon
                    return (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(false)
                          option.onClick()
                        }}
                        className={`
                          w-full text-left px-4 py-2 text-sm
                          flex items-center gap-2
                          transition-colors
                          ${option.danger
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-slate-700 hover:bg-slate-50'
                          }
                        `}
                      >
                        <IconComp className="w-4 h-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
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
      {/* Header: Número de serie + Menú */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Número de serie */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span className="font-mono text-base font-semibold text-slate-900 truncate">
            {serie.numero_serie}
          </span>
        </div>

        {/* Menú */}
        {menuOptions.length > 0 && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              aria-label="Opciones"
            >
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-lg border border-slate-200 py-2 z-50">
                  {menuOptions.map((option, idx) => {
                    const IconComp = option.icon
                    return (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(false)
                          option.onClick()
                        }}
                        className={`
                          w-full text-left px-4 py-2 text-sm
                          flex items-center gap-2
                          transition-colors
                          ${option.danger
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-slate-700 hover:bg-slate-50'
                          }
                        `}
                      >
                        <IconComp className="w-4 h-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Contenido: Estado + Ubicación */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Estado */}
        <EstadoBadge estado={serie.estado} size="md" />

        {/* Ubicación */}
        <UbicacionBadge ubicacion={serie.ubicacion} size="md" />
      </div>

      {/* Información de alquiler (si aplica) */}
      {serie.con_alquiler && serie.alquiler && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Cliente:</span>
            <span>{serie.alquiler.cliente}</span>
          </div>
          {serie.alquiler.fecha_devolucion && (
            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
              <span className="font-medium">Devolución:</span>
              <span>{new Date(serie.alquiler.fecha_devolucion).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SerieItem
