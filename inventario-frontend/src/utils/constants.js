// ============================================
// CONSTANTES DEL SISTEMA
// ============================================

// ============================================
// ESTADOS DE ELEMENTOS
// ============================================

export const ESTADOS = {
  NUEVO: 'nuevo',
  BUENO: 'bueno',
  ALQUILADO: 'alquilado',
  MANTENIMIENTO: 'mantenimiento',
  DANADO: 'dañado'
}

// Etiquetas legibles para los estados
export const ESTADO_LABELS = {
  [ESTADOS.NUEVO]: 'Nuevo',
  [ESTADOS.BUENO]: 'Bueno',
  [ESTADOS.ALQUILADO]: 'Alquilado',
  [ESTADOS.MANTENIMIENTO]: 'En Mantenimiento',
  [ESTADOS.DANADO]: 'Dañado'
}

// Colores Tailwind para cada estado
export const ESTADO_COLORS = {
  [ESTADOS.NUEVO]: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'purple'
  },
  [ESTADOS.BUENO]: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    badge: 'green'
  },
  [ESTADOS.ALQUILADO]: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'blue'
  },
  [ESTADOS.MANTENIMIENTO]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    badge: 'yellow'
  },
  [ESTADOS.DANADO]: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'red'
  }
}

// ============================================
// MOTIVOS DE MOVIMIENTO (para lotes)
// ============================================

export const MOTIVOS_MOVIMIENTO = {
  ALQUILER: 'alquiler',
  DEVOLUCION: 'devolucion',
  REPARACION: 'reparacion',
  LIMPIEZA: 'limpieza',
  TRASLADO: 'traslado',
  AJUSTE: 'ajuste'
}

export const MOTIVO_LABELS = {
  [MOTIVOS_MOVIMIENTO.ALQUILER]: 'Alquiler',
  [MOTIVOS_MOVIMIENTO.DEVOLUCION]: 'Devolución',
  [MOTIVOS_MOVIMIENTO.REPARACION]: 'Reparación',
  [MOTIVOS_MOVIMIENTO.LIMPIEZA]: 'Limpieza',
  [MOTIVOS_MOVIMIENTO.TRASLADO]: 'Traslado',
  [MOTIVOS_MOVIMIENTO.AJUSTE]: 'Ajuste de Inventario'
}

// ============================================
// TIPOS DE GESTIÓN
// ============================================

export const TIPOS_GESTION = {
  SERIES: 'series',
  LOTES: 'lotes'
}

export const TIPO_GESTION_LABELS = {
  [TIPOS_GESTION.SERIES]: 'Con Series',
  [TIPOS_GESTION.LOTES]: 'Por Lotes'
}

// ============================================
// COLORES DE UI
// ============================================

export const UI_COLORS = {
  PRIMARY: 'blue-600',
  SECONDARY: 'slate-600',
  SUCCESS: 'green-600',
  DANGER: 'red-600',
  WARNING: 'yellow-600',
  INFO: 'blue-500'
}

// ============================================
// ICONOS (para referencia con lucide-react)
// ============================================

export const ICON_NAMES = {
  // Navegación
  CATEGORY: 'Package',
  SUBCATEGORY: 'FolderOpen',
  ELEMENT: 'Box',
  
  // Gestión
  SERIES: 'Hash',
  LOTES: 'Layers',
  
  // Información
  LOCATION: 'MapPin',
  DATE: 'Calendar',
  STATS: 'TrendingUp',
  
  // Acciones
  ADD: 'Plus',
  EDIT: 'Edit',
  DELETE: 'Trash2',
  SEARCH: 'Search',
  FILTER: 'Filter',
  MOVE: 'ArrowRightLeft',
  
  // Estados
  CHECK: 'CheckCircle',
  ALERT: 'AlertCircle',
  INFO: 'Info',
  LOADER: 'Loader2'
}

// ============================================
// TAMAÑOS DE PAGINACIÓN
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
}

// ============================================
// MENSAJES
// ============================================

export const MESSAGES = {
  SUCCESS: {
    CREATE: 'Elemento creado exitosamente',
    UPDATE: 'Elemento actualizado exitosamente',
    DELETE: 'Elemento eliminado exitosamente',
    MOVE: 'Movimiento realizado exitosamente'
  },
  ERROR: {
    GENERIC: 'Ocurrió un error inesperado',
    NETWORK: 'Error de conexión con el servidor',
    NOT_FOUND: 'Elemento no encontrado',
    VALIDATION: 'Por favor, verifica los datos ingresados'
  },
  CONFIRM: {
    DELETE: '¿Estás seguro de eliminar este elemento?',
    CANCEL: '¿Estás seguro de cancelar? Los cambios no se guardarán'
  }
}

// ============================================
// VALIDACIONES
// ============================================

export const VALIDATION = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_CANTIDAD: 1,
  MAX_CANTIDAD: 999999
}