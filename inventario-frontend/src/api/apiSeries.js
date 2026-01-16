// ============================================
// API: SERIES
// Gestión de números de serie individuales
// ============================================

import api from './Axios.config'

/**
 * ¿QUÉ ES UNA SERIE?
 * 
 * Una serie es una unidad individual con número único
 * dentro de un elemento que requiere tracking individual.
 * 
 * Ejemplo:
 * Elemento: "Carpa Doite 3x3"
 * Series:
 * - DOITE-001 → Estado: disponible, Ubicación: Bodega A
 * - DOITE-002 → Estado: alquilado, Ubicación: Evento X
 * - DOITE-003 → Estado: mantenimiento, Ubicación: Taller
 */

const seriesAPI = {
  // ============================================
  // OBTENER SERIES
  // ============================================
  
  /**
   * Obtener todas las series de un elemento
   * 
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Array de series
   * 
   * @example
   * const series = await seriesAPI.obtenerPorElemento(1)
   * 
   * Respuesta:
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: 1,
   *       id_elemento: 1,
   *       numero_serie: "DOITE-001",
   *       estado: "disponible",
   *       ubicacion: "Bodega A",
   *       fecha_ingreso: "2024-01-15",
   *       created_at: "2024-01-15T10:00:00Z"
   *     },
   *     // ...más series
   *   ],
   *   elemento: {
   *     id: 1,
   *     nombre: "Carpa Doite 3x3"
   *   }
   * }
   */
  obtenerPorElemento: async (elementoId) => {
    const response = await api.get(`/series/elemento/${elementoId}`)
    return response.data
  },

  /**
   * Obtener una serie específica por ID
   * 
   * @param {number} serieId - ID de la serie
   * @returns {Promise} - Datos de la serie
   */
  obtenerPorId: async (serieId) => {
    const response = await api.get(`/series/${serieId}`)
    return response.data
  },

  /**
   * Buscar serie por número
   * 
   * @param {string} numeroSerie - Número de serie a buscar
   * @returns {Promise} - Serie encontrada
   * 
   * @example
   * const serie = await seriesAPI.buscarPorNumero("DOITE-001")
   */
  buscarPorNumero: async (numeroSerie) => {
    const response = await api.get(`/series/buscar/${numeroSerie}`)
    return response.data
  },

  // ============================================
  // CREAR SERIE
  // ============================================
  
  /**
   * Agregar una nueva serie a un elemento
   * 
   * @param {Object} data - Datos de la serie
   * @returns {Promise} - Serie creada
   * 
   * @example
   * await seriesAPI.crear({
   *   id_elemento: 1,
   *   numero_serie: "DOITE-001",
   *   estado: "disponible",          // disponible, alquilado, mantenimiento, dañado
   *   ubicacion: "Bodega A",
   *   fecha_ingreso: "2024-01-15"
   * })
   * 
   * VALIDACIONES DEL BACKEND:
   * - numero_serie debe ser único
   * - El elemento debe tener requiere_series = TRUE
   * - Incrementa automáticamente la cantidad del elemento
   */
  crear: async (data) => {
    const response = await api.post('/series', data)
    return response.data
  },

  /**
   * Crear múltiples series a la vez
   * 
   * @param {Object} data - Datos para creación masiva
   * @returns {Promise} - Series creadas
   * 
   * @example
   * await seriesAPI.crearMultiples({
   *   id_elemento: 1,
   *   cantidad: 5,                    // Crear 5 series
   *   prefijo: "DOITE",               // Prefijo: DOITE-001, DOITE-002, etc.
   *   inicio: 1,                      // Comenzar en 001
   *   estado: "disponible",
   *   ubicacion: "Bodega A",
   *   fecha_ingreso: "2024-01-15"
   * })
   * 
   * Backend genera automáticamente los números:
   * - DOITE-001
   * - DOITE-002
   * - DOITE-003
   * - DOITE-004
   * - DOITE-005
   */
  crearMultiples: async (data) => {
    const response = await api.post('/series/multiples', data)
    return response.data
  },

  // ============================================
  // ACTUALIZAR SERIE
  // ============================================
  
  /**
   * Actualizar una serie (cambiar estado, ubicación)
   * 
   * @param {number} id - ID de la serie
   * @param {Object} data - Datos a actualizar
   * @returns {Promise} - Serie actualizada
   * 
   * @example
   * // Cambiar estado a "alquilado"
   * await seriesAPI.actualizar(1, {
   *   estado: "alquilado",
   *   ubicacion: null  // Se quita la ubicación al alquilar
   * })
   * 
   * // Devolver y poner en mantenimiento
   * await seriesAPI.actualizar(1, {
   *   estado: "mantenimiento",
   *   ubicacion: "Taller"
   * })
   * 
   * // Reparada y disponible
   * await seriesAPI.actualizar(1, {
   *   estado: "disponible",
   *   ubicacion: "Bodega A"
   * })
   */
  actualizar: async (id, data) => {
    const response = await api.put(`/series/${id}`, data)
    return response.data
  },

  /**
   * Cambiar estado de una serie (shortcut)
   * 
   * @param {number} id - ID de la serie
   * @param {string} nuevoEstado - Nuevo estado
   * @param {string} ubicacion - Nueva ubicación (opcional)
   * @returns {Promise} - Serie actualizada
   * 
   * @example
   * // Alquilar serie
   * await seriesAPI.cambiarEstado(1, "alquilado", null)
   * 
   * // Devolver a bodega
   * await seriesAPI.cambiarEstado(1, "disponible", "Bodega A")
   * 
   * // Enviar a mantenimiento
   * await seriesAPI.cambiarEstado(1, "mantenimiento", "Taller")
   */
  cambiarEstado: async (id, nuevoEstado, ubicacion = null) => {
    const response = await api.patch(`/series/${id}/estado`, {
      estado: nuevoEstado,
      ubicacion
    })
    return response.data
  },

  // ============================================
  // ELIMINAR SERIE
  // ============================================
  
  /**
   * Eliminar una serie
   * 
   * @param {number} id - ID de la serie
   * @returns {Promise} - Confirmación
   * 
   * VALIDACIÓN DEL BACKEND:
   * - No se puede eliminar si está alquilada
   * - Decrementa automáticamente la cantidad del elemento
   * 
   * @example
   * await seriesAPI.eliminar(1)
   */
  eliminar: async (id) => {
    const response = await api.delete(`/series/${id}`)
    return response.data
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  
  /**
   * Obtener estadísticas por estado de un elemento
   * 
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Conteo por estado
   * 
   * @example
   * const stats = await seriesAPI.obtenerEstadisticas(1)
   * 
   * {
   *   success: true,
   *   data: {
   *     total: 10,
   *     disponible: 7,
   *     alquilado: 2,
   *     mantenimiento: 1,
   *     dañado: 0,
   *     nuevo: 0
   *   }
   * }
   */
  obtenerEstadisticas: async (elementoId) => {
    const response = await api.get(`/series/elemento/${elementoId}/estadisticas`)
    return response.data
  },

  /**
   * Obtener series por estado
   *
   * @param {number} elementoId - ID del elemento
   * @param {string} estado - Estado a filtrar
   * @returns {Promise} - Series filtradas
   *
   * @example
   * // Obtener solo series disponibles
   * const disponibles = await seriesAPI.obtenerPorEstado(1, "disponible")
   *
   * // Obtener series alquiladas
   * const alquiladas = await seriesAPI.obtenerPorEstado(1, "alquilado")
   */
  obtenerPorEstado: async (elementoId, estado) => {
    const response = await api.get(`/series/elemento/${elementoId}/estado/${estado}`)
    return response.data
  },

  // ============================================
  // CONTEXTO DE ALQUILER ✨ NUEVO
  // ============================================

  /**
   * Obtener series con contexto de alquiler
   *
   * Incluye información del evento actual (si está alquilada)
   * y próximo evento (si tiene reserva futura)
   *
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Series con contexto de eventos
   *
   * @example
   * const resultado = await seriesAPI.obtenerPorElementoConContexto(1)
   *
   * {
   *   success: true,
   *   elemento: { id: 1, nombre: "Carpa 10x10" },
   *   resumen: {
   *     total: 5,
   *     disponibles: 2,
   *     en_evento: 2,
   *     reservadas: 1,
   *     mantenimiento: 0
   *   },
   *   data: [
   *     {
   *       id: 1,
   *       numero_serie: "CARPA-001",
   *       estado: "alquilado",
   *       ubicacion: "Hacienda Los Robles",
   *       en_alquiler: true,
   *       evento_actual: {
   *         alquiler_id: 5,
   *         nombre: "Boda Martínez",
   *         fecha_inicio: "2024-01-20",
   *         fecha_fin: "2024-01-22",
   *         ubicacion: "Hacienda Los Robles",
   *         cliente: "Familia Martínez"
   *       },
   *       proximo_evento: null
   *     },
   *     {
   *       id: 2,
   *       numero_serie: "CARPA-002",
   *       estado: "bueno",
   *       ubicacion: "Bodega A",
   *       en_alquiler: false,
   *       evento_actual: null,
   *       proximo_evento: {
   *         alquiler_id: 8,
   *         evento_nombre: "Corp. Nestlé",
   *         fecha_montaje: "2024-01-28"
   *       }
   *     }
   *   ]
   * }
   */
  obtenerPorElementoConContexto: async (elementoId) => {
    const response = await api.get(`/series/elemento/${elementoId}/contexto`)
    return response.data
  },

  /**
   * Obtener serie por ID con contexto completo
   *
   * Incluye evento actual, próximo evento e historial de alquileres
   *
   * @param {number} serieId - ID de la serie
   * @returns {Promise} - Serie con contexto completo
   */
  obtenerPorIdConContexto: async (serieId) => {
    const response = await api.get(`/series/${serieId}/contexto`)
    return response.data
  },
}

export default seriesAPI