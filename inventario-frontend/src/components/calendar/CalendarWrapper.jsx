// ============================================
// COMPONENTE: CalendarWrapper
// Wrapper principal para FullCalendar
// ============================================

import { useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { CALENDAR_STYLES } from '../../constants/calendarConfig'

/**
 * CalendarWrapper
 *
 * Componente wrapper para FullCalendar con configuración modular
 *
 * @param {Array} events - Eventos a mostrar
 * @param {Object} options - Opciones adicionales del calendario
 * @param {Object} handlers - Handlers de eventos
 * @param {string} className - Clases CSS adicionales
 */
const CalendarWrapper = ({
  events = [],
  options = {},
  handlers = {},
  className = '',
  calendarRef: externalRef
}) => {
  const internalRef = useRef(null)
  const calendarRef = externalRef || internalRef

  // Inyectar estilos CSS
  useEffect(() => {
    const styleId = 'fullcalendar-custom-styles'
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style')
      styleElement.id = styleId
      styleElement.textContent = CALENDAR_STYLES
      document.head.appendChild(styleElement)
    }

    return () => {
      // No eliminar los estilos al desmontar para evitar parpadeos
    }
  }, [])

  // Configuración por defecto
  const defaultOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      list: 'Lista'
    },
    allDayText: 'Todo el día',
    noEventsText: 'No hay eventos',
    navLinks: true,
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: 3,
    eventDisplay: 'block',
    height: 'auto',
    contentHeight: 'auto',
    expandRows: true,
    stickyHeaderDates: true,
    nowIndicator: true,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  }

  // Combinar opciones
  const mergedOptions = {
    ...defaultOptions,
    ...options
  }

  return (
    <div className={`calendar-wrapper ${className}`}>
      <FullCalendar
        ref={calendarRef}
        {...mergedOptions}
        events={events}
        {...handlers}
      />
    </div>
  )
}

export default CalendarWrapper
