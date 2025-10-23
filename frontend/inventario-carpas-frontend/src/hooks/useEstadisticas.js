// frontend/src/hooks/useEstadisticas.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar estadísticas del dashboard
 * @param {boolean} autoFetch - Si debe cargar automáticamente al montar
 */
export const useEstadisticas = (autoFetch = true) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener estadísticas
   */
  const fetchEstadisticas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getEstadisticas();
      setEstadisticas(data);
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
   * Recargar estadísticas
   */
  const refresh = useCallback(() => {
    return fetchEstadisticas();
  }, [fetchEstadisticas]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchEstadisticas();
    }
  }, [autoFetch, fetchEstadisticas]);

  return {
    // Estado
    estadisticas,
    loading,
    error,
    
    // Métodos
    fetchEstadisticas,
    clearError,
    refresh,
  };
};