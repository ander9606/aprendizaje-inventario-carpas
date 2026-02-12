/**
 * VALIDADORES CENTRALIZADOS
 *
 * Funciones reutilizables para validar datos en toda la aplicación
 */

const AppError = require('./AppError');
const { LIMITES, ESTADOS_VALIDOS, TIPOS_UBICACION_VALIDOS, TIPOS_UNIDAD_VALIDOS, MENSAJES_ERROR } = require('../config/constants');

// ============================================
// VALIDADORES DE CAMPOS BÁSICOS
// ============================================

/**
 * Valida que un campo sea requerido y no esté vacío
 * @param {*} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para mensajes
 * @throws {AppError} Si el campo no es válido
 */
const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw new AppError(MENSAJES_ERROR.CAMPO_REQUERIDO(fieldName), 400);
  }

  // Si es string, validar que no sea solo espacios
  if (typeof value === 'string' && value.trim() === '') {
    throw new AppError(`${fieldName} no puede estar vacío`, 400);
  }

  return value;
};

/**
 * Valida un nombre (3-50 caracteres)
 * @param {string} nombre - Nombre a validar
 * @param {string} fieldName - Nombre del campo (default: 'Nombre')
 * @throws {AppError} Si el nombre no es válido
 * @returns {string} Nombre trimmed
 */
const validateNombre = (nombre, fieldName = 'Nombre') => {
  validateRequired(nombre, fieldName);

  if (typeof nombre !== 'string') {
    throw new AppError(`${fieldName} debe ser una cadena de texto`, 400);
  }

  const trimmed = nombre.trim();

  if (trimmed.length < LIMITES.NOMBRE_MIN) {
    throw new AppError(
      `${fieldName} debe tener al menos ${LIMITES.NOMBRE_MIN} caracteres`,
      400
    );
  }

  if (trimmed.length > LIMITES.NOMBRE_MAX) {
    throw new AppError(
      `${fieldName} debe tener máximo ${LIMITES.NOMBRE_MAX} caracteres`,
      400
    );
  }

  return trimmed;
};

/**
 * Valida un emoji (opcional, 1-10 caracteres)
 * @param {string} emoji - Emoji a validar
 * @throws {AppError} Si el emoji no es válido
 * @returns {string|null} Emoji trimmed o null
 */
const validateEmoji = (emoji) => {
  if (!emoji) return null;

  if (typeof emoji !== 'string') {
    throw new AppError('El emoji debe ser una cadena de texto', 400);
  }

  const trimmed = emoji.trim();

  if (trimmed.length < LIMITES.EMOJI_MIN) {
    throw new AppError(`El emoji debe tener al menos ${LIMITES.EMOJI_MIN} caracter`, 400);
  }

  if (trimmed.length > LIMITES.EMOJI_MAX) {
    throw new AppError(`El emoji debe tener máximo ${LIMITES.EMOJI_MAX} caracteres`, 400);
  }

  return trimmed;
};

/**
 * Valida una descripción (opcional, máximo 500 caracteres)
 * @param {string} descripcion - Descripción a validar
 * @throws {AppError} Si la descripción no es válida
 * @returns {string|null} Descripción trimmed o null
 */
const validateDescripcion = (descripcion) => {
  if (!descripcion) return null;

  if (typeof descripcion !== 'string') {
    throw new AppError('La descripción debe ser una cadena de texto', 400);
  }

  const trimmed = descripcion.trim();

  if (trimmed.length > LIMITES.DESCRIPCION_MAX) {
    throw new AppError(
      `La descripción debe tener máximo ${LIMITES.DESCRIPCION_MAX} caracteres`,
      400
    );
  }

  return trimmed;
};

// ============================================
// VALIDADORES NUMÉRICOS
// ============================================

/**
 * Valida una cantidad (número entero positivo o cero)
 * @param {number} cantidad - Cantidad a validar
 * @param {string} fieldName - Nombre del campo (default: 'Cantidad')
 * @param {boolean} required - Si es obligatorio (default: true)
 * @throws {AppError} Si la cantidad no es válida
 * @returns {number} Cantidad validada
 */
const validateCantidad = (cantidad, fieldName = 'Cantidad', required = true) => {
  if (required) {
    validateRequired(cantidad, fieldName);
  } else if (cantidad === undefined || cantidad === null) {
    return null;
  }

  const num = Number(cantidad);

  if (isNaN(num)) {
    throw new AppError(`${fieldName} debe ser un número`, 400);
  }

  if (!Number.isInteger(num)) {
    throw new AppError(`${fieldName} debe ser un número entero`, 400);
  }

  if (num < LIMITES.CANTIDAD_MIN) {
    throw new AppError(`${fieldName} debe ser mayor o igual a ${LIMITES.CANTIDAD_MIN}`, 400);
  }

  if (num > LIMITES.CANTIDAD_MAX) {
    throw new AppError(`${fieldName} debe ser menor o igual a ${LIMITES.CANTIDAD_MAX}`, 400);
  }

  return num;
};

/**
 * Valida un precio (número decimal positivo)
 * @param {number} precio - Precio a validar
 * @param {boolean} required - Si es obligatorio (default: false)
 * @throws {AppError} Si el precio no es válido
 * @returns {number|null} Precio validado o null
 */
const validatePrecio = (precio, required = false) => {
  if (!required && (precio === undefined || precio === null || precio === '')) {
    return null;
  }

  const num = Number(precio);

  if (isNaN(num)) {
    throw new AppError('El precio debe ser un número', 400);
  }

  if (num < LIMITES.PRECIO_MIN) {
    throw new AppError(`El precio debe ser mayor o igual a ${LIMITES.PRECIO_MIN}`, 400);
  }

  if (num > LIMITES.PRECIO_MAX) {
    throw new AppError(`El precio debe ser menor o igual a ${LIMITES.PRECIO_MAX}`, 400);
  }

  // Redondear a 2 decimales
  return Math.round(num * 100) / 100;
};

/**
 * Valida un ID (número entero positivo)
 * @param {number} id - ID a validar
 * @param {string} fieldName - Nombre del campo (default: 'ID')
 * @throws {AppError} Si el ID no es válido
 * @returns {number} ID validado
 */
const validateId = (id, fieldName = 'ID') => {
  validateRequired(id, fieldName);

  const num = Number(id);

  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    throw new AppError(`${fieldName} debe ser un número entero positivo`, 400);
  }

  return num;
};

// ============================================
// VALIDADORES DE ENUMERACIONES
// ============================================

/**
 * Valida un estado (nuevo, bueno, mantenimiento, alquilado, dañado)
 * @param {string} estado - Estado a validar
 * @param {boolean} required - Si es obligatorio (default: true)
 * @throws {AppError} Si el estado no es válido
 * @returns {string|null} Estado validado o null
 */
const validateEstado = (estado, required = true) => {
  if (!required && !estado) {
    return null;
  }

  if (required) {
    validateRequired(estado, 'Estado');
  }

  if (!ESTADOS_VALIDOS.includes(estado)) {
    throw new AppError(
      `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      400
    );
  }

  return estado;
};

/**
 * Valida un tipo de ubicación (bodega, finca, evento, taller, transito, otro)
 * @param {string} tipo - Tipo a validar
 * @param {boolean} required - Si es obligatorio (default: true)
 * @throws {AppError} Si el tipo no es válido
 * @returns {string|null} Tipo validado o null
 */
const validateTipoUbicacion = (tipo, required = true) => {
  if (!required && !tipo) {
    return null;
  }

  if (required) {
    validateRequired(tipo, 'Tipo de ubicación');
  }

  if (!TIPOS_UBICACION_VALIDOS.includes(tipo)) {
    throw new AppError(
      `Tipo de ubicación inválido. Valores permitidos: ${TIPOS_UBICACION_VALIDOS.join(', ')}`,
      400
    );
  }

  return tipo;
};

/**
 * Valida un tipo de unidad (longitud, peso, volumen, cantidad)
 * @param {string} tipo - Tipo a validar
 * @param {boolean} required - Si es obligatorio (default: false)
 * @throws {AppError} Si el tipo no es válido
 * @returns {string|null} Tipo validado o null
 */
const validateTipoUnidad = (tipo, required = false) => {
  if (!required && !tipo) {
    return null;
  }

  if (required) {
    validateRequired(tipo, 'Tipo de unidad');
  }

  if (!TIPOS_UNIDAD_VALIDOS.includes(tipo)) {
    throw new AppError(
      `Tipo de unidad inválido. Valores permitidos: ${TIPOS_UNIDAD_VALIDOS.join(', ')}`,
      400
    );
  }

  return tipo;
};

/**
 * Valida un valor dentro de una lista de valores permitidos
 * @param {*} value - Valor a validar
 * @param {Array} allowedValues - Valores permitidos
 * @param {string} fieldName - Nombre del campo
 * @throws {AppError} Si el valor no está permitido
 * @returns {*} Valor validado
 */
const validateEnum = (value, allowedValues, fieldName) => {
  validateRequired(value, fieldName);

  if (!allowedValues.includes(value)) {
    throw new AppError(
      `${fieldName} inválido. Valores permitidos: ${allowedValues.join(', ')}`,
      400
    );
  }

  return value;
};

// ============================================
// VALIDADORES BOOLEANOS
// ============================================

/**
 * Valida un valor booleano
 * @param {boolean} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @param {boolean} required - Si es obligatorio (default: false)
 * @throws {AppError} Si el valor no es booleano
 * @returns {boolean|null} Valor validado o null
 */
const validateBoolean = (value, fieldName, required = false) => {
  if (!required && (value === undefined || value === null)) {
    return null;
  }

  if (typeof value !== 'boolean') {
    throw new AppError(`${fieldName} debe ser verdadero o falso`, 400);
  }

  return value;
};

// ============================================
// VALIDADORES DE BÚSQUEDA
// ============================================

/**
 * Valida un término de búsqueda
 * @param {string} termino - Término a validar
 * @throws {AppError} Si el término no es válido
 * @returns {string} Término validado y trimmed
 */
const validateTerminoBusqueda = (termino) => {
  validateRequired(termino, 'Término de búsqueda');

  if (typeof termino !== 'string') {
    throw new AppError('Término de búsqueda debe ser una cadena de texto', 400);
  }

  const trimmed = termino.trim();

  if (trimmed.length < LIMITES.BUSQUEDA_MIN) {
    throw new AppError(MENSAJES_ERROR.BUSQUEDA_CORTA, 400);
  }

  if (trimmed.length > LIMITES.BUSQUEDA_MAX) {
    throw new AppError(MENSAJES_ERROR.BUSQUEDA_LARGA, 400);
  }

  return trimmed;
};

// ============================================
// VALIDADORES DE PAGINACIÓN
// ============================================

/**
 * Valida parámetros de paginación
 * @param {Object} query - Query params del request
 * @returns {Object} { page, limit, offset }
 */
const validatePaginacion = (query) => {
  let page = parseInt(query.page) || LIMITES.PAGE_DEFAULT;
  let limit = parseInt(query.limit) || LIMITES.LIMIT_DEFAULT;

  // Validar page
  if (page < 1) page = 1;

  // Validar limit
  if (limit < LIMITES.LIMIT_MIN) limit = LIMITES.LIMIT_MIN;
  if (limit > LIMITES.LIMIT_MAX) limit = LIMITES.LIMIT_MAX;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  // Básicos
  validateRequired,
  validateNombre,
  validateEmoji,
  validateDescripcion,

  // Numéricos
  validateCantidad,
  validatePrecio,
  validateId,

  // Enumeraciones
  validateEstado,
  validateTipoUbicacion,
  validateTipoUnidad,
  validateEnum,

  // Booleanos
  validateBoolean,

  // Búsqueda
  validateTerminoBusqueda,

  // Paginación
  validatePaginacion
};
