// ============================================
// CONSTANTES DEL SISTEMA
// Todos los valores fijos y configuraciones
// ============================================

// ============================================
// ESTADOS DE LOS ELEMENTOS
// ============================================
// Estos son los 4 estados posibles que puede tener un elemento
export const ESTADOS = {
  BUENO: 'bueno',
  ALQUILADO: 'alquilado',
  MANTENIMIENTO: 'mantenimiento',
  DANADO: 'dañado'
}

// ============================================
// COLORES PARA CADA ESTADO (Tailwind CSS)
// ============================================
// Cada estado tiene su color para badges y tarjetas
// Formato: { bg, text, border }
export const ESTADO_COLORS = {
  [ESTADOS.BUENO]: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500'
  },
  [ESTADOS.ALQUILADO]: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  [ESTADOS.MANTENIMIENTO]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500'
  },
  [ESTADOS.DANADO]: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500'
  }
}

// ============================================
// ETIQUETAS AMIGABLES PARA ESTADOS
// ============================================
export const ESTADO_LABELS = {
  [ESTADOS.BUENO]: '✅ Bueno',
  [ESTADOS.ALQUILADO]: '📦 Alquilado',
  [ESTADOS.MANTENIMIENTO]: '🔧 Mantenimiento',
  [ESTADOS.DANADO]: '⚠️ Dañado'
}

// ============================================
// COLORES DE LA UI PRINCIPAL
// ============================================
export const UI_COLORS = {
  primary: 'blue-600',
  secondary: 'slate-600',
  success: 'green-600',
  danger: 'red-600',
  warning: 'yellow-600',
  info: 'cyan-600'
}

// ============================================
// TIPOS DE GESTIÓN DE ELEMENTOS
// ============================================
export const TIPOS_GESTION = {
  SERIE: 'serie',    // Elementos con número de serie individual
  LOTE: 'lote'       // Elementos gestionados por cantidad
}

// ============================================
// TAMAÑOS PARA COMPONENTES
// ============================================
export const SIZES = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
}

// ============================================
// VARIANTES PARA BOTONES Y BADGES
// ============================================
export const VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  ghost: 'ghost',
  outline: 'outline'
}

// ============================================
// CONFIGURACIÓN DE REACT QUERY
// ============================================
export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,        // 5 minutos - tiempo antes de considerar datos obsoletos
  cacheTime: 10 * 60 * 1000,       // 10 minutos - tiempo de cache
  refetchOnWindowFocus: false,      // No recargar al volver a la ventana
  retry: 1,                         // Reintentar 1 vez si falla
}

// ============================================
// ENDPOINTS DE LA API
// ============================================
// Esta es la URL base de tu backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// ============================================
// MENSAJES DE ÉXITO
// ============================================
export const SUCCESS_MESSAGES = {
  CATEGORIA_CREADA: 'Categoría creada exitosamente',
  CATEGORIA_ACTUALIZADA: 'Categoría actualizada exitosamente',
  CATEGORIA_ELIMINADA: 'Categoría eliminada exitosamente',
  ELEMENTO_CREADO: 'Elemento creado exitosamente',
  ELEMENTO_ACTUALIZADO: 'Elemento actualizado exitosamente',
  ELEMENTO_ELIMINADO: 'Elemento eliminado exitosamente',
  SERIE_CREADA: 'Serie creada exitosamente',
  LOTE_MOVIDO: 'Cantidad movida exitosamente'
}

// ============================================
// MENSAJES DE ERROR
// ============================================
export const ERROR_MESSAGES = {
  // Errores generales
  GENERIC: 'Ocurrió un error. Por favor intenta nuevamente',
  NETWORK: 'Error de conexión. Verifica tu internet',
  NOT_FOUND: 'No se encontró el recurso solicitado',
  UNAUTHORIZED: 'No tienes permisos para esta acción',
  VALIDATION: 'Por favor verifica los datos ingresados',

  // Errores de elementos
  ELEMENTO_CON_SERIES: 'No se puede eliminar un elemento que tiene series o lotes asociados',

  // Errores de series
  SERIE_NUMERO_DUPLICADO: 'Este número de serie ya existe. Por favor usa otro',
  SERIE_ALQUILADA: 'No se puede eliminar una serie que está alquilada',
  TRANSICION_NO_PERMITIDA: 'Esta transición de estado no está permitida',

  // Errores de lotes
  LOTE_SIN_CANTIDAD: 'Cantidad insuficiente en el lote origen',
  LOTE_CANTIDAD_INVALIDA: 'La cantidad debe ser mayor a cero'
}