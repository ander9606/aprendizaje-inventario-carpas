// ============================================
// COMPONENTE: LOTE UBICACION GROUP
// Agrupa cantidades de un lote por ubicacion
// ============================================

import UbicacionBadge from '../../common/UbicacionBadge'
import { EstadoBadge } from '../../common/Badge'
import DropdownMenu from '../../common/DropdownMenu'
import { Trash2, ArrowRight, Package, RotateCcw } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente LoteUbicacionGroup - Grupo de lotes por ubicacion
 *
 * @param {object} ubicacion - Datos de la ubicacion
 * @param {string} ubicacion.nombre - Nombre de la ubicacion
 * @param {array} ubicacion.lotes - Array de lotes en esta ubicacion
 * @param {number} ubicacion.cantidad_total - Cantidad total en esta ubicacion
 * @param {function} onDevolverBodega - Callback para devolver a bodega principal
 * @param {function} onMoveLote - Callback para mover cantidad
 * @param {function} onDeleteLote - Callback para eliminar un lote
 * @param {boolean} compact - Vista compacta
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
  // VISTA COMPACTA (resumen por ubicacion)
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
        {/* Ubicacion */}
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
        bg-white border border-slate-200 rounded-lg
        ${className}
      `}
      {...props}
    >
      {/* Header: Ubicacion + Cantidad total */}
      <div
        className={`flex items-center justify-between p-4 bg-slate-50 cursor-pointer ${
          expandido ? 'border-b border-slate-200 rounded-t-lg' : 'rounded-lg'
        }`}
        onClick={() => setExpandido(!expandido)}
      >
        {/* Ubicacion */}
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

          {/* Boton expandir */}
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
        <div className="p-4 space-y-2 rounded-b-lg">
          {lotes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No hay lotes en esta ubicacion
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
  // Solo mostrar "Devolver a Bodega Principal" si NO esta en Bodega Principal
  const esBodegaPrincipal = ubicacion === 'Bodega Principal' || ubicacion === 'Bodega A'

  const menuOptions = [
    {
      label: 'Devolver a Bodega Principal',
      icon: RotateCcw,
      onClick: () => onDevolverBodega && onDevolverBodega(lote, ubicacion),
      show: !!onDevolverBodega && !esBodegaPrincipal
    },
    {
      label: 'Mover a otra ubicacion',
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
  ]

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

      {/* Menu de opciones */}
      <DropdownMenu options={menuOptions} menuClassName="w-56" />
    </div>
  )
}

export default LoteUbicacionGroup
