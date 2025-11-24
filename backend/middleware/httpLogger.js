/**
 * MIDDLEWARE DE LOGGING HTTP
 *
 * Registra todas las peticiones HTTP con tiempo de respuesta
 */

const logger = require('../utils/logger');

/**
 * Middleware que registra todas las peticiones HTTP
 */
const httpLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // Datos adicionales
    const data = {
      ip,
      userAgent: req.get('user-agent'),
      ...(req.body && Object.keys(req.body).length > 0 && {
        bodySize: JSON.stringify(req.body).length
      })
    };

    logger.http(method, originalUrl, statusCode, responseTime, data);
  });

  next();
};

module.exports = httpLogger;
