// ============================================
// API: ELEMENTOS
// Comunicación con el backend para gestión de elementos
// ============================================

import api from './Axios.config'

/**
 * ¿QUÉ ES UN ELEMENTO?
 * 
 * Un elemento es un tipo de artículo en el inventario.
 * Puede gestionarse de dos formas:
 * 
 * 1. POR SERIE (requiere_series = TRUE):
 *    - Cada unidad tiene número único
 *    - Tracking individual
 *    - Ejemplo: Carpas, Proyectores
 * 
 * 2. POR LOTE (requiere_series = FALSE):
 *    - Gestión por cantidad agrupada
 *    - Tracking por ubicación y estado
 *    - Ejemplo: Sillas, Reatas, Estacas
 */

const elementosAPI = {
  // ============================================
  // OBTENER ELEMENTOS
  // ============================================
  
  /**
   * Obtener todos los elementos de una subcategoría
   * 
   * @param {number} subcategoriaId - ID de la subcategoría
   * @returns {Promise} - Elementos con información de series/lotes
   * 
   * @example
   * const elementos = await elementosAPI.obtenerPorSubcategoria(5)
   * 
   * Respuesta esperada:
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: 1,
   *       nombre: "Carpa Doite 3x3",
   *       descripcion: "Carpa impermeable...",
   *       requiere_series: true,
   *       categoria_id: 5,
   *       total_series: 10,
   *       series_disponibles: 7,
   *       series_alquiladas: 2,
   *       series_mantenimiento: 1
   *     },
   *     {
   *       id: 2,
   *       nombre: "Silla Plástica",
   *       requiere_series: false,
   *       total_cantidad: 150,
   *       cantidad_disponible: 120,
   *       total_lotes: 3
   *     }
   *   ]
   * }
   */
  obtenerPorSubcategoria: async (subcategoriaId) => {
    const response = await api.get(`/elementos/subcategoria/${subcategoriaId}`)
    return response.data
  },

  /**
   * Obtener un elemento específico con detalles completos
   * 
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Elemento con series o lotes incluidos
   * 
   * @example
   * const elemento = await elementosAPI.obtenerPorId(1)
   * 
   * Si requiere_series = TRUE:
   * {
   *   success: true,
   *   data: {
   *     id: 1,
   *     nombre: "Carpa Doite 3x3",
   *     requiere_series: true,
   *     series: [
   *       { id: 1, numero_serie: "DOITE-001", estado: "disponible" },
   *       { id: 2, numero_serie: "DOITE-002", estado: "alquilado" }
   *     ]
   *   }
   * }
   * 
   * Si requiere_series = FALSE:
   * {
   *   success: true,
   *   data: {
   *     id: 2,
   *     nombre: "Silla Plástica",
   *     requiere_series: false,
   *     lotes: [
   *       { id: 1, cantidad: 50, estado: "nuevo", ubicacion: "Bodega A" },
   *       { id: 2, cantidad: 30, estado: "bueno", ubicacion: "Bodega B" }
   *     ]
   *   }
   * }
   */
  obtenerPorId: async (elementoId) => {
    const response = await api.get(`/elementos/${elementoId}`)
    return response.data
  },

  /**
   * Obtener un elemento con contexto de ocupaciones
   * Incluye próximos eventos y disponibilidad por fechas
   *
   * @param {number} elementoId - ID del elemento
   * @param {string} fecha - Fecha de referencia (opcional, default: hoy)
   * @returns {Promise} - Elemento con ocupaciones actuales y futuras
   *
   * @example
   * const elemento = await elementosAPI.obtenerConOcupaciones(1)
   *
   * Respuesta para SERIES:
   * {
   *   ...datosElemento,
   *   ocupaciones: {
   *     series: [...],
   *     resumen: { total, en_alquiler, disponibles_hoy, fecha_consulta },
   *     proximos_eventos: [{ evento_nombre, fecha_montaje, cliente, cantidad }]
   *   }
   * }
   *
   * Respuesta para LOTES:
   * {
   *   ...datosElemento,
   *   ocupaciones: {
   *     estadisticas,
   *     lotes_por_ubicacion: [...],
   *     en_eventos: [{ evento_nombre, cantidad, fecha_montaje, fecha_desmontaje }],
   *     disponibles_hoy: 45,
   *     fecha_consulta: "2024-01-15",
   *     disponibilidad_por_rangos: [
   *       { fecha_inicio, fecha_fin, disponibles, ocupados, eventos }
   *     ]
   *   }
   * }
   */
  obtenerConOcupaciones: async (elementoId, fecha = null) => {
    const params = fecha ? `?fecha=${fecha}` : ''
    const response = await api.get(`/elementos/${elementoId}/ocupaciones${params}`)
    return response.data
  },

  /**
   * Obtener todos los elementos (todas las subcategorías)
   */
  obtenerTodos: async () => {
    const response = await api.get('/elementos')
    return response.data
  },

  // ============================================
  // CREAR ELEMENTO
  // ============================================
  
  /**
   * Crear un nuevo elemento
   * 
   * @param {Object} data - Datos del elemento
   * @returns {Promise} - Elemento creado
   * 
   * @example
   * // Crear elemento POR SERIE:
   * await elementosAPI.crear({
   *   nombre: "Carpa Doite 3x3",
   *   descripcion: "Carpa impermeable...",
   *   requiere_series: true,        // ← Gestión por serie
   *   categoria_id: 5,              // Subcategoría
   *   material_id: 1,
   *   unidad_id: 3
   * })
   * // Backend crea elemento con cantidad = 0
   * // Las series se agregan después
   * 
   * @example
   * // Crear elemento POR LOTE:
   * await elementosAPI.crear({
   *   nombre: "Silla Plástica",
   *   descripcion: "Silla plegable...",
   *   requiere_series: false,       // ← Gestión por lote
   *   categoria_id: 5,
   *   material_id: 4,
   *   unidad_id: 3,
   *   cantidad_inicial: 50,          // ← Requerido para lotes
   *   estado_inicial: "nuevo",       // ← Requerido para lotes
   *   ubicacion_inicial: "Bodega A"  // ← Requerido para lotes
   * })
   * // Backend crea elemento + primer lote automáticamente
   */
  crear: async (data) => {
    const response = await api.post('/elementos', data)
    return response.data
  },

  // ============================================
  // ACTUALIZAR ELEMENTO
  // ============================================
  
  /**
   * Actualizar un elemento existente
   * 
   * @param {number} id - ID del elemento
   * @param {Object} data - Datos a actualizar
   * @returns {Promise} - Elemento actualizado
   * 
   * @example
   * await elementosAPI.actualizar(1, {
   *   nombre: "Carpa Doite 3x3 Premium",
   *   descripcion: "Nueva descripción...",
   *   material_id: 2
   * })
   * 
   * NOTA: NO se puede cambiar requiere_series después de crear
   */
  actualizar: async (id, data) => {
    const response = await api.put(`/elementos/${id}`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR ELEMENTO
  // ============================================
  
  /**
   * Eliminar un elemento
   * 
   * @param {number} id - ID del elemento
   * @returns {Promise} - Confirmación
   * 
   * VALIDACIONES DEL BACKEND:
   * - No se puede eliminar si tiene series activas
   * - No se puede eliminar si tiene lotes con cantidad > 0
   * - Debe estar vacío para eliminar
   * 
   * @example
   * await elementosAPI.eliminar(1)
   */
  eliminar: async (id) => {
    const response = await api.delete(`/elementos/${id}`)
    return response.data
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  
  /**
   * Obtener estadísticas de un elemento
   * 
   * @param {number} elementoId - ID del elemento
   * @returns {Promise} - Estadísticas por estado
   * 
   * @example
   * const stats = await elementosAPI.obtenerEstadisticas(1)
   * 
   * // Si requiere_series = TRUE:
   * {
   *   success: true,
   *   data: {
   *     total: 10,
   *     disponible: 7,
   *     alquilado: 2,
   *     mantenimiento: 1,
   *     dañado: 0
   *   }
   * }
   * 
   * // Si requiere_series = FALSE:
   * {
   *   success: true,
   *   data: {
   *     total: 150,
   *     nuevo: 50,
   *     bueno: 70,
   *     regular: 20,
   *     malo: 10
   *   }
   * }
   */
  obtenerEstadisticas: async (elementoId) => {
    const response = await api.get(`/elementos/${elementoId}/estadisticas`)
    return response.data
  },
}

export default elementosAPI