/**
 * CONSTANTES DE LA APLICACIÓN
 *
 * Centraliza todos los valores constantes usados en la aplicación
 * para evitar duplicación y facilitar mantenimiento
 */

// ============================================
// ESTADOS DE ELEMENTOS/LOTES/SERIES
// ============================================

const ESTADOS = {
  NUEVO: 'nuevo',
  BUENO: 'bueno',
  MANTENIMIENTO: 'mantenimiento',
  ALQUILADO: 'alquilado',
  DAÑADO: 'dañado'
};

const ESTADOS_VALIDOS = Object.values(ESTADOS);

// ============================================
// TIPOS DE UBICACIÓN
// ============================================

const TIPOS_UBICACION = {
  // Almacenamiento
  BODEGA: 'bodega',
  TALLER: 'taller',
  TRANSITO: 'transito',
  // Lugares de Eventos
  FINCA: 'finca',
  HACIENDA: 'hacienda',
  JARDIN: 'jardin',
  CLUB: 'club',
  HOTEL: 'hotel',
  PLAYA: 'playa',
  PARQUE: 'parque',
  RESIDENCIA: 'residencia',
  EVENTO: 'evento',
  // Otros
  OTRO: 'otro'
};

const TIPOS_UBICACION_VALIDOS = Object.values(TIPOS_UBICACION);

// ============================================
// LÍMITES DE VALIDACIÓN
// ============================================

const LIMITES = {
  // Nombres y textos
  NOMBRE_MIN: 3,
  NOMBRE_MAX: 50,
  DESCRIPCION_MAX: 500,

  // Emoji
  EMOJI_MIN: 1,
  EMOJI_MAX: 10,

  // Números
  CANTIDAD_MIN: 0,
  CANTIDAD_MAX: 999999,
  PRECIO_MIN: 0,
  PRECIO_MAX: 9999999.99,

  // Búsquedas
  BUSQUEDA_MIN: 2,
  BUSQUEDA_MAX: 100,

  // Paginación
  PAGE_DEFAULT: 1,
  LIMIT_DEFAULT: 20,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,

  // Series y lotes
  SERIE_NUMERO_MAX: 100,
  LOTE_NUMERO_MAX: 100
};

// ============================================
// MENSAJES DE ERROR
// ============================================

const MENSAJES_ERROR = {
  // Genéricos
  CAMPO_REQUERIDO: (campo) => `${campo} es obligatorio`,
  CAMPO_INVALIDO: (campo) => `${campo} es inválido`,
  NO_ENCONTRADO: (entidad) => `${entidad} no encontrado(a)`,

  // Validaciones
  NOMBRE_VACIO: 'El nombre no puede estar vacío',
  NOMBRE_CORTO: `El nombre debe tener al menos ${LIMITES.NOMBRE_MIN} caracteres`,
  NOMBRE_LARGO: `El nombre debe tener máximo ${LIMITES.NOMBRE_MAX} caracteres`,

  CANTIDAD_INVALIDA: `La cantidad debe estar entre ${LIMITES.CANTIDAD_MIN} y ${LIMITES.CANTIDAD_MAX}`,
  CANTIDAD_INSUFICIENTE: 'Cantidad insuficiente disponible',

  ESTADO_INVALIDO: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
  UBICACION_TIPO_INVALIDO: `Tipo de ubicación inválido. Valores permitidos: ${TIPOS_UBICACION_VALIDOS.join(', ')}`,

  // Operaciones
  NO_SE_PUEDE_ELIMINAR_CON_HIJOS: (entidad) => `No se puede eliminar ${entidad} que tiene registros relacionados`,
  OPERACION_FALLIDA: (operacion) => `Error al ${operacion}`,

  // Búsquedas
  BUSQUEDA_CORTA: `El término de búsqueda debe tener al menos ${LIMITES.BUSQUEDA_MIN} caracteres`,
  BUSQUEDA_LARGA: `El término de búsqueda debe tener máximo ${LIMITES.BUSQUEDA_MAX} caracteres`
};

// ============================================
// MENSAJES DE ÉXITO
// ============================================

const MENSAJES_EXITO = {
  CREADO: (entidad) => `${entidad} creado(a) exitosamente`,
  ACTUALIZADO: (entidad) => `${entidad} actualizado(a) exitosamente`,
  ELIMINADO: (entidad) => `${entidad} eliminado(a) exitosamente`,
  MOVIMIENTO_EXITOSO: 'Movimiento realizado exitosamente',
  OPERACION_EXITOSA: 'Operación completada exitosamente'
};

// ============================================
// NOMBRES DE ENTIDADES (para mensajes)
// ============================================

const ENTIDADES = {
  CATEGORIA: 'Categoría',
  ELEMENTO: 'Elemento',
  SERIE: 'Serie',
  LOTE: 'Lote',
  UBICACION: 'Ubicación',
  MATERIAL: 'Material',
  UNIDAD: 'Unidad',
  // Productos y Alquileres
  CATEGORIA_PRODUCTO: 'Categoría de producto',
  ELEMENTO_COMPUESTO: 'Elemento compuesto',
  CLIENTE: 'Cliente',
  COTIZACION: 'Cotización',
  ALQUILER: 'Alquiler'
};

// ============================================
// CÓDIGOS HTTP PERSONALIZADOS
// ============================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// ============================================
// CONFIGURACIÓN DE PAGINACIÓN
// ============================================

const PAGINACION = {
  DEFAULT_PAGE: LIMITES.PAGE_DEFAULT,
  DEFAULT_LIMIT: LIMITES.LIMIT_DEFAULT,
  MAX_LIMIT: LIMITES.LIMIT_MAX
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  ESTADOS,
  ESTADOS_VALIDOS,
  TIPOS_UBICACION,
  TIPOS_UBICACION_VALIDOS,
  LIMITES,
  MENSAJES_ERROR,
  MENSAJES_EXITO,
  ENTIDADES,
  HTTP_STATUS,
  PAGINACION
};
