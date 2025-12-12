// ============================================
// COMPONENTE: LOTE UBICACION GROUP
// Agrupa cantidades de un lote por ubicación
// ============================================

import UbicacionBadge from '../../common/UbicacionBadge'
import { EstadoBadge } from '../../common/Badge'
import { MoreVertical, Trash2, ArrowRight, Package, RotateCcw } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente LoteUbicacionGroup - Grupo de lotes por ubicación
 *
 * @param {object} ubicacion - Datos de la ubicación
 * @param {string} ubicacion.nombre - Nombre de la ubicación
 * @param {array} ubicacion.lotes - Array de lotes en esta ubicación
 * @param {number} ubicacion.cantidad_total - Cantidad total en esta ubicación
 * @param {function} onDevolverBodega - Callback para devolver a bodega principal
 * @param {function} onMoveLote - Callback para mover cantidad
 * @param {function} onDeleteLote - Callback para eliminar un lote
 * @param {boolean} compact - Vista compacta
 *
 * @example
 * <LoteUbicacionGroup
 *   ubicacion={{
 *     nombre: "Bodega A",
 *     cantidad_total: 50,
 *     lotes: [
 *       { estado: "nuevo", cantidad: 20 },
 *       { estado: "bueno", cantidad: 30 }
 *     ]
 *   }}
 *   onDevolverBodega={handleDevolver}
 *   onMoveLote={handleMove}
 * />
 */
export const LoteUbicacionGroup = ({
  ubicacion,
  onDevolverBodega,
  onMoveLote,
  onDeleteLote,
  compact = false,
  className = '',
  ...props
}) => {
  const [expandido, setExpandido] = useState(false)

  const {
    nombre,
    lotes = [],
    cantidad_total = 0
  } = ubicacion

  // ============================================
  // VISTA COMPACTA (resumen por ubicación)
  // ============================================
  if (compact) {
    return (
      <div
        className={`
          flex items-center justify-between gap-3
          p-3 bg-white border border-slate-200 rounded-lg
          hover:border-slate-300 transition-colors
          ${className}
        `}
        {...props}
      >
        {/* Ubicación */}
        <UbicacionBadge ubicacion={nombre} size="md" />

        {/* Cantidad total */}
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-900">
            {cantidad_total}
          </span>
          <span className="text-sm text-slate-600">
            {cantidad_total === 1 ? 'unidad' : 'unidades'}
          </span>
        </div>

        {/* Expandir/Colapsar */}
        <button
          onClick={() => setExpandido(!expandido)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {expandido ? 'Ocultar' : 'Ver detalle'}
        </button>
      </div>
    )
  }

  // ============================================
  // VISTA NORMAL (con detalles de lotes)
  // ============================================
  return (
    <div
      className={`
        bg-white border border-slate-200 rounded-lg overflow-hidden
        ${className}
      `}
      {...props}
    >
      {/* Header: Ubicación + Cantidad total */}
      <div
        className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        {/* Ubicación */}
        <UbicacionBadge ubicacion={nombre} size="md" />

        {/* Cantidad total */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" />
            <span className="text-2xl font-bold text-slate-900">
              {cantidad_total}
            </span>
            <span className="text-sm text-slate-600">
              {cantidad_total === 1 ? 'unidad' : 'unidades'}
            </span>
          </div>

          {/* Botón expandir */}
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg
              className={`w-5 h-5 transition-transform ${expandido ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido expandible: Lista de lotes por estado */}
      {expandido && (
        <div className="p-4 space-y-2">
          {lotes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No hay lotes en esta ubicación
            </p>
          ) : (
            lotes.map((lote, idx) => (
              <LoteItem
                key={lote.id || idx}
                lote={lote}
                ubicacion={nombre}
                onDevolverBodega={onDevolverBodega}
                onMove={onMoveLote}
                onDelete={onDeleteLote}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: LOTE ITEM
// Item individual de un lote (estado + cantidad)
// ============================================
const LoteItem = ({
  lote,
  ubicacion,
  onDevolverBodega,
  onMove,
  onDelete
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  // Solo mostrar "Devolver a Bodega A" si NO está en Bodega A
  const esBodegaA = ubicacion === 'Bodega A'

  const menuOptions = [
    {
      label: 'Devolver a Bodega A',
      icon: RotateCcw,
      onClick: () => onDevolverBodega && onDevolverBodega(lote, ubicacion),
      show: !!onDevolverBodega && !esBodegaA // Solo mostrar si NO está en Bodega A
    },
    {
      label: 'Mover a otra ubicación',
      icon: ArrowRight,
      onClick: () => onMove && onMove(lote, ubicacion),
      show: !!onMove
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => onDelete && onDelete(lote, ubicacion),
      danger: true,
      show: !!onDelete
    }
  ].filter(option => option.show)

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
      {/* Estado */}
      <EstadoBadge estado={lote.estado} size="md" />

      {/* Cantidad */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-2xl font-bold text-slate-900">
          {lote.cantidad}
        </span>
        <span className="text-sm text-slate-600">
          {lote.cantidad === 1 ? 'unidad' : 'unidades'}
        </span>
      </div>

      {/* Menú de opciones */}
      {menuOptions.length > 0 && (
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-1 hover:bg-slate-200 rounded transition-colors"
            aria-label="Opciones"
          >
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-slate-200 py-2 z-20">
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

export default LoteUbicacionGroup
