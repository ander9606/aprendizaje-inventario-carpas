// ============================================
// CONSTANTES: Configuración del Calendario
// Configuraciones y estilos para FullCalendar
// ============================================

/**
 * Configuración de idioma español
 */
export const CALENDAR_LOCALE = {
  code: 'es',
  week: {
    dow: 1, // Lunes como primer día
    doy: 4
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    list: 'Lista'
  },
  weekText: 'Sm',
  allDayText: 'Todo el día',
  moreLinkText: 'más',
  noEventsText: 'No hay eventos'
}

/**
 * Tipos de eventos del calendario
 */
export const EVENT_TYPES = {
  MONTAJE: 'montaje',
  EVENTO: 'evento',
  DESMONTAJE: 'desmontaje',
  RESERVA: 'reserva'
}

/**
 * Colores por tipo de evento
 */
export const EVENT_COLORS = {
  [EVENT_TYPES.MONTAJE]: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    textColor: '#FFFFFF'
  },
  [EVENT_TYPES.EVENTO]: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    textColor: '#FFFFFF'
  },
  [EVENT_TYPES.DESMONTAJE]: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
    textColor: '#FFFFFF'
  },
  [EVENT_TYPES.RESERVA]: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
    textColor: '#FFFFFF'
  }
}

/**
 * Colores por estado de cotización
 */
export const ESTADO_COLORS = {
  pendiente: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    textColor: '#92400E'
  },
  aprobada: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    textColor: '#065F46'
  },
  rechazada: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    textColor: '#991B1B'
  },
  vencida: {
    backgroundColor: '#E5E7EB',
    borderColor: '#6B7280',
    textColor: '#374151'
  }
}

/**
 * Iconos para tipos de evento (usando Lucide)
 */
export const EVENT_ICONS = {
  [EVENT_TYPES.MONTAJE]: 'Wrench',
  [EVENT_TYPES.EVENTO]: 'PartyPopper',
  [EVENT_TYPES.DESMONTAJE]: 'PackageOpen',
  [EVENT_TYPES.RESERVA]: 'CalendarCheck'
}

/**
 * Opciones de vista del calendario
 */
export const CALENDAR_VIEWS = {
  MONTH: 'dayGridMonth',
  WEEK: 'timeGridWeek',
  DAY: 'timeGridDay',
  LIST: 'listWeek'
}

/**
 * Configuración por defecto del calendario
 */
export const DEFAULT_CALENDAR_OPTIONS = {
  initialView: CALENDAR_VIEWS.MONTH,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,listWeek'
  },
  locale: CALENDAR_LOCALE.code,
  firstDay: 1, // Lunes
  weekNumbers: false,
  navLinks: true,
  editable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: 3,
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  slotMinTime: '06:00:00',
  slotMaxTime: '22:00:00',
  expandRows: true,
  stickyHeaderDates: true,
  nowIndicator: true
}

/**
 * Estilos CSS personalizados para el calendario
 */
export const CALENDAR_STYLES = `
  .fc {
    font-family: inherit;
  }

  .fc .fc-toolbar-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
  }

  .fc .fc-button {
    background-color: #f1f5f9;
    border-color: #e2e8f0;
    color: #475569;
    font-weight: 500;
    padding: 0.5rem 1rem;
    transition: all 0.2s;
  }

  .fc .fc-button:hover {
    background-color: #e2e8f0;
    border-color: #cbd5e1;
    color: #1e293b;
  }

  .fc .fc-button-primary:not(:disabled).fc-button-active,
  .fc .fc-button-primary:not(:disabled):active {
    background-color: #3b82f6;
    border-color: #2563eb;
    color: white;
  }

  .fc .fc-daygrid-day-number {
    color: #475569;
    font-weight: 500;
    padding: 0.5rem;
  }

  .fc .fc-daygrid-day.fc-day-today {
    background-color: #EFF6FF;
  }

  .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
    color: #2563eb;
    font-weight: 700;
  }

  .fc-event {
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.75rem;
    padding: 2px 4px;
    margin: 1px 2px;
  }

  .fc-event:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .fc .fc-more-link {
    color: #3b82f6;
    font-weight: 600;
  }

  .fc .fc-col-header-cell-cushion {
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    padding: 0.75rem 0;
  }

  .fc-theme-standard td,
  .fc-theme-standard th {
    border-color: #e2e8f0;
  }

  .fc-timegrid-slot {
    height: 3rem;
  }

  .fc-list-event:hover td {
    background-color: #f8fafc;
  }
`
