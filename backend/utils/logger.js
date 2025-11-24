/**
 * SISTEMA DE LOGGING ESTRUCTURADO
 *
 * Proporciona logging consistente en toda la aplicación
 * con niveles, contexto y almacenamiento en archivos
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');

// Crear directorio de logs si no existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ============================================
// NIVELES DE LOG
// ============================================

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Colores para consola (solo en desarrollo)
const COLORS = {
  ERROR: '\x1b[31m', // Rojo
  WARN: '\x1b[33m',  // Amarillo
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'
};

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Formatea un timestamp en formato ISO
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Formatea un objeto de log como JSON
 */
const formatLogEntry = (level, context, message, data = {}) => {
  const entry = {
    timestamp: getTimestamp(),
    level,
    context,
    message,
    ...data
  };

  return JSON.stringify(entry);
};

/**
 * Formatea un mensaje para consola (más legible)
 */
const formatConsoleMessage = (level, context, message, data = {}) => {
  const color = COLORS[level] || COLORS.RESET;
  const timestamp = new Date().toLocaleTimeString('es-ES');

  let msg = `${color}[${timestamp}] [${level}] [${context}]${COLORS.RESET} ${message}`;

  if (Object.keys(data).length > 0) {
    msg += `\n${JSON.stringify(data, null, 2)}`;
  }

  return msg;
};

/**
 * Escribe un log en archivo
 */
const writeToFile = (filePath, content) => {
  try {
    fs.appendFileSync(filePath, content + '\n', 'utf8');
  } catch (error) {
    console.error('Error al escribir en log file:', error);
  }
};

/**
 * Limpia logs antiguos (mantiene últimos 7 días)
 */
const cleanOldLogs = () => {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Log antiguo eliminado: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error);
  }
};

// ============================================
// FUNCIÓN PRINCIPAL DE LOG
// ============================================

/**
 * Función interna de log
 */
const log = (level, context, message, data = {}) => {
  const logEntry = formatLogEntry(level, context, message, data);
  const consoleMessage = formatConsoleMessage(level, context, message, data);

  // Escribir en consola
  if (level === LOG_LEVELS.ERROR) {
    console.error(consoleMessage);
  } else if (level === LOG_LEVELS.WARN) {
    console.warn(consoleMessage);
  } else {
    console.log(consoleMessage);
  }

  // Escribir en archivo general
  writeToFile(LOG_FILE, logEntry);

  // Si es error, escribir también en archivo de errores
  if (level === LOG_LEVELS.ERROR) {
    writeToFile(ERROR_LOG_FILE, logEntry);
  }
};

// ============================================
// API PÚBLICA
// ============================================

/**
 * Log de información general
 * @param {string} context - Contexto (ej: 'categoriaController.crear')
 * @param {string} message - Mensaje descriptivo
 * @param {Object} data - Datos adicionales (opcional)
 */
const info = (context, message, data = {}) => {
  log(LOG_LEVELS.INFO, context, message, data);
};

/**
 * Log de advertencias
 * @param {string} context - Contexto
 * @param {string} message - Mensaje descriptivo
 * @param {Object} data - Datos adicionales (opcional)
 */
const warn = (context, message, data = {}) => {
  log(LOG_LEVELS.WARN, context, message, data);
};

/**
 * Log de errores
 * @param {string} context - Contexto
 * @param {string|Error} error - Error o mensaje de error
 * @param {Object} data - Datos adicionales (opcional)
 */
const error = (context, errorObj, data = {}) => {
  const message = errorObj instanceof Error ? errorObj.message : errorObj;
  const errorData = {
    ...data,
    ...(errorObj instanceof Error && {
      stack: errorObj.stack,
      name: errorObj.name
    })
  };

  log(LOG_LEVELS.ERROR, context, message, errorData);
};

/**
 * Log de debug (solo en desarrollo)
 * @param {string} context - Contexto
 * @param {string} message - Mensaje descriptivo
 * @param {Object} data - Datos adicionales (opcional)
 */
const debug = (context, message, data = {}) => {
  if (process.env.NODE_ENV === 'development') {
    log(LOG_LEVELS.DEBUG, context, message, data);
  }
};

/**
 * Log de operación HTTP
 * Útil para registrar peticiones HTTP
 */
const http = (method, url, statusCode, responseTime, data = {}) => {
  const level = statusCode >= 500 ? LOG_LEVELS.ERROR :
                statusCode >= 400 ? LOG_LEVELS.WARN :
                LOG_LEVELS.INFO;

  log(level, 'HTTP', `${method} ${url} ${statusCode}`, {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    ...data
  });
};

/**
 * Log de operación de base de datos
 */
const database = (operation, table, data = {}) => {
  log(LOG_LEVELS.DEBUG, 'DATABASE', `${operation} on ${table}`, data);
};

/**
 * Obtiene estadísticas de logs
 */
const getStats = () => {
  try {
    const appLogStats = fs.statSync(LOG_FILE);
    const errorLogStats = fs.existsSync(ERROR_LOG_FILE)
      ? fs.statSync(ERROR_LOG_FILE)
      : null;

    return {
      appLog: {
        path: LOG_FILE,
        size: `${(appLogStats.size / 1024).toFixed(2)} KB`,
        lastModified: appLogStats.mtime
      },
      errorLog: errorLogStats ? {
        path: ERROR_LOG_FILE,
        size: `${(errorLogStats.size / 1024).toFixed(2)} KB`,
        lastModified: errorLogStats.mtime
      } : null
    };
  } catch (err) {
    return { error: 'No se pudieron obtener estadísticas' };
  }
};

// Ejecutar limpieza de logs antiguos al iniciar
if (process.env.NODE_ENV === 'production') {
  cleanOldLogs();
}

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  info,
  warn,
  error,
  debug,
  http,
  database,
  getStats,
  LOG_LEVELS
};
