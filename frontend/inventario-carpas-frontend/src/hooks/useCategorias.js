// frontend/src/hooks/useCategorias.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar categorías
 * @param {boolean} autoFetch - Si debe cargar automáticamente al montar
 */
export const useCategorias = (autoFetch = true) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener todas las categorías
   */
  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCategorias();
      setCategorias(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Recargar categorías
   */
  const refresh = useCallback(() => {
    return fetchCategorias();
  }, [fetchCategorias]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchCategorias();
    }
  }, [autoFetch, fetchCategorias]);

  return {
    // Estado
    categorias,
    loading,
    error,
    
    // Métodos
    fetchCategorias,
    clearError,
    refresh,
  };
};