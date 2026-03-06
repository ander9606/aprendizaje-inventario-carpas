import { useMemo } from 'react'
import { X } from 'lucide-react'
import Spinner from '@shared/components/Spinner'
import { useGetSeries } from '../hooks/useSeries'
import { useGetLotes } from '../hooks/useLotes'
import { formatearFechaCorta } from '@shared/utils/helpers'

const ESTADO_BADGE_STYLES = {
  bueno: 'bg-green-100 text-green-800',
  disponible: 'bg-green-100 text-green-800',
  nuevo: 'bg-green-100 text-green-800',
  alquilado: 'bg-yellow-100 text-yellow-800',
  mantenimiento: 'bg-orange-100 text-orange-800',
  'dañado': 'bg-red-100 text-red-800',
  danado: 'bg-red-100 text-red-800',
}

const ESTADO_LABEL = {
  bueno: 'Bueno',
  disponible: 'Bueno',
  nuevo: 'Nuevo',
  alquilado: 'Alquilado',
  mantenimiento: 'Mantenimiento',
  'dañado': 'Dañado',
  danado: 'Dañado',
}

function StatMini({ label, value, bgColor, borderColor, textColor }) {
  return (
    <div className={`flex-1 rounded-lg border ${bgColor} ${borderColor} py-2.5 px-3.5 text-center`}>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-[11px] font-medium ${textColor}`}>{label}</p>
    </div>
  )
}

function EstadoBadgeInline({ estado }) {
  const styles = ESTADO_BADGE_STYLES[estado] || 'bg-slate-100 text-slate-700'
  const label = ESTADO_LABEL[estado] || estado
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${styles}`}>
      {label}
    </span>
  )
}

const ModalVerEstados = ({ isOpen, onClose, elemento }) => {
  const esSeries = !!elemento?.requiere_series
  const elementoId = elemento?.id

  // Hooks must be called unconditionally (rules of hooks)
  // useGetSeries accepts enabled option, useGetLotes uses elementoId truthiness
  const {
    series = [],
    estadisticas: statsSeries = {},
    isLoading: loadingSeries
  } = useGetSeries(esSeries ? elementoId : null, { enabled: isOpen && esSeries })

  const {
    lotes = [],
    estadisticas: statsLotes = {},
    cantidad_total: totalLotes = 0,
    isLoading: loadingLotes
  } = useGetLotes(isOpen && !esSeries ? elementoId : null)

  const isLoading = esSeries ? loadingSeries : loadingLotes

  const stats = useMemo(() => {
    if (esSeries) {
      return {
        bueno: (statsSeries.bueno || 0) + (statsSeries.disponible || 0) + (statsSeries.nuevo || 0),
        alquilado: statsSeries.alquilado || 0,
        mantenimiento: statsSeries.mantenimiento || 0,
        danado: statsSeries['dañado'] || statsSeries.danado || 0,
      }
    }
    return {
      bueno: (statsLotes.bueno || 0) + (statsLotes.nuevo || 0),
      alquilado: statsLotes.alquilado || 0,
      mantenimiento: statsLotes.mantenimiento || 0,
      danado: statsLotes['dañado'] || statsLotes.danado || 0,
    }
  }, [esSeries, statsSeries, statsLotes])

  if (!isOpen || !elemento) return null

  const total = esSeries ? series.length : totalLotes
  const emoji = elemento.categoria_padre_emoji || elemento.categoria_emoji || '📦'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-slate-900/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[580px] max-h-[85vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 rounded-[10px] flex items-center justify-center flex-shrink-0">
                <span className="text-[22px]">{emoji}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{elemento.nombre}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 text-[11px] font-medium">
                    {elemento.categoria_padre_nombre || 'Sin categoría'}
                  </span>
                  <span className="text-xs text-slate-500">
                    · {elemento.categoria_nombre || 'Sin subcategoría'}
                  </span>
                  <span className="text-xs text-slate-500">
                    · {total} {total === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X className="w-[18px] h-[18px] text-slate-500" />
            </button>
          </div>

          {/* Summary stats */}
          <div className="flex gap-2">
            <StatMini label="Bueno" value={stats.bueno} bgColor="bg-green-50" borderColor="border-green-200" textColor="text-green-800" />
            <StatMini label="Alquilado" value={stats.alquilado} bgColor="bg-amber-50" borderColor="border-amber-200" textColor="text-amber-800" />
            <StatMini label="Manten." value={stats.mantenimiento} bgColor="bg-orange-50" borderColor="border-orange-200" textColor="text-orange-800" />
            <StatMini label="Dañado" value={stats.danado} bgColor="bg-red-50" borderColor="border-red-200" textColor="text-red-800" />
          </div>
        </div>

        {/* Body - Table */}
        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : esSeries ? (
            /* Series table */
            <>
              {/* Table header */}
              <div className="flex items-center gap-2 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <span className="w-[120px]">Nº Serie</span>
                <span className="flex-1">Ubicación</span>
                <span className="w-[110px]">Estado</span>
                <span className="w-[110px]">Últ. actualización</span>
              </div>
              {/* Series rows */}
              {series.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">Sin series registradas</p>
              ) : (
                series.map((serie) => {
                  const rowBg = serie.estado === 'mantenimiento' ? 'bg-amber-50/50' :
                                serie.estado === 'dañado' || serie.estado === 'danado' ? 'bg-red-50/50' : ''
                  return (
                    <div
                      key={serie.id}
                      className={`flex items-center gap-2 py-2.5 border-b border-slate-100 ${rowBg}`}
                    >
                      <span className="w-[120px] text-[13px] font-semibold text-slate-900 truncate">
                        {serie.numero_serie}
                      </span>
                      <span className="flex-1 text-[13px] text-slate-600 truncate">
                        {serie.ubicacion || 'Sin ubicación'}
                      </span>
                      <span className="w-[110px] flex justify-center">
                        <EstadoBadgeInline estado={serie.estado} />
                      </span>
                      <span className="w-[110px] text-xs text-slate-400">
                        {serie.updated_at ? formatearFechaCorta(serie.updated_at) : '-'}
                      </span>
                    </div>
                  )
                })
              )}
            </>
          ) : (
            /* Lotes table */
            <>
              {/* Table header */}
              <div className="flex items-center gap-2 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <span className="flex-1">Ubicación</span>
                <span className="w-[110px]">Estado</span>
                <span className="w-[80px] text-center">Cantidad</span>
                <span className="w-[110px]">Últ. actualización</span>
              </div>
              {/* Lote rows */}
              {lotes.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">Sin lotes registrados</p>
              ) : (
                lotes.map((lote) => {
                  const rowBg = lote.estado === 'mantenimiento' ? 'bg-amber-50/50' :
                                lote.estado === 'dañado' || lote.estado === 'danado' ? 'bg-red-50/50' : ''
                  return (
                    <div
                      key={lote.id}
                      className={`flex items-center gap-2 py-2.5 border-b border-slate-100 ${rowBg}`}
                    >
                      <span className="flex-1 text-[13px] text-slate-600 truncate">
                        {lote.ubicacion || 'Sin ubicación'}
                      </span>
                      <span className="w-[110px] flex justify-center">
                        <EstadoBadgeInline estado={lote.estado} />
                      </span>
                      <span className="w-[80px] text-center text-[13px] font-semibold text-slate-900">
                        {lote.cantidad}
                      </span>
                      <span className="w-[110px] text-xs text-slate-400">
                        {lote.updated_at ? formatearFechaCorta(lote.updated_at) : '-'}
                      </span>
                    </div>
                  )
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalVerEstados
