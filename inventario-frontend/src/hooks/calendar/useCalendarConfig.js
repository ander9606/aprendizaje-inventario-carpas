// ============================================
// HOOK: useCalendarConfig
// Maneja la configuración y estado del calendario
// ============================================

import { useState, useCallback, useMemo } from 'react'
import { DEFAULT_CALENDAR_OPTIONS, CALENDAR_VIEWS, CALENDAR_LOCALE } from '../../constants/calendarConfig'

/**
 * Hook para manejar la configuración del calendario
 *
 * @param {Object} initialOptions - Opciones iniciales
 * @returns {Object} - Configuración y funciones del calendario
 */
export const useCalendarConfig = (initialOptions = {}) => {
  // Estado de la vista actual
  const [currentView, setCurrentView] = useState(
    initialOptions.initialView || CALENDAR_VIEWS.MONTH
  )

  // Estado de la fecha actual
  const [currentDate, setCurrentDate] = useState(new Date())

  // Estado del rango de fechas visible
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  })

  // Estado del evento seleccionado
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Estado de la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState(null)

  /**
   * Handler para cambio de vista
   */
  const handleViewChange = useCallback((view) => {
    setCurrentView(view)
  }, [])

  /**
   * Handler para cambio de fechas (navegación)
   */
  const handleDatesSet = useCallback((dateInfo) => {
    setCurrentDate(dateInfo.start)
    setDateRange({
      start: dateInfo.start,
      end: dateInfo.end
    })
  }, [])

  /**
   * Handler para click en evento
   */
  const handleEventClick = useCallback((clickInfo) => {
    setSelectedEvent({
      event: clickInfo.event,
      jsEvent: clickInfo.jsEvent,
      el: clickInfo.el
    })
  }, [])

  /**
   * Handler para cerrar tooltip/modal de evento
   */
  const handleCloseEventDetail = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  /**
   * Handler para selección de fecha
   */
  const handleDateSelect = useCallback((selectInfo) => {
    setSelectedDate({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    })
  }, [])

  /**
   * Handler para cerrar selección de fecha
   */
  const handleCloseDateSelect = useCallback(() => {
    setSelectedDate(null)
  }, [])

  /**
   * Navegar a una fecha específica
   */
  const goToDate = useCallback((date) => {
    setCurrentDate(date)
  }, [])

  /**
   * Ir a hoy
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  /**
   * Configuración combinada para FullCalendar
   */
  const calendarOptions = useMemo(() => {
    return {
      ...DEFAULT_CALENDAR_OPTIONS,
      ...initialOptions,
      locale: CALENDAR_LOCALE.code,
      buttonText: CALENDAR_LOCALE.buttonText,
      allDayText: CALENDAR_LOCALE.allDayText,
      noEventsText: CALENDAR_LOCALE.noEventsText,
      initialView: currentView,
      initialDate: currentDate
    }
  }, [initialOptions, currentView, currentDate])

  /**
   * Handlers para pasar al componente FullCalendar
   */
  const calendarHandlers = useMemo(() => ({
    datesSet: handleDatesSet,
    eventClick: handleEventClick,
    select: handleDateSelect,
    viewDidMount: (viewInfo) => handleViewChange(viewInfo.view.type)
  }), [handleDatesSet, handleEventClick, handleDateSelect, handleViewChange])

  /**
   * Obtener título del mes/semana actual
   */
  const currentTitle = useMemo(() => {
    const options = { year: 'numeric', month: 'long' }
    return currentDate.toLocaleDateString('es-ES', options)
  }, [currentDate])

  return {
    // Estado
    currentView,
    currentDate,
    dateRange,
    selectedEvent,
    selectedDate,
    currentTitle,

    // Configuración
    calendarOptions,
    calendarHandlers,

    // Acciones
    setCurrentView: handleViewChange,
    goToDate,
    goToToday,
    closeEventDetail: handleCloseEventDetail,
    closeDateSelect: handleCloseDateSelect,

    // Constantes
    views: CALENDAR_VIEWS
  }
}

export default useCalendarConfig
