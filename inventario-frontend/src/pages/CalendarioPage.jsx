// ============================================
// PÁGINA: Calendario de Cotizaciones
// Vista de calendario para eventos y cotizaciones
// ============================================

import { useState, useRef, useCallback } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGetCotizaciones } from '../hooks/cotizaciones'
import { useCalendarEvents, useCalendarConfig } from '../hooks/calendar'
import {
  CalendarWrapper,
  EventTooltip,
  CalendarFilters,
  CalendarLegend,
  CalendarStats
} from '../components/calendar'
import CotizacionDetalleModal from '../components/modals/CotizacionDetalleModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'

export default function CalendarioPage() {
  const navigate = useNavigate()
  const calendarRef = useRef(null)

  // ============================================
  // ESTADO
  // ============================================

  const [filters, setFilters] = useState({
    showMontaje: true,
    showEvento: true,
    showDesmontaje: true,
    filtroEstado: 'todos',
    mostrarFinalizados: false
  })

  const [tooltipData, setTooltipData] = useState(null)
  const [selectedCotizacionId, setSelectedCotizacionId] = useState(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

  // ============================================
  // HOOKS
  // ============================================

  const { cotizaciones, isLoading, error, refetch } = useGetCotizaciones()

  const { events, stats } = useCalendarEvents(cotizaciones, {
    showMontaje: filters.showMontaje,
    showEvento: filters.showEvento,
    showDesmontaje: filters.showDesmontaje,
    filtroEstado: filters.filtroEstado === 'todos' ? null : filters.filtroEstado,
    ocultarFinalizados: !filters.mostrarFinalizados
  })

  const { calendarOptions, goToToday } = useCalendarConfig()

  // ============================================
  // HANDLERS
  // ============================================

  const handleEventClick = useCallback((clickInfo) => {
    const { event, jsEvent } = clickInfo

    // Calcular posición del tooltip
    const x = Math.min(jsEvent.clientX, window.innerWidth - 300)
    const y = Math.min(jsEvent.clientY, window.innerHeight - 400)

    setTooltipData({
      event,
      position: { x, y }
    })
  }, [])

  const handleCloseTooltip = useCallback(() => {
    setTooltipData(null)
  }, [])

  const handleVerDetalle = useCallback((cotizacionId) => {
    setTooltipData(null)
    setSelectedCotizacionId(cotizacionId)
    setShowDetalleModal(true)
  }, [])

  const handleCloseDetalleModal = useCallback(() => {
    setShowDetalleModal(false)
    setSelectedCotizacionId(null)
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleIrCotizaciones = useCallback(() => {
    navigate('/alquileres/cotizaciones')
  }, [navigate])

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Cargando calendario..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar el calendario: {error.message || 'Ocurrió un error inesperado'}
          <Button variant="ghost" onClick={handleRefresh} className="ml-4">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            Calendario
          </h1>
          <p className="text-slate-500 mt-1">
            Vista de eventos y cotizaciones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={handleRefresh}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadisticas */}
      <CalendarStats stats={stats} />

      {/* Filtros */}
      <CalendarFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Calendario y Leyenda */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <CalendarWrapper
              calendarRef={calendarRef}
              events={events}
              options={calendarOptions}
              handlers={{
                eventClick: handleEventClick
              }}
            />
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Leyenda */}
          <CalendarLegend
            showTipos={true}
            showEstados={false}
            orientation="vertical"
          />

          {/* Acciones rapidas */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Acciones Rapidas
            </h3>
            <div className="space-y-2">
              <button
                onClick={goToToday}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Ir a Hoy
              </button>
              <button
                onClick={handleIrCotizaciones}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Nueva Cotizacion
              </button>
            </div>
          </div>

          {/* Resumen del mes */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Resumen
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Cotizaciones:</span>
                <span className="font-medium">{cotizaciones?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Eventos visibles:</span>
                <span className="font-medium">{events.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLTIP DE EVENTO */}
      {tooltipData && (
        <EventTooltip
          event={tooltipData.event}
          position={tooltipData.position}
          onClose={handleCloseTooltip}
          onVerDetalle={handleVerDetalle}
        />
      )}

      {/* MODAL DE DETALLE */}
      <CotizacionDetalleModal
        isOpen={showDetalleModal}
        onClose={handleCloseDetalleModal}
        cotizacionId={selectedCotizacionId}
      />
    </div>
  )
}
