const AppError = require('../utils/AppError');

/**
 * Middleware para validar que un parámetro de ruta sea un ID válido (número entero positivo)
 * @param {string} paramName - Nombre del parámetro a validar (default: 'id')
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    // Verificar que existe
    if (!id) {
      return next(new AppError(`${paramName} es requerido`, 400));
    }

    // Verificar que sea un número
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return next(new AppError(`${paramName} debe ser un número`, 400));
    }

    // Verificar que sea entero positivo
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return next(new AppError(`${paramName} debe ser un número entero positivo`, 400));
    }

    // Convertir a número en el request para uso posterior
    req.params[paramName] = numericId;

    next();
  };
};

/**
 * Middleware para validar múltiples IDs en los parámetros
 * @param {Array<string>} paramNames - Array de nombres de parámetros a validar
 */
const validateIds = (paramNames = ['id']) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];

      if (!id) {
        return next(new AppError(`${paramName} es requerido`, 400));
      }

      const numericId = Number(id);
      if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
        return next(new AppError(`${paramName} debe ser un número entero positivo`, 400));
      }

      req.params[paramName] = numericId;
    }

    next();
  };
};

/**
 * Valida que un campo del body sea requerido y no esté vacío
 */
const required = (fieldName, customMessage) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null || value === '') {
      const message = customMessage || `${fieldName} es requerido`;
      return next(new AppError(message, 400));
    }

    // Si es string, validar que no sea solo espacios
    if (typeof value === 'string' && value.trim() === '') {
      const message = customMessage || `${fieldName} no puede estar vacío`;
      return next(new AppError(message, 400));
    }

    next();
  };
};

/**
 * Valida que un campo del body tenga una longitud mínima y máxima
 */
const stringLength = (fieldName, min, max) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      return next(); // Si no existe, lo deja pasar (usar required antes si es obligatorio)
    }

    if (typeof value !== 'string') {
      return next(new AppError(`${fieldName} debe ser una cadena de texto`, 400));
    }

    const trimmed = value.trim();

    if (min !== undefined && trimmed.length < min) {
      return next(new AppError(`${fieldName} debe tener al menos ${min} caracteres`, 400));
    }

    if (max !== undefined && trimmed.length > max) {
      return next(new AppError(`${fieldName} debe tener máximo ${max} caracteres`, 400));
    }

    next();
  };
};

/**
 * Valida que un campo del body sea un número en un rango específico
 */
const numberInRange = (fieldName, min, max) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      return next();
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
      return next(new AppError(`${fieldName} debe ser un número`, 400));
    }

    if (min !== undefined && numValue < min) {
      return next(new AppError(`${fieldName} debe ser mayor o igual a ${min}`, 400));
    }

    if (max !== undefined && numValue > max) {
      return next(new AppError(`${fieldName} debe ser menor o igual a ${max}`, 400));
    }

    next();
  };
};

/**
 * Valida que un campo esté dentro de un conjunto de valores válidos
 */
const oneOf = (fieldName, validValues) => {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      return next();
    }

    if (!validValues.includes(value)) {
      return next(new AppError(
        `${fieldName} debe ser uno de: ${validValues.join(', ')}`,
        400
      ));
    }

    next();
  };
};

module.exports = {
  validateId,
  validateIds,
  required,
  stringLength,
  numberInRange,
  oneOf
};
