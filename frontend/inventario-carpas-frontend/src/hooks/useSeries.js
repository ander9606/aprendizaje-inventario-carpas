// frontend/src/hooks/useSeries.js
import { useState, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar operaciones de series
 */
export const useSeries = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener series disponibles (sin asignar)
   */
  const fetchSeriesDisponibles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSeriesDisponibles();
      setSeries(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener series por elemento
   */
  const fetchSeriesByElemento = useCallback(async (elementoId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSeriesByElemento(elementoId);
      setSeries(data);
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

  return {
    // Estado
    series,
    loading,
    error,
    
    // Métodos
    fetchSeriesDisponibles,
    fetchSeriesByElemento,
    clearError,
  };
};