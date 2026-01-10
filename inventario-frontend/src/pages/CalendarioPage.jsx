// ============================================
// PÁGINA: Calendario de Cotizaciones
// Vista de calendario para eventos y cotizaciones
// ============================================

import { useState, useRef, useCallback } from 'react'
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../hooks/UseNavigation'
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
  const { volverAModulos } = useNavigation()
  const calendarRef = useRef(null)

  // ============================================
  // ESTADO
  // ============================================

  const [filters, setFilters] = useState({
    showMontaje: true,
    showEvento: true,
    showDesmontaje: true,
    filtroEstado: 'todos'
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
    filtroEstado: filters.filtroEstado === 'todos' ? null : filters.filtroEstado
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
      <Spinner
        fullScreen
        size="xl"
        text="Cargando calendario..."
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar el calendario
          </h2>
          <p className="text-slate-600 mb-6">
            {error.message || 'Ocurrio un error inesperado'}
          </p>
          <Button onClick={handleRefresh}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          {/* Navegacion superior */}
          <button
            onClick={volverAModulos}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Modulos</span>
          </button>

          <div className="flex items-center justify-between">
            {/* Titulo */}
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Calendario
                </h1>
                <p className="text-sm text-slate-600">
                  Vista de eventos y cotizaciones
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRefresh}
              >
                Actualizar
              </Button>
              <Button
                variant="primary"
                onClick={handleIrCotizaciones}
              >
                Ver Cotizaciones
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container mx-auto px-6 py-6 space-y-6">
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

          {/* Sidebar */}
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
