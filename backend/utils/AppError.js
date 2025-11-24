/**
 * Clase personalizada de errores para la aplicación
 * Extiende Error para incluir información adicional como statusCode
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensaje de error
   * @param {number} statusCode - Código de estado HTTP (default: 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Captura el stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
