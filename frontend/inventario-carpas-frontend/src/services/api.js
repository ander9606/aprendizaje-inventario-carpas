// frontend/src/services/api.js
// VERSIÓN COMPLETA ACTUALIZADA

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores global
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const response = await axiosInstance({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error en la petición';
      throw new Error(message);
    }
  }

  // ============================================
  // ELEMENTOS
  // ============================================
  
  /**
   * Obtener todos los elementos
   * @param {boolean} conSeries - Si debe incluir series relacionadas
   */
  getElementos(conSeries = false) {
    return this.request(`/elementos?conSeries=${conSeries}`, {
      method: 'GET',
    });
  }

  /**
   * Obtener un elemento por ID
   */
  getElementoById(id) {
    return this.request(`/elementos/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Obtener elementos por categoría
   */
  getElementosByCategoria(categoriaId) {
    return this.request(`/elementos/categoria/${categoriaId}`, {
      method: 'GET',
    });
  }

  /**
   * Obtener elementos que requieren series
   */
  getElementosConSeries() {
    return this.request('/elementos/con-series', {
      method: 'GET',
    });
  }

  /**
   * Obtener elementos sin series (stock general)
   */
  getElementosSinSeries() {
    return this.request('/elementos/sin-series', {
      method: 'GET',
    });
  }

  /**
   * Buscar elementos por nombre
   */
  buscarElementos(termino) {
    return this.request(`/elementos/buscar?q=${encodeURIComponent(termino)}`, {
      method: 'GET',
    });
  }

  /**
   * Crear nuevo elemento
   * @param {Object} data - Datos del elemento
   * @param {string} data.nombre - Nombre del elemento
   * @param {string} data.descripcion - Descripción
   * @param {number} data.cantidad - Cantidad inicial
   * @param {boolean} data.requiere_series - Si requiere series
   * @param {number} data.categoria_id - ID de categoría
   * @param {number} data.material_id - ID de material
   * @param {number} data.unidad_id - ID de unidad
   * @param {string} data.estado - Estado (bueno, regular, malo, en_reparacion)
   * @param {string} data.ubicacion - Ubicación física
   * @param {string} data.fecha_ingreso - Fecha de ingreso (YYYY-MM-DD)
   */
  createElemento(data) {
    return this.request('/elementos', {
      method: 'POST',
      data: data,
    });
  }

  /**
   * Actualizar elemento existente
   */
  updateElemento(id, data) {
    return this.request(`/elementos/${id}`, {
      method: 'PUT',
      data: data,
    });
  }

  /**
   * Eliminar elemento
   */
  deleteElemento(id) {
    return this.request(`/elementos/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // SERIES
  // ============================================
  
  /**
   * Obtener series disponibles (sin asignar)
   */
  getSeriesDisponibles() {
    return this.request('/series/disponibles', {
      method: 'GET',
    });
  }

  /**
   * Obtener series por elemento
   */
  getSeriesByElemento(elementoId) {
    return this.request(`/series/elemento/${elementoId}`, {
      method: 'GET',
    });
  }

  /**
   * Crear nueva serie
   */
  createSerie(data) {
    return this.request('/series', {
      method: 'POST',
      data: data,
    });
  }

  /**
   * Actualizar serie
   */
  updateSerie(id, data) {
    return this.request(`/series/${id}`, {
      method: 'PUT',
      data: data,
    });
  }

  /**
   * Eliminar serie
   */
  deleteSerie(id) {
    return this.request(`/series/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // LOTES
  // ============================================
  
  /**
   * Obtener resumen de lotes
   */
  getLotesResumen() {
    return this.request('/lotes/resumen', {
      method: 'GET',
    });
  }

  /**
   * Crear movimiento de lote
   */
  createMovimientoLote(data) {
    return this.request('/lotes/movimiento', {
      method: 'POST',
      data: data,
    });
  }

  // ============================================
  // CATEGORÍAS
  // ============================================
  
  /**
   * Obtener todas las categorías
   */
  getCategorias() {
    return this.request('/categorias', {
      method: 'GET',
    });
  }

  /**
   * Crear nueva categoría
   */
  createCategoria(data) {
    return this.request('/categorias', {
      method: 'POST',
      data: data,
    });
  }

  /**
   * Actualizar categoría
   */
  updateCategoria(id, data) {
    return this.request(`/categorias/${id}`, {
      method: 'PUT',
      data: data,
    });
  }

  /**
   * Eliminar categoría
   */
  deleteCategoria(id) {
    return this.request(`/categorias/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // MATERIALES
  // ============================================
  
  /**
   * Obtener todos los materiales
   */
  getMateriales() {
    return this.request('/materiales', {
      method: 'GET',
    });
  }

  /**
   * Crear nuevo material
   */
  createMaterial(data) {
    return this.request('/materiales', {
      method: 'POST',
      data: data,
    });
  }

  /**
   * Actualizar material
   */
  updateMaterial(id, data) {
    return this.request(`/materiales/${id}`, {
      method: 'PUT',
      data: data,
    });
  }

  /**
   * Eliminar material
   */
  deleteMaterial(id) {
    return this.request(`/materiales/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // UNIDADES
  // ============================================
  
  /**
   * Obtener todas las unidades de medida
   */
  getUnidades() {
    return this.request('/unidades', {
      method: 'GET',
    });
  }

  /**
   * Crear nueva unidad
   */
  createUnidad(data) {
    return this.request('/unidades', {
      method: 'POST',
      data: data,
    });
  }

  /**
   * Actualizar unidad
   */
  updateUnidad(id, data) {
    return this.request(`/unidades/${id}`, {
      method: 'PUT',
      data: data,
    });
  }

  /**
   * Eliminar unidad
   */
  deleteUnidad(id) {
    return this.request(`/unidades/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // DASHBOARD / ESTADÍSTICAS
  // ============================================
  
  /**
   * Obtener estadísticas generales
   */
  getEstadisticas() {
    return this.request('/estadisticas', {
      method: 'GET',
    });
  }

  /**
   * Obtener estadísticas por categoría
   */
  getEstadisticasPorCategoria() {
    return this.request('/estadisticas/categorias', {
      method: 'GET',
    });
  }

  /**
   * Obtener estadísticas de movimientos
   */
  getEstadisticasMovimientos(fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('inicio', fechaInicio);
    if (fechaFin) params.append('fin', fechaFin);
    
    return this.request(`/estadisticas/movimientos?${params.toString()}`, {
      method: 'GET',
    });
  }
}

export default new ApiService();