/**
 * HELPER DE PAGINACIÓN
 *
 * Funciones para manejar paginación de manera consistente en toda la API
 */

const { PAGINACION } = require('../config/constants');

/**
 * Calcula los parámetros de paginación desde el query string
 *
 * @param {Object} query - req.query del request
 * @returns {Object} { page, limit, offset }
 *
 * @example
 * const { page, limit, offset } = getPaginationParams(req.query);
 * // page: 2, limit: 20, offset: 20
 */
const getPaginationParams = (query = {}) => {
  let page = parseInt(query.page) || PAGINACION.DEFAULT_PAGE;
  let limit = parseInt(query.limit) || PAGINACION.DEFAULT_LIMIT;

  // Validar que page sea >= 1
  if (page < 1) page = 1;

  // Validar que limit esté dentro del rango permitido
  if (limit < 1) limit = PAGINACION.DEFAULT_LIMIT;
  if (limit > PAGINACION.MAX_LIMIT) limit = PAGINACION.MAX_LIMIT;

  // Calcular offset
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Genera metadata de paginación para la respuesta
 *
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @param {number} total - Total de elementos
 * @returns {Object} Metadata de paginación
 *
 * @example
 * const pagination = getPaginationMeta(2, 20, 150);
 * // {
 * //   page: 2,
 * //   limit: 20,
 * //   total: 150,
 * //   totalPages: 8,
 * //   hasNextPage: true,
 * //   hasPreviousPage: true,
 * //   nextPage: 3,
 * //   previousPage: 1
 * // }
 */
const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null
  };
};

/**
 * Genera una respuesta paginada consistente
 *
 * @param {Array} data - Datos a retornar
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @param {number} total - Total de elementos
 * @param {Object} additionalData - Datos adicionales (opcional)
 * @returns {Object} Respuesta formateada
 *
 * @example
 * const response = getPaginatedResponse(categorias, 1, 20, 45);
 * res.json(response);
 */
const getPaginatedResponse = (data, page, limit, total, additionalData = {}) => {
  return {
    success: true,
    data,
    pagination: getPaginationMeta(page, limit, total),
    ...additionalData
  };
};

/**
 * Genera SQL LIMIT y OFFSET para queries
 *
 * @param {number} limit - Elementos por página
 * @param {number} offset - Offset
 * @returns {string} SQL snippet
 *
 * @example
 * const limitSQL = getSQLLimit(20, 40);
 * // "LIMIT 20 OFFSET 40"
 */
const getSQLLimit = (limit, offset) => {
  return `LIMIT ${limit} OFFSET ${offset}`;
};

/**
 * Valida si se debe aplicar paginación
 * Permite desactivar paginación con ?paginate=false
 *
 * @param {Object} query - req.query
 * @returns {boolean} Si se debe paginar
 *
 * @example
 * if (shouldPaginate(req.query)) {
 *   // Aplicar paginación
 * }
 */
const shouldPaginate = (query = {}) => {
  // Si explícitamente se pide no paginar
  if (query.paginate === 'false' || query.paginate === '0') {
    return false;
  }

  // Por defecto, sí paginar
  return true;
};

/**
 * Obtiene parámetros de ordenamiento del query string
 *
 * @param {Object} query - req.query
 * @param {string} defaultSort - Campo por defecto (default: 'id')
 * @param {string} defaultOrder - Orden por defecto (default: 'ASC')
 * @returns {Object} { sortBy, order, orderSQL }
 *
 * @example
 * const { sortBy, order, orderSQL } = getSortParams(req.query, 'nombre');
 * // sortBy: 'nombre', order: 'ASC', orderSQL: 'nombre ASC'
 */
const getSortParams = (query = {}, defaultSort = 'id', defaultOrder = 'ASC') => {
  const sortBy = query.sortBy || query.sort || defaultSort;
  let order = (query.order || defaultOrder).toUpperCase();

  // Validar que order sea ASC o DESC
  if (order !== 'ASC' && order !== 'DESC') {
    order = defaultOrder;
  }

  // Sanitizar sortBy para prevenir SQL injection
  const sanitizedSortBy = sortBy.replace(/[^a-zA-Z0-9_\.]/g, '');

  return {
    sortBy: sanitizedSortBy,
    order,
    orderSQL: `${sanitizedSortBy} ${order}`
  };
};

/**
 * Helper para búsquedas con paginación
 * Combina búsqueda y paginación
 *
 * @param {Object} options - Opciones
 * @param {Object} options.query - req.query
 * @param {string} options.defaultSort - Campo de ordenamiento por defecto
 * @param {string} options.searchField - Campo de búsqueda (opcional)
 * @returns {Object} Parámetros combinados
 *
 * @example
 * const params = getSearchPaginationParams({
 *   query: req.query,
 *   defaultSort: 'nombre',
 *   searchField: 'nombre'
 * });
 */
const getSearchPaginationParams = ({ query = {}, defaultSort = 'id', searchField = null }) => {
  const pagination = getPaginationParams(query);
  const sort = getSortParams(query, defaultSort);
  const search = query.search || query.q || null;

  return {
    ...pagination,
    ...sort,
    search,
    searchField
  };
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  getPaginationParams,
  getPaginationMeta,
  getPaginatedResponse,
  getSQLLimit,
  shouldPaginate,
  getSortParams,
  getSearchPaginationParams
};
