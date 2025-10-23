// frontend/src/hooks/useElementos.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar operaciones CRUD de elementos
 * @param {boolean} autoFetch - Si debe cargar automáticamente al montar
 * @param {boolean} conSeries - Si debe incluir series en la consulta
 */
export const useElementos = (autoFetch = true, conSeries = false) => {
  const [elementos, setElementos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Obtener todos los elementos
   */
  const fetchElementos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getElementos(conSeries);
      setElementos(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conSeries]);

  /**
   * Obtener un elemento por ID
   */
  const fetchElementoById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getElementoById(id);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear un nuevo elemento
   */
  const createElemento = useCallback(async (elementoData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newElemento = await apiService.createElemento(elementoData);
      setElementos(prev => [...prev, newElemento]);
      setSuccess('Elemento creado exitosamente');
      return newElemento;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar un elemento existente
   */
  const updateElemento = useCallback(async (id, elementoData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedElemento = await apiService.updateElemento(id, elementoData);
      setElementos(prev => 
        prev.map(elem => elem.id === id ? updatedElemento : elem)
      );
      setSuccess('Elemento actualizado exitosamente');
      return updatedElemento;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar un elemento
   */
  const deleteElemento = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.deleteElemento(id);
      setElementos(prev => prev.filter(elem => elem.id !== id));
      setSuccess('Elemento eliminado exitosamente');
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
   * Recargar elementos
   */
  const refresh = useCallback(() => {
    return fetchElementos();
  }, [fetchElementos]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchElementos();
    }
  }, [autoFetch, fetchElementos]);

  return {
    // Estado
    elementos,
    loading,
    error,
    success,
    
    // Métodos
    fetchElementos,
    fetchElementoById,
    createElemento,
    updateElemento,
    deleteElemento,
    clearMessages,
    refresh,
  };
};