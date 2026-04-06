// ============================================
// COMPONENTE: ELEMENTO LOTE CARD (PROFESIONAL)
// Card para elementos gestionados por lotes
// ============================================

import { useState, useRef } from 'react'
import LoteUbicacionGroup from './LoteUbicacionGroup'
import EmptyState from '@shared/components/EmptyState'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import { IconoCategoria } from '@shared/components/IconoCategoria'
import Modal from '@shared/components/Modal'
import { EstadoBadge } from '@shared/components/Badge'
import UbicacionBadge from '@shared/components/UbicacionBadge'
import { Plus, Package, MapPin, ArrowRightLeft, ArrowRight, Layers, Ruler, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'
import { formatearMoneda } from '@shared/utils/helpers'

import { useGetLotes } from '../../../hooks/useLotes'
import { useTranslation } from 'react-i18next'

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
    imagen,
    descripcion,
    material,
    unidad,
    unidad_abrev,
    stock_minimo = 0,
    costo_adquisicion,
    alertas = []
  } = elemento

  const { t } = useTranslation()
  const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')

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
  const ubicaciones = transformarLotesAUbicaciones(lotes, t('inventory.noLocation'))

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
      label: t('inventory.editElement'),
      onClick: () => onEdit && onEdit(elemento),
      disabled: disabled
    },
    {
      label: t('inventory.deleteElement'),
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
      className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${className}`}
      {...props}
    >
      {/* ============================================
          ACENTO SUPERIOR + HEADER
          ============================================ */}
      <div className="border-b border-slate-200">
        {/* Barra de acento esmeralda */}
        <div className="h-1 bg-emerald-300" />

        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Lado izquierdo: imagen/icono + info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {imagen ? (
                <img
                  src={`${BACKEND_URL}${imagen}`}
                  alt={nombre}
                  className="w-14 h-14 rounded-[10px] object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-blue-50 rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <IconoCategoria value={icono} size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{nombre}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                    <Layers className="w-3 h-3" />
                    {isLoadingLotes ? '…' : cantidad_total} {t('inventory.batches')}
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
                <strong>{t('inventory.lowStock')}</strong> {cantidad_disponible} {cantidad_disponible !== 1 ? t('inventory.availablesOf') : t('inventory.availableOf')} {stock_minimo} {t('inventory.minimum')}
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
          {t('inventory.errorLoadingBatches')} {errorLotes.message}
        </div>
      )}

      {/* ============================================
          ESTADÍSTICAS + BARRA DE DISPONIBILIDAD
          ============================================ */}
      <div className="px-6 pt-4">
        {/* Stats en grid */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          <StatMini label={t('common.total')} value={isLoadingLotes ? '-' : cantidad_total} color="slate" />
          <StatMini label={t('states.good')} value={isLoadingLotes ? '-' : (estadisticas.bueno || 0)} color="green" />
          <StatMini label={t('states.rented')} value={isLoadingLotes ? '-' : alquilados} color="blue" />
          <StatMini label={t('states.maintenanceShort')} value={isLoadingLotes ? '-' : enMantenimiento} color="amber" />
          <StatMini label={t('states.damaged')} value={isLoadingLotes ? '-' : dañados} color="red" />
        </div>

        {/* Barra de disponibilidad */}
        {!isLoadingLotes && cantidad_total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('states.availability')}</span>
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
            {/* Leyenda de colores */}
            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {t('states.available')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {t('states.rented')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {t('states.maintenanceDamaged')}
              </span>
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
            {t('inventory.byLocation')}
          </h4>
          <div className="flex items-center gap-2">
            {onMoveLote && lotes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowRightLeft className="w-4 h-4" />}
                onClick={() => setMostrarSelectorLotes(true)}
                disabled={disabled}
                title={t('inventory.moveBatchQuantity')}
              >
                {t('inventory.move')}
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
                {t('common.add')}
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
            title={t('inventory.noBatchesRegisteredMsg')}
            description={t('inventory.addInventoryDescription')}
            icon={Package}
            action={onAddLote && {
              label: t('inventory.addInventory'),
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
                defaultExpanded={idx === 0}
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
              <span>{ubicaciones.length} {t('common.locations').toLowerCase()}</span>
              <span className="text-slate-300">|</span>
              <span>{cantidad_total} {t('common.units').toLowerCase()}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-medium">{cantidad_disponible} {t('states.available').toLowerCase()}</span>
            </div>
            {/* Costo */}
            <div className="flex items-center gap-4">
              {costo_adquisicion && (
                <span className="flex items-center gap-1 text-slate-600">
                  <DollarSign className="w-3.5 h-3.5" />
                  {t('inventory.unitCost')} <strong className="text-slate-900">{formatearMoneda(costo_adquisicion)}</strong>
                </span>
              )}
              {valorTotal && (
                <span className="flex items-center gap-1 text-slate-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t('inventory.totalValue')} <strong className="text-emerald-700">{formatearMoneda(valorTotal)}</strong>
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
          title={t('inventory.selectBatchToMove')}
          size="md"
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {lotes.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                {t('inventory.noBatchesAvailableToMove')}
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
                      <UbicacionBadge ubicacion={lote.ubicacion || t('inventory.noLocation')} />
                      <EstadoBadge estado={lote.estado} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{lote.cantidad}</div>
                        <div className="text-xs text-slate-500">
                          {lote.cantidad === 1 ? t('common.unit').toLowerCase() : t('common.units').toLowerCase()}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                  {lote.lote_numero && (
                    <div className="mt-2 text-xs text-slate-500">{t('inventory.batch')} {lote.lote_numero}</div>
                  )}
                </button>
              ))
            )}
          </div>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setMostrarSelectorLotes(false)}>
              {t('common.cancel')}
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
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 192 })
    }
    setOpen(!open)
  }

  return (
    <div className="flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label={t('common.options')}
      >
        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed w-48 bg-white shadow-lg rounded-lg border border-slate-200 py-1 z-50"
            style={{ top: menuPos.top, left: Math.max(8, menuPos.left) }}
          >
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setOpen(false); opt.onClick() }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
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
function transformarLotesAUbicaciones(lotes, noLocationLabel = 'Sin ubicación') {
  if (!Array.isArray(lotes) || lotes.length === 0) return []

  const ubicacionesMap = lotes.reduce((acc, lote) => {
    const nombreUbicacion = lote.ubicacion || noLocationLabel
    if (!acc[nombreUbicacion]) {
      acc[nombreUbicacion] = { nombre: nombreUbicacion, cantidad_total: 0, lotes: [] }
    }
    acc[nombreUbicacion].cantidad_total += (lote.cantidad || 0)
    acc[nombreUbicacion].lotes.push(lote)
    return acc
  }, {})

  return Object.values(ubicacionesMap).sort((a, b) => {
    if (a.nombre === noLocationLabel) return 1
    if (b.nombre === noLocationLabel) return -1
    return a.nombre.localeCompare(b.nombre)
  })
}

export default ElementoLoteCard
