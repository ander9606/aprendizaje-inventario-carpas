// ============================================
// COMPONENTE: ELEMENTO LOTE CARD (PROFESIONAL)
// Card para elementos gestionados por lotes
// ============================================

import { useState } from 'react'
import LoteUbicacionGroup from './LoteUbicacionGroup'
import EmptyState from '../../common/EmptyState'
import Button from '../../common/Button'
import Spinner from '../../common/Spinner'
import Modal from '../../common/Modal'
import { EstadoBadge } from '../../common/Badge'
import UbicacionBadge from '../../common/UbicacionBadge'
import { Plus, Package, MapPin, ArrowRightLeft, ArrowRight, Layers, Ruler, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'
import { formatearMoneda } from '../../../utils/helpers'

import { useGetLotes } from '../../../hooks/Uselotes'

export const ElementoLoteCard = ({
  elemento,
  onEdit,
  onDelete,
  onAddLote,
  onDevolverBodega,
  onMoveLote,
  onDeleteLote,
  className = '',
  disabled = false,
  ...props
}) => {
  const {
    id: elementoId,
    nombre,
    icono = '📦',
    descripcion,
    material,
    unidad,
    unidad_abrev,
    stock_minimo = 0,
    costo_adquisicion,
    alertas = []
  } = elemento

  // ============================================
  // ESTADO LOCAL
  // ============================================
  const [mostrarSelectorLotes, setMostrarSelectorLotes] = useState(false)

  // ============================================
  // CARGAR LOTES DEL ELEMENTO
  // ============================================
  const {
    lotes,
    estadisticas,
    cantidad_total,
    cantidad_disponible,
    isLoading: isLoadingLotes,
    error: errorLotes
  } = useGetLotes(elementoId)

  // ============================================
  // TRANSFORMAR LOTES A UBICACIONES
  // ============================================
  const ubicaciones = transformarLotesAUbicaciones(lotes)

  // ============================================
  // CÁLCULOS
  // ============================================
  const alquilados = estadisticas.alquilado || 0
  const enMantenimiento = estadisticas.mantenimiento || 0
  const dañados = estadisticas.malo || estadisticas.dañado || estadisticas.danado || 0
  const pctDisponible = cantidad_total > 0 ? Math.round((cantidad_disponible / cantidad_total) * 100) : 0
  const pctAlquilado = cantidad_total > 0 ? Math.round((alquilados / cantidad_total) * 100) : 0
  const pctOtros = cantidad_total > 0 ? Math.round(((enMantenimiento + dañados) / cantidad_total) * 100) : 0
  const stockBajo = stock_minimo > 0 && cantidad_disponible < stock_minimo && !isLoadingLotes
  const valorTotal = costo_adquisicion && cantidad_total ? costo_adquisicion * cantidad_total : null

  // ============================================
  // MENÚ DE OPCIONES
  // ============================================
  const menuOptions = [
    {
      label: 'Editar elemento',
      onClick: () => onEdit && onEdit(elemento),
      disabled: disabled
    },
    {
      label: 'Eliminar elemento',
      onClick: () => onDelete && onDelete(elemento),
      danger: true,
      disabled: disabled
    }
  ].filter(option => option.onClick)

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
      {...props}
    >
      {/* ============================================
          ACENTO SUPERIOR + HEADER
          ============================================ */}
      <div className="border-b border-slate-200">
        {/* Barra de acento esmeralda */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Lado izquierdo: icono + info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0 mt-0.5">{icono}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{nombre}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <Layers className="w-3 h-3" />
                    Lotes
                  </span>
                </div>

                {descripcion && (
                  <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{descripcion}</p>
                )}

                {/* Badges de material y unidad */}
                {(material || unidad) && (
                  <div className="flex items-center gap-2 mt-2">
                    {material && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-600">
                        <Ruler className="w-3 h-3" />
                        {material}
                      </span>
                    )}
                    {unidad && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-600">
                        {unidad_abrev || unidad}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Menú */}
            {menuOptions.length > 0 && (
              <MenuButton options={menuOptions} />
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          ALERTAS
          ============================================ */}
      {(stockBajo || alertas.length > 0) && (
        <div className="px-6 pt-4 space-y-2">
          {stockBajo && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-700">
                <strong>Stock bajo:</strong> {cantidad_disponible} disponible{cantidad_disponible !== 1 ? 's' : ''} de {stock_minimo} mínimo
              </span>
            </div>
          )}
          {alertas.map((alerta, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">{alerta.mensaje}</span>
            </div>
          ))}
        </div>
      )}

      {/* ============================================
          ERROR AL CARGAR
          ============================================ */}
      {errorLotes && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Error al cargar lotes: {errorLotes.message}
        </div>
      )}

      {/* ============================================
          ESTADÍSTICAS + BARRA DE DISPONIBILIDAD
          ============================================ */}
      <div className="px-6 pt-4">
        {/* Stats en grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          <StatMini label="Total" value={isLoadingLotes ? '-' : cantidad_total} color="slate" />
          <StatMini label="Nuevo" value={isLoadingLotes ? '-' : (estadisticas.nuevo || 0)} color="purple" />
          <StatMini label="Bueno" value={isLoadingLotes ? '-' : (estadisticas.bueno || 0)} color="green" />
          <StatMini label="Alquilado" value={isLoadingLotes ? '-' : alquilados} color="blue" />
          <StatMini label="Mant." value={isLoadingLotes ? '-' : enMantenimiento} color="amber" />
          <StatMini label="Dañado" value={isLoadingLotes ? '-' : dañados} color="red" />
        </div>

        {/* Barra de disponibilidad */}
        {!isLoadingLotes && cantidad_total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Disponibilidad</span>
              <span className="font-medium">{pctDisponible}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
              {pctDisponible > 0 && (
                <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pctDisponible}%` }} />
              )}
              {pctAlquilado > 0 && (
                <div className="bg-blue-500 transition-all duration-500" style={{ width: `${pctAlquilado}%` }} />
              )}
              {pctOtros > 0 && (
                <div className="bg-amber-500 transition-all duration-500" style={{ width: `${pctOtros}%` }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          GRUPOS POR UBICACIÓN
          ============================================ */}
      <div className="px-6 pb-4">
        {/* Header: sección + botones */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Por ubicación
          </h4>
          <div className="flex items-center gap-2">
            {onMoveLote && lotes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowRightLeft className="w-4 h-4" />}
                onClick={() => setMostrarSelectorLotes(true)}
                disabled={disabled}
                title="Mover cantidad entre ubicaciones/estados"
              >
                Mover
              </Button>
            )}
            {onAddLote && (
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => onAddLote(elemento)}
                disabled={disabled}
              >
                Agregar
              </Button>
            )}
          </div>
        </div>

        {isLoadingLotes ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : ubicaciones.length === 0 ? (
          <EmptyState
            type="no-data"
            title="Sin lotes registrados"
            description="Agrega inventario nuevo mediante compras, donaciones o stock inicial"
            icon={Package}
            action={onAddLote && {
              label: 'Agregar inventario',
              onClick: () => onAddLote(elemento),
              icon: <Plus />
            }}
          />
        ) : (
          <div className="space-y-3">
            {ubicaciones.map((ubicacion, idx) => (
              <LoteUbicacionGroup
                key={ubicacion.nombre || idx}
                ubicacion={ubicacion}
                onDevolverBodega={(lote, ubicacion) => onDevolverBodega && onDevolverBodega(lote, ubicacion, elemento)}
                onMoveLote={(lote, ubicacion) => onMoveLote && onMoveLote(lote, ubicacion, elemento)}
                onDeleteLote={onDeleteLote}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          FOOTER: RESUMEN + COSTO
          ============================================ */}
      {!isLoadingLotes && cantidad_total > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            {/* Resumen */}
            <div className="flex items-center gap-4 text-slate-600">
              <span>{ubicaciones.length} ubicacion{ubicaciones.length !== 1 ? 'es' : ''}</span>
              <span className="text-slate-300">|</span>
              <span>{cantidad_total} {cantidad_total === 1 ? 'unidad' : 'unidades'}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-medium">{cantidad_disponible} disponible{cantidad_disponible !== 1 ? 's' : ''}</span>
            </div>
            {/* Costo */}
            <div className="flex items-center gap-4">
              {costo_adquisicion && (
                <span className="flex items-center gap-1 text-slate-600">
                  <DollarSign className="w-3.5 h-3.5" />
                  Unit.: <strong className="text-slate-900">{formatearMoneda(costo_adquisicion)}</strong>
                </span>
              )}
              {valorTotal && (
                <span className="flex items-center gap-1 text-slate-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Total: <strong className="text-emerald-700">{formatearMoneda(valorTotal)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL: SELECTOR DE LOTES PARA MOVER
          ============================================ */}
      {mostrarSelectorLotes && (
        <Modal
          isOpen={mostrarSelectorLotes}
          onClose={() => setMostrarSelectorLotes(false)}
          title="Selecciona el lote que deseas mover"
          size="md"
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {lotes.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No hay lotes disponibles para mover
              </p>
            ) : (
              lotes.map((lote) => (
                <button
                  key={lote.id}
                  onClick={() => {
                    onMoveLote(lote, lote.ubicacion)
                    setMostrarSelectorLotes(false)
                  }}
                  className="w-full p-4 bg-white border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <UbicacionBadge ubicacion={lote.ubicacion || 'Sin ubicación'} />
                      <EstadoBadge estado={lote.estado} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{lote.cantidad}</div>
                        <div className="text-xs text-slate-500">
                          {lote.cantidad === 1 ? 'unidad' : 'unidades'}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                  {lote.lote_numero && (
                    <div className="mt-2 text-xs text-slate-500">Lote: {lote.lote_numero}</div>
                  )}
                </button>
              ))
            )}
          </div>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setMostrarSelectorLotes(false)}>
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: STAT MINI
// ============================================
function StatMini({ label, value, color }) {
  const colorMap = {
    slate: 'bg-slate-50 text-slate-900 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  return (
    <div className={`rounded-lg border p-2 text-center ${colorMap[color]}`}>
      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
      <p className="text-lg font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: MENU BUTTON
// ============================================
function MenuButton({ options }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Opciones"
      >
        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-lg border border-slate-200 py-1 z-20">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setOpen(false); opt.onClick() }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  opt.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// FUNCIÓN: TRANSFORMAR LOTES A UBICACIONES
// ============================================
function transformarLotesAUbicaciones(lotes) {
  if (!Array.isArray(lotes) || lotes.length === 0) return []

  const ubicacionesMap = lotes.reduce((acc, lote) => {
    const nombreUbicacion = lote.ubicacion || 'Sin ubicación'
    if (!acc[nombreUbicacion]) {
      acc[nombreUbicacion] = { nombre: nombreUbicacion, cantidad_total: 0, lotes: [] }
    }
    acc[nombreUbicacion].cantidad_total += (lote.cantidad || 0)
    acc[nombreUbicacion].lotes.push(lote)
    return acc
  }, {})

  return Object.values(ubicacionesMap).sort((a, b) => {
    if (a.nombre === 'Sin ubicación') return 1
    if (b.nombre === 'Sin ubicación') return -1
    return a.nombre.localeCompare(b.nombre)
  })
}

export default ElementoLoteCard
