// ============================================
// HOOK: useCalendarEvents
// Transforma cotizaciones en eventos de calendario
// ============================================

import { useMemo, useCallback } from 'react'
import { EVENT_TYPES, EVENT_COLORS, ESTADO_COLORS } from '../../constants/calendarConfig'

/**
 * Hook para transformar cotizaciones en eventos de FullCalendar
 *
 * @param {Array} cotizaciones - Lista de cotizaciones
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Eventos y funciones helper
 */
export const useCalendarEvents = (cotizaciones = [], options = {}) => {
  const {
    showMontaje = true,
    showEvento = true,
    showDesmontaje = true,
    colorByEstado = false,
    filtroEstado = null
  } = options

  /**
   * Genera un ID único para cada evento
   */
  const generateEventId = useCallback((cotizacionId, tipo) => {
    return `${cotizacionId}-${tipo}`
  }, [])

  /**
   * Obtiene los colores del evento según tipo o estado
   */
  const getEventColors = useCallback((tipo, estado) => {
    if (colorByEstado && estado) {
      return ESTADO_COLORS[estado] || EVENT_COLORS[tipo]
    }
    return EVENT_COLORS[tipo]
  }, [colorByEstado])

  /**
   * Formatea una fecha para el calendario
   */
  const formatDate = useCallback((fecha) => {
    if (!fecha) return null
    return fecha.split('T')[0]
  }, [])

  /**
   * Crea un evento individual
   */
  const createEvent = useCallback((cotizacion, tipo, fecha) => {
    if (!fecha) return null

    const colors = getEventColors(tipo, cotizacion.estado)
    const clienteNombre = cotizacion.cliente?.nombre || cotizacion.cliente_nombre || 'Sin cliente'

    return {
      id: generateEventId(cotizacion.id, tipo),
      title: `${getTipoLabel(tipo)}: ${clienteNombre}`,
      start: formatDate(fecha),
      allDay: true,
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      textColor: colors.textColor,
      extendedProps: {
        cotizacionId: cotizacion.id,
        tipo,
        estado: cotizacion.estado,
        cliente: clienteNombre,
        eventoNombre: cotizacion.evento_nombre,
        eventoCiudad: cotizacion.evento_ciudad,
        total: cotizacion.total,
        fechaMontaje: cotizacion.fecha_montaje,
        fechaEvento: cotizacion.fecha_evento,
        fechaDesmontaje: cotizacion.fecha_desmontaje
      }
    }
  }, [generateEventId, getEventColors, formatDate])

  /**
   * Obtiene el label del tipo de evento
   */
  const getTipoLabel = (tipo) => {
    const labels = {
      [EVENT_TYPES.MONTAJE]: 'Montaje',
      [EVENT_TYPES.EVENTO]: 'Evento',
      [EVENT_TYPES.DESMONTAJE]: 'Desmontaje',
      [EVENT_TYPES.RESERVA]: 'Reserva'
    }
    return labels[tipo] || tipo
  }

  /**
   * Transforma todas las cotizaciones en eventos
   */
  const events = useMemo(() => {
    if (!cotizaciones || cotizaciones.length === 0) return []

    const eventList = []

    // Filtrar por estado si es necesario
    const cotizacionesFiltradas = filtroEstado
      ? cotizaciones.filter(c => c.estado === filtroEstado)
      : cotizaciones

    cotizacionesFiltradas.forEach(cotizacion => {
      // Evento de montaje
      if (showMontaje && cotizacion.fecha_montaje) {
        const evento = createEvent(cotizacion, EVENT_TYPES.MONTAJE, cotizacion.fecha_montaje)
        if (evento) eventList.push(evento)
      }

      // Evento principal
      if (showEvento && cotizacion.fecha_evento) {
        const evento = createEvent(cotizacion, EVENT_TYPES.EVENTO, cotizacion.fecha_evento)
        if (evento) eventList.push(evento)
      }

      // Evento de desmontaje
      if (showDesmontaje && cotizacion.fecha_desmontaje) {
        const evento = createEvent(cotizacion, EVENT_TYPES.DESMONTAJE, cotizacion.fecha_desmontaje)
        if (evento) eventList.push(evento)
      }
    })

    return eventList
  }, [cotizaciones, showMontaje, showEvento, showDesmontaje, filtroEstado, createEvent])

  /**
   * Encuentra una cotización por ID de evento
   */
  const findCotizacionByEventId = useCallback((eventId) => {
    const cotizacionId = eventId.split('-')[0]
    return cotizaciones.find(c => c.id === parseInt(cotizacionId))
  }, [cotizaciones])

  /**
   * Obtiene eventos por rango de fechas
   */
  const getEventsByDateRange = useCallback((startDate, endDate) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate >= startDate && eventDate <= endDate
    })
  }, [events])

  /**
   * Cuenta eventos por día
   */
  const getEventCountByDate = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.start === dateStr).length
  }, [events])

  /**
   * Estadísticas de eventos
   */
  const stats = useMemo(() => {
    const porTipo = {
      [EVENT_TYPES.MONTAJE]: 0,
      [EVENT_TYPES.EVENTO]: 0,
      [EVENT_TYPES.DESMONTAJE]: 0
    }

    const porEstado = {
      pendiente: 0,
      aprobada: 0,
      rechazada: 0,
      vencida: 0
    }

    events.forEach(event => {
      const tipo = event.extendedProps?.tipo
      const estado = event.extendedProps?.estado

      if (tipo && porTipo[tipo] !== undefined) {
        porTipo[tipo]++
      }

      if (estado && porEstado[estado] !== undefined) {
        porEstado[estado]++
      }
    })

    return {
      total: events.length,
      porTipo,
      porEstado
    }
  }, [events])

  return {
    events,
    stats,
    findCotizacionByEventId,
    getEventsByDateRange,
    getEventCountByDate,
    getTipoLabel
  }
}

export default useCalendarEvents
