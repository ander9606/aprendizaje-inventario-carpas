// ============================================
// COMPONENTE: ELEMENTO SERIE CARD (PROFESIONAL)
// Card para elementos gestionados por serie
// ============================================

import { useState } from 'react'
import SerieItem from './SerieItem'
import EmptyState from '../../common/EmptyState'
import Button from '../../common/Button'
import Spinner from '../../common/Spinner'
import { Plus, Package, Hash, Ruler, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'
import { formatearMoneda } from '../../../utils/helpers'

import { useGetSeries } from '../../../hooks/Useseries'

export const ElementoSerieCard = ({
  elemento,
  onEdit,
  onDelete,
  onAddSerie,
  onDevolverBodega,
  onEditSerie,
  onDeleteSerie,
  onMoveSerie,
  disabled = false,
  className = '',
  ...props
}) => {
  const [showAllSeries, setShowAllSeries] = useState(false)

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
  // CARGAR SERIES DEL ELEMENTO
  // ============================================
  const {
    series,
    estadisticas,
    total,
    disponibles,
    isLoading: isLoadingSeries,
    error: errorSeries
  } = useGetSeries(elementoId, {
    enabled: !!elementoId
  })

  // ============================================
  // CÁLCULOS
  // ============================================
  const alquilados = estadisticas.alquilado || 0
  const enMantenimiento = estadisticas.mantenimiento || 0
  const dañados = estadisticas.malo || estadisticas.dañado || estadisticas.danado || 0
  const pctDisponible = total > 0 ? Math.round((disponibles / total) * 100) : 0
  const pctAlquilado = total > 0 ? Math.round((alquilados / total) * 100) : 0
  const pctMantenimiento = total > 0 ? Math.round(((enMantenimiento + dañados) / total) * 100) : 0
  const stockBajo = stock_minimo > 0 && disponibles < stock_minimo && !isLoadingSeries
  const valorTotal = costo_adquisicion && total ? costo_adquisicion * total : null

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
  // SERIES A MOSTRAR
  // ============================================
  const ITEMS_PER_PAGE = 5
  const seriesToShow = showAllSeries ? series : series.slice(0, ITEMS_PER_PAGE)
  const hasMoreSeries = series.length > ITEMS_PER_PAGE

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
        {/* Barra de acento morada */}
        <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-500" />

        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Lado izquierdo: icono + info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0 mt-0.5">{icono}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{nombre}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Hash className="w-3 h-3" />
                    Series
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
                <strong>Stock bajo:</strong> {disponibles} disponible{disponibles !== 1 ? 's' : ''} de {stock_minimo} mínimo
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
      {errorSeries && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Error al cargar series: {errorSeries.message}
        </div>
      )}

      {/* ============================================
          ESTADÍSTICAS + BARRA DE DISPONIBILIDAD
          ============================================ */}
      <div className="px-6 pt-4">
        {/* Stats en grid */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <StatMini
            label="Total"
            value={isLoadingSeries ? '-' : total}
            color="slate"
          />
          <StatMini
            label="Disponible"
            value={isLoadingSeries ? '-' : disponibles}
            color="green"
          />
          <StatMini
            label="Alquilado"
            value={isLoadingSeries ? '-' : alquilados}
            color="blue"
          />
          <StatMini
            label="Mant./Dañado"
            value={isLoadingSeries ? '-' : (enMantenimiento + dañados)}
            color="amber"
          />
        </div>

        {/* Barra de disponibilidad */}
        {!isLoadingSeries && total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Disponibilidad</span>
              <span className="font-medium">{pctDisponible}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
              {pctDisponible > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pctDisponible}%` }}
                />
              )}
              {pctAlquilado > 0 && (
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${pctAlquilado}%` }}
                />
              )}
              {pctMantenimiento > 0 && (
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${pctMantenimiento}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          LISTA DE SERIES
          ============================================ */}
      <div className="px-6 pb-4">
        {/* Header: sección + botón */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Números de serie
          </h4>
          {onAddSerie && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => onAddSerie(elemento)}
              disabled={disabled}
            >
              Agregar
            </Button>
          )}
        </div>

        {isLoadingSeries ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : series.length === 0 ? (
          <EmptyState
            type="no-data"
            title="Sin series registradas"
            description="Agrega el primer número de serie"
            icon={Package}
            action={onAddSerie && {
              label: 'Agregar serie',
              onClick: () => onAddSerie(elemento),
              icon: <Plus />
            }}
          />
        ) : (
          <>
            <div className="space-y-2">
              {seriesToShow.map((serie) => (
                <SerieItem
                  key={serie.id || serie.numero_serie}
                  serie={serie}
                  onDevolverBodega={(serie) => onDevolverBodega && onDevolverBodega(serie, elemento)}
                  onEdit={(serie) => onEditSerie && onEditSerie(serie, elemento)}
                  onDelete={onDeleteSerie}
                  onMove={(serie) => onMoveSerie && onMoveSerie(serie, elemento)}
                  compact
                />
              ))}
            </div>
            {hasMoreSeries && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllSeries(!showAllSeries)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {showAllSeries ? 'Ver menos' : `Ver todas (${series.length} series)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================
          FOOTER: COSTO / VALOR
          ============================================ */}
      {!isLoadingSeries && (costo_adquisicion || valorTotal) && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
          {costo_adquisicion && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Costo unit.: <strong className="text-slate-900">{formatearMoneda(costo_adquisicion)}</strong></span>
            </div>
          )}
          {valorTotal && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Valor total: <strong className="text-emerald-700">{formatearMoneda(valorTotal)}</strong></span>
            </div>
          )}
        </div>
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
  }

  return (
    <div className={`rounded-lg border p-2.5 text-center ${colorMap[color]}`}>
      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
      <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
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

export default ElementoSerieCard
