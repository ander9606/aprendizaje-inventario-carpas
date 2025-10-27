// frontend/src/services/api.js
// VERSIÓN FINAL - Optimizada para respuestas en formato objeto

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

  /**
   * Extraer array de respuesta del servidor
   * Maneja tanto arrays directos como objetos con arrays
   * @param {*} response - Respuesta del servidor
   * @param {string} key - Clave esperada del array en el objeto
   * @returns {Array}
   */
  extractArray(response, key) {
    // Si es array directo, devolverlo
    if (Array.isArray(response)) {
      console.log(`✅ Respuesta directa es array (${response.length} items)`);
      return response;
    }

    // Si es objeto con la clave específica
    if (response && typeof response === 'object') {
      if (response[key] && Array.isArray(response[key])) {
        console.log(`✅ Array encontrado en response.${key} (${response[key].length} items)`);
        return response[key];
      }

      // Intentar claves alternativas comunes
      const alternativeKeys = ['data', 'items', 'results', 'rows'];
      for (const altKey of alternativeKeys) {
        if (response[altKey] && Array.isArray(response[altKey])) {
          console.log(`✅ Array encontrado en response.${altKey} (${response[altKey].length} items)`);
          return response[altKey];
        }
      }

      console.warn(`⚠️ No se encontró array en response.${key}`);
    }

    console.warn('⚠️ Respuesta no válida, devolviendo array vacío');
    return [];
  }

  /**
   * Extraer metadatos adicionales de la respuesta
   * Útil para paginación, estadísticas, etc.
   */
  extractMetadata(response, excludeKey) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      return null;
    }

    const metadata = { ...response };
    delete metadata[excludeKey];
    
    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  // ============================================
  // ELEMENTOS
  // ============================================
  
  /**
   * Obtener todos los elementos
   * @param {boolean} conSeries - Si debe incluir series relacionadas
   * @returns {Promise<Array>}
   */
  async getElementos(conSeries = false) {
    const response = await this.request(`/elementos?conSeries=${conSeries}`, {
      method: 'GET',
    });
    
    // Guardar metadatos si existen
    this.lastElementosMetadata = this.extractMetadata(response, 'elementos');
    
    return this.extractArray(response, 'elementos');
  }

  /**
   * Obtener un elemento por ID
   */
  async getElementoById(id) {
    const response = await this.request(`/elementos/${id}`, {
      method: 'GET',
    });
    
    // Si viene como objeto {elemento: {...}}, extraer
    if (response.elemento) {
      return response.elemento;
    }
    
    return response;
  }

  /**
   * Obtener elementos por categoría
   */
  async getElementosByCategoria(categoriaId) {
    const response = await this.request(`/elementos/categoria/${categoriaId}`, {
      method: 'GET',
    });
    return this.extractArray(response, 'elementos');
  }

  /**
   * Obtener elementos que requieren series
   */
  async getElementosConSeries() {
    const response = await this.request('/elementos/con-series', {
      method: 'GET',
    });
    return this.extractArray(response, 'elementos');
  }

  /**
   * Obtener elementos sin series (stock general)
   */
  async getElementosSinSeries() {
    const response = await this.request('/elementos/sin-series', {
      method: 'GET',
    });
    return this.extractArray(response, 'elementos');
  }

  /**
   * Buscar elementos por nombre
   */
  async buscarElementos(termino) {
    const response = await this.request(`/elementos/buscar?q=${encodeURIComponent(termino)}`, {
      method: 'GET',
    });
    return this.extractArray(response, 'elementos');
  }

  /**
   * Crear nuevo elemento
   */
  async createElemento(data) {
    const response = await this.request('/elementos', {
      method: 'POST',
      data: data,
    });
    
    // Si viene como {elemento: {...}}, extraer
    return response.elemento || response;
  }

  /**
   * Actualizar elemento existente
   */
  async updateElemento(id, data) {
    const response = await this.request(`/elementos/${id}`, {
      method: 'PUT',
      data: data,
    });
    
    // Si viene como {elemento: {...}}, extraer
    return response.elemento || response;
  }

  /**
   * Eliminar elemento
   */
  async deleteElemento(id) {
    const response = await this.request(`/elementos/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // ============================================
  // SERIES
  // ============================================
  
  async getSeriesDisponibles() {
    const response = await this.request('/series/disponibles', {
      method: 'GET',
    });
    return this.extractArray(response, 'series');
  }

  async getSeriesByElemento(elementoId) {
    const response = await this.request(`/series/elemento/${elementoId}`, {
      method: 'GET',
    });
    return this.extractArray(response, 'series');
  }

  async createSerie(data) {
    const response = await this.request('/series', {
      method: 'POST',
      data: data,
    });
    return response.serie || response;
  }

  async updateSerie(id, data) {
    const response = await this.request(`/series/${id}`, {
      method: 'PUT',
      data: data,
    });
    return response.serie || response;
  }

  async deleteSerie(id) {
    const response = await this.request(`/series/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // ============================================
  // LOTES
  // ============================================
  
  async getLotesResumen() {
    const response = await this.request('/lotes/resumen', {
      method: 'GET',
    });
    return this.extractArray(response, 'lotes');
  }

  async createMovimientoLote(data) {
    const response = await this.request('/lotes/movimiento', {
      method: 'POST',
      data: data,
    });
    return response.lote || response;
  }

  // ============================================
  // CATEGORÍAS
  // ============================================
  
  async getCategorias() {
    const response = await this.request('/categorias', {
      method: 'GET',
    });
    return this.extractArray(response, 'categorias');
  }

  async createCategoria(data) {
    const response = await this.request('/categorias', {
      method: 'POST',
      data: data,
    });
    return response.categoria || response;
  }

  async updateCategoria(id, data) {
    const response = await this.request(`/categorias/${id}`, {
      method: 'PUT',
      data: data,
    });
    return response.categoria || response;
  }

  async deleteCategoria(id) {
    const response = await this.request(`/categorias/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // ============================================
  // MATERIALES
  // ============================================
  
  async getMateriales() {
    const response = await this.request('/materiales', {
      method: 'GET',
    });
    return this.extractArray(response, 'materiales');
  }

  async createMaterial(data) {
    const response = await this.request('/materiales', {
      method: 'POST',
      data: data,
    });
    return response.material || response;
  }

  async updateMaterial(id, data) {
    const response = await this.request(`/materiales/${id}`, {
      method: 'PUT',
      data: data,
    });
    return response.material || response;
  }

  async deleteMaterial(id) {
    const response = await this.request(`/materiales/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // ============================================
  // UNIDADES
  // ============================================
  
  async getUnidades() {
    const response = await this.request('/unidades', {
      method: 'GET',
    });
    return this.extractArray(response, 'unidades');
  }

  async createUnidad(data) {
    const response = await this.request('/unidades', {
      method: 'POST',
      data: data,
    });
    return response.unidad || response;
  }

  async updateUnidad(id, data) {
    const response = await this.request(`/unidades/${id}`, {
      method: 'PUT',
      data: data,
    });
    return response.unidad || response;
  }

  async deleteUnidad(id) {
    const response = await this.request(`/unidades/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // ============================================
  // DASHBOARD / ESTADÍSTICAS
  // ============================================
  
  async getEstadisticas() {
    const response = await this.request('/estadisticas', {
      method: 'GET',
    });
    
    // Las estadísticas pueden venir como objeto directo
    return response;
  }

  async getEstadisticasPorCategoria() {
    const response = await this.request('/estadisticas/categorias', {
      method: 'GET',
    });
    return this.extractArray(response, 'categorias');
  }

  async getEstadisticasMovimientos(fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('inicio', fechaInicio);
    if (fechaFin) params.append('fin', fechaFin);
    
    const response = await this.request(`/estadisticas/movimientos?${params.toString()}`, {
      method: 'GET',
    });
    return this.extractArray(response, 'movimientos');
  }

  /**
   * Obtener metadatos de la última petición
   * Útil para paginación, estadísticas, etc.
   */
  getLastMetadata() {
    return this.lastElementosMetadata;
  }
}

export default new ApiService();