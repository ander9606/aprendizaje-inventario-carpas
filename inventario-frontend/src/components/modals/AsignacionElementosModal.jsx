// ============================================
// MODAL: AsignacionElementosModal
// Asignar elementos físicos y marcar salida
// ============================================

import { useState, useEffect } from 'react'
import {
  X,
  Package,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  LogOut
} from 'lucide-react'
import { useMarcarSalidaAlquiler } from '../../hooks/useAlquileres'
import { useVerificarDisponibilidadCotizacion } from '../../hooks/useDisponibilidad'
import Button from '../common/Button'
import Spinner from '../common/Spinner'

/**
 * AsignacionElementosModal
 *
 * Modal para asignar elementos físicos (series/lotes) al alquiler
 * y marcar la salida del mismo.
 *
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {Function} onClose - Callback al cerrar
 * @param {Object} alquiler - Datos del alquiler
 * @param {Function} onSuccess - Callback al completar exitosamente
 */
const AsignacionElementosModal = ({
  isOpen,
  onClose,
  alquiler,
  onSuccess
}) => {
  // ============================================
  // ESTADO
  // ============================================
  const [notasSalida, setNotasSalida] = useState('')
  const [elementosSeleccionados, setElementosSeleccionados] = useState({})
  const [loteCantidades, setLoteCantidades] = useState({})

  // ============================================
  // QUERIES Y MUTATIONS
  // ============================================
  const { disponibilidad, isLoading: loadingDisponibilidad } = useVerificarDisponibilidadCotizacion(
    alquiler?.cotizacion_id
  )
  const marcarSalida = useMarcarSalidaAlquiler()

  // ============================================
  // EFECTOS
  // ============================================

  // Inicializar selecciones cuando carga la disponibilidad
  useEffect(() => {
    if (disponibilidad?.elementos) {
      const selecciones = {}
      const cantidades = {}

      disponibilidad.elementos.forEach(elem => {
        if (elem.requiere_series && elem.series_disponibles) {
          // Pre-seleccionar series automáticamente según cantidad requerida
          const seriesASeleccionar = elem.series_disponibles
            .slice(0, elem.cantidad_requerida)
            .map(s => s.id)
          selecciones[elem.elemento_id] = seriesASeleccionar
        } else if (elem.lotes_disponibles) {
          // Para lotes, pre-llenar con la cantidad requerida del primer lote disponible
          const lote = elem.lotes_disponibles[0]
          if (lote) {
            cantidades[`${elem.elemento_id}_${lote.id}`] = Math.min(
              elem.cantidad_requerida,
              lote.cantidad_disponible
            )
          }
        }
      })

      setElementosSeleccionados(selecciones)
      setLoteCantidades(cantidades)
    }
  }, [disponibilidad])

  // ============================================
  // HELPERS
  // ============================================

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Verificar si un elemento cumple con la cantidad requerida
   */
  const cumpleRequerimiento = (elem) => {
    if (elem.requiere_series) {
      const seleccionadas = elementosSeleccionados[elem.elemento_id] || []
      return seleccionadas.length >= elem.cantidad_requerida
    } else {
      // Para lotes, sumar todas las cantidades asignadas
      let total = 0
      Object.entries(loteCantidades).forEach(([key, cant]) => {
        if (key.startsWith(`${elem.elemento_id}_`)) {
          total += cant
        }
      })
      return total >= elem.cantidad_requerida
    }
  }

  /**
   * Obtener cantidad seleccionada de un elemento
   */
  const getCantidadSeleccionada = (elem) => {
    if (elem.requiere_series) {
      return (elementosSeleccionados[elem.elemento_id] || []).length
    } else {
      let total = 0
      Object.entries(loteCantidades).forEach(([key, cant]) => {
        if (key.startsWith(`${elem.elemento_id}_`)) {
          total += cant
        }
      })
      return total
    }
  }

  /**
   * Verificar si todos los elementos cumplen requerimientos
   */
  const todosCompletos = () => {
    if (!disponibilidad?.elementos) return false
    return disponibilidad.elementos.every(elem => cumpleRequerimiento(elem))
  }

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Toggle selección de serie
   */
  const handleToggleSerie = (elementoId, serieId) => {
    setElementosSeleccionados(prev => {
      const actuales = prev[elementoId] || []
      const yaSeleccionada = actuales.includes(serieId)

      if (yaSeleccionada) {
        return {
          ...prev,
          [elementoId]: actuales.filter(id => id !== serieId)
        }
      } else {
        return {
          ...prev,
          [elementoId]: [...actuales, serieId]
        }
      }
    })
  }

  /**
   * Cambiar cantidad de lote
   */
  const handleCambiarCantidadLote = (elementoId, loteId, cantidad, maximo) => {
    const valor = Math.max(0, Math.min(parseInt(cantidad) || 0, maximo))
    setLoteCantidades(prev => ({
      ...prev,
      [`${elementoId}_${loteId}`]: valor
    }))
  }

  /**
   * Confirmar salida
   */
  const handleConfirmar = async () => {
    try {
      // Construir array de elementos a asignar
      const elementos = []

      if (disponibilidad?.elementos) {
        disponibilidad.elementos.forEach(elem => {
          if (elem.requiere_series) {
            // Agregar series seleccionadas
            const seriesIds = elementosSeleccionados[elem.elemento_id] || []
            seriesIds.forEach(serieId => {
              const serie = elem.series_disponibles.find(s => s.id === serieId)
              elementos.push({
                elemento_id: elem.elemento_id,
                serie_id: serieId,
                estado_salida: serie?.estado || 'bueno',
                ubicacion_original_id: serie?.ubicacion_id
              })
            })
          } else {
            // Agregar lotes con cantidades
            Object.entries(loteCantidades).forEach(([key, cantidad]) => {
              if (key.startsWith(`${elem.elemento_id}_`) && cantidad > 0) {
                const loteId = parseInt(key.split('_')[1])
                const lote = elem.lotes_disponibles.find(l => l.id === loteId)
                elementos.push({
                  elemento_id: elem.elemento_id,
                  lote_id: loteId,
                  cantidad_lote: cantidad,
                  estado_salida: lote?.estado || 'bueno',
                  ubicacion_original_id: lote?.ubicacion_id
                })
              }
            })
          }
        })
      }

      await marcarSalida.mutateAsync({
        id: alquiler.id,
        datos: {
          fecha_salida: new Date().toISOString(),
          notas_salida: notasSalida,
          elementos
        }
      })

      onSuccess()
    } catch (error) {
      console.error('Error al marcar salida:', error)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-indigo-600" />
              Asignar Elementos - Marcar Salida
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Selecciona los elementos físicos para este alquiler
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info del alquiler */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{alquiler?.cliente_nombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{alquiler?.evento_nombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Salida: {formatFecha(alquiler?.fecha_salida)}</span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingDisponibilidad ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" text="Cargando disponibilidad..." />
            </div>
          ) : !disponibilidad?.elementos || disponibilidad.elementos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay elementos para asignar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {disponibilidad.elementos.map((elem, index) => {
                const cumple = cumpleRequerimiento(elem)
                const cantidadActual = getCantidadSeleccionada(elem)

                return (
                  <div
                    key={elem.elemento_id}
                    className={`
                      border rounded-lg p-4
                      ${cumple ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}
                    `}
                  >
                    {/* Header del elemento */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {elem.elemento_nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cumple ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
                        <span className={`
                          text-sm font-medium
                          ${cumple ? 'text-green-600' : 'text-amber-600'}
                        `}>
                          {cantidadActual} / {elem.cantidad_requerida}
                        </span>
                      </div>
                    </div>

                    {/* Lista de series disponibles */}
                    {elem.requiere_series && elem.series_disponibles && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 mb-2">
                          Selecciona {elem.cantidad_requerida} serie(s):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {elem.series_disponibles.map(serie => {
                            const seleccionada = (elementosSeleccionados[elem.elemento_id] || []).includes(serie.id)

                            return (
                              <label
                                key={serie.id}
                                className={`
                                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                                  ${seleccionada
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                  }
                                `}
                              >
                                <input
                                  type="checkbox"
                                  checked={seleccionada}
                                  onChange={() => handleToggleSerie(elem.elemento_id, serie.id)}
                                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900">
                                    {serie.codigo}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {serie.ubicacion_nombre} • {serie.estado}
                                  </p>
                                </div>
                              </label>
                            )
                          })}
                        </div>

                        {elem.series_disponibles.length < elem.cantidad_requerida && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 rounded text-amber-700 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            Solo hay {elem.series_disponibles.length} serie(s) disponible(s)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lista de lotes disponibles */}
                    {!elem.requiere_series && elem.lotes_disponibles && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 mb-2">
                          Asigna {elem.cantidad_requerida} unidades de los lotes disponibles:
                        </p>
                        <div className="space-y-2">
                          {elem.lotes_disponibles.map(lote => {
                            const cantidad = loteCantidades[`${elem.elemento_id}_${lote.id}`] || 0

                            return (
                              <div
                                key={lote.id}
                                className={`
                                  flex items-center gap-4 p-3 rounded-lg border
                                  ${cantidad > 0 ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'}
                                `}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900">
                                    Lote {lote.codigo}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {lote.ubicacion_nombre} • Disponibles: {lote.cantidad_disponible}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={lote.cantidad_disponible}
                                    value={cantidad}
                                    onChange={(e) => handleCambiarCantidadLote(
                                      elem.elemento_id,
                                      lote.id,
                                      e.target.value,
                                      lote.cantidad_disponible
                                    )}
                                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                  />
                                  <span className="text-sm text-slate-500">unidades</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Notas de salida */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas de salida (opcional)
                </label>
                <textarea
                  value={notasSalida}
                  onChange={(e) => setNotasSalida(e.target.value)}
                  placeholder="Observaciones al momento de la salida..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-sm text-slate-500">
            {disponibilidad?.elementos && (
              <span>
                {disponibilidad.elementos.filter(e => cumpleRequerimiento(e)).length} de {disponibilidad.elementos.length} elementos listos
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmar}
              disabled={!todosCompletos() || marcarSalida.isPending}
              icon={marcarSalida.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            >
              {marcarSalida.isPending ? 'Procesando...' : 'Confirmar Salida'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AsignacionElementosModal
