// frontend/src/hooks/useUnidades.js

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar unidades de medida
 * @param {boolean} autoFetch - Si debe cargar automáticamente al montar
 */
export const useUnidades = (autoFetch = true) => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Obtener todas las unidades
   */
  const fetchUnidades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getUnidades();
      setUnidades(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear una nueva unidad
   */
  const createUnidad = useCallback(async (unidadData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newUnidad = await apiService.createUnidad(unidadData);
      setUnidades(prev => [...prev, newUnidad]);
      setSuccess('Unidad creada exitosamente');
      return newUnidad;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar una unidad existente
   */
  const updateUnidad = useCallback(async (id, unidadData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedUnidad = await apiService.updateUnidad(id, unidadData);
      setUnidades(prev => 
        prev.map(und => und.id === id ? updatedUnidad : und)
      );
      setSuccess('Unidad actualizada exitosamente');
      return updatedUnidad;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar una unidad
   */
  const deleteUnidad = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.deleteUnidad(id);
      setUnidades(prev => prev.filter(und => und.id !== id));
      setSuccess('Unidad eliminada exitosamente');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpiar mensajes de error y éxito
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  /**
   * Recargar unidades
   */
  const refresh = useCallback(() => {
    return fetchUnidades();
  }, [fetchUnidades]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchUnidades();
    }
  }, [autoFetch, fetchUnidades]);

  return {
    // Estado
    unidades,
    loading,
    error,
    success,
    
    // Métodos
    fetchUnidades,
    createUnidad,
    updateUnidad,
    deleteUnidad,
    clearMessages,
    refresh,
  };
};