// ============================================
// COMPONENTE: DisponibilidadFechaSelector
// Muestra disponibilidad del elemento según fecha
// ============================================

import { useState, useMemo } from 'react'
import { Calendar, AlertCircle, CheckCircle, Package } from 'lucide-react'
import { useGetElementoConOcupaciones } from '../../hooks/Useelementos'
import Spinner from '../common/Spinner'

/**
 * DisponibilidadFechaSelector
 *
 * Componente que permite seleccionar una fecha y ver:
 * - Cuántas unidades estarán ocupadas
 * - Cuántas estarán disponibles
 * - Qué eventos causan la ocupación
 *
 * @param {number} elementoId - ID del elemento
 * @param {boolean} requiereSeries - Si el elemento usa series o lotes
 * @param {number} stockTotal - Stock total del elemento (para calcular porcentajes)
 */
function DisponibilidadFechaSelector({ elementoId, requiereSeries, stockTotal = 0 }) {
  // Estado para la fecha seleccionada (por defecto hoy)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Hook para obtener ocupaciones del elemento
  const {
    ocupaciones,
    isLoading,
    error
  } = useGetElementoConOcupaciones(elementoId, fechaSeleccionada)

  // Calcular disponibilidad según tipo de elemento
  const disponibilidad = useMemo(() => {
    if (!ocupaciones) return null

    if (requiereSeries) {
      // Para SERIES: usar el resumen de ocupaciones
      const resumen = ocupaciones.resumen || {}
      return {
        total: resumen.total || stockTotal || 0,
        ocupados: resumen.en_alquiler || 0,
        disponibles: resumen.disponibles_hoy ?? (resumen.total - resumen.en_alquiler) ?? 0,
        eventos: ocupaciones.proximos_eventos || []
      }
    } else {
      // Para LOTES: usar datos de disponibilidad
      const total = stockTotal || ocupaciones.stock_total || 0
      const disponibles = ocupaciones.disponibles_hoy ?? total
      return {
        total,
        ocupados: total - disponibles,
        disponibles,
        eventos: ocupaciones.en_eventos || [],
        rangos: ocupaciones.disponibilidad_por_rangos || []
      }
    }
  }, [ocupaciones, requiereSeries, stockTotal])

  // Encontrar eventos que afectan la fecha seleccionada
  const eventosEnFecha = useMemo(() => {
    if (!disponibilidad?.eventos) return []

    return disponibilidad.eventos.filter(evento => {
      const fechaMontaje = evento.fecha_montaje?.split('T')[0]
      const fechaDesmontaje = evento.fecha_desmontaje?.split('T')[0]
      return fechaSeleccionada >= fechaMontaje && fechaSeleccionada <= fechaDesmontaje
    }).slice(0, 5) // Mostrar máximo 5 eventos
  }, [disponibilidad?.eventos, fechaSeleccionada])

  // Handler para cambio de fecha
  const handleFechaChange = (e) => {
    setFechaSeleccionada(e.target.value)
  }

  // Calcular porcentaje de ocupación
  const porcentajeOcupacion = useMemo(() => {
    if (!disponibilidad || disponibilidad.total === 0) return 0
    return Math.round((disponibilidad.ocupados / disponibilidad.total) * 100)
  }, [disponibilidad])

  // Determinar color según ocupación
  const getColorClasses = () => {
    if (porcentajeOcupacion >= 80) return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      bar: 'bg-red-500',
      text: 'text-red-700'
    }
    if (porcentajeOcupacion >= 50) return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      bar: 'bg-yellow-500',
      text: 'text-yellow-700'
    }
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      bar: 'bg-green-500',
      text: 'text-green-700'
    }
  }

  const colors = getColorClasses()

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return ''
    const fecha = new Date(fechaStr + 'T00:00:00')
    return fecha.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
      {/* Header con selector de fecha */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          <span className="font-medium text-slate-700">Disponibilidad por fecha</span>
        </div>

        <input
          type="date"
          value={fechaSeleccionada}
          onChange={handleFechaChange}
          min={new Date().toISOString().split('T')[0]}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
          <span className="ml-2 text-sm text-slate-500">Consultando disponibilidad...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 py-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Error al consultar disponibilidad</span>
        </div>
      )}

      {/* Resultados */}
      {!isLoading && !error && disponibilidad && (
        <>
          {/* Fecha seleccionada */}
          <p className="text-sm text-slate-600 mb-3">
            {formatearFecha(fechaSeleccionada)}
          </p>

          {/* Stats principales */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Total */}
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {disponibilidad.total}
              </div>
              <div className="text-xs text-slate-500">Total</div>
            </div>

            {/* Ocupados */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${colors.text}`}>
                {disponibilidad.ocupados}
              </div>
              <div className="text-xs text-slate-500">Ocupados</div>
            </div>

            {/* Disponibles */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {disponibilidad.disponibles}
              </div>
              <div className="text-xs text-slate-500">Disponibles</div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Ocupación</span>
              <span>{porcentajeOcupacion}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bar} transition-all duration-300`}
                style={{ width: `${porcentajeOcupacion}%` }}
              />
            </div>
          </div>

          {/* Eventos en esa fecha */}
          {eventosEnFecha.length > 0 && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <p className="text-xs font-medium text-slate-600 mb-2">
                Eventos en esta fecha:
              </p>
              <div className="space-y-1.5">
                {eventosEnFecha.map((evento, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-700 truncate max-w-[150px]">
                        {evento.evento_nombre || evento.cliente || 'Evento'}
                      </span>
                    </div>
                    <span className="font-medium text-slate-600">
                      {evento.cantidad || evento.cantidad_reservada || 1} uds
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje si no hay ocupación */}
          {disponibilidad.ocupados === 0 && (
            <div className="flex items-center gap-2 text-green-600 pt-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">
                Todo disponible en esta fecha
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DisponibilidadFechaSelector
