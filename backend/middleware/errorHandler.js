const AppError = require('../utils/AppError');

/**
 * Maneja errores de MySQL duplicados (código 1062)
 */
const handleDuplicateKeyError = (err) => {
  const field = err.message.match(/key '(.+?)'/)?.[1] || 'campo';
  const message = `Ya existe un registro con ese ${field}`;
  return new AppError(message, 409);
};

/**
 * Maneja errores de validación de MySQL
 */
const handleValidationError = (err) => {
  const message = `Error de validación: ${err.message}`;
  return new AppError(message, 400);
};

/**
 * Maneja errores de foreign key de MySQL (código 1452)
 */
const handleForeignKeyError = (err) => {
  const message = 'El registro referenciado no existe';
  return new AppError(message, 400);
};

/**
 * Envía error en modo desarrollo (con stack trace completo)
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * Envía error en modo producción (sin información sensible)
 */
const sendErrorProd = (err, res) => {
  // Error operacional, confiable: enviar mensaje al cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  }
  // Error de programación u otro error desconocido: no filtrar detalles
  else {
    // 1) Log del error
    console.error('ERROR 💥', err);

    // 2) Enviar mensaje genérico
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Algo salió mal en el servidor'
    });
  }
};

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en server.js
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Manejo de errores específicos de MySQL
    if (err.code === 'ER_DUP_ENTRY') {
      error = handleDuplicateKeyError(err);
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      error = handleForeignKeyError(err);
    }
    if (err.code === 'ER_DATA_TOO_LONG') {
      error = handleValidationError(err);
    }

    sendErrorProd(error, res);
  }
};

/**
 * Middleware para capturar rutas no encontradas
 */
const notFound = (req, res, next) => {
  const err = new AppError(`No se encontró la ruta ${req.originalUrl}`, 404);
  next(err);
};

module.exports = {
  errorHandler,
  notFound
};
