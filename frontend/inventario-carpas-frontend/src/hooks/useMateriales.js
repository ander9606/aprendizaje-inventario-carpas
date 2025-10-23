// frontend/src/hooks/useMateriales.js

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar materiales
 * @param {boolean} autoFetch - Si debe cargar automáticamente al montar
 */
export const useMateriales = (autoFetch = true) => {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Obtener todos los materiales
   */
  const fetchMateriales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMateriales();
      setMateriales(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear un nuevo material
   */
  const createMaterial = useCallback(async (materialData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newMaterial = await apiService.createMaterial(materialData);
      setMateriales(prev => [...prev, newMaterial]);
      setSuccess('Material creado exitosamente');
      return newMaterial;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar un material existente
   */
  const updateMaterial = useCallback(async (id, materialData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedMaterial = await apiService.updateMaterial(id, materialData);
      setMateriales(prev => 
        prev.map(mat => mat.id === id ? updatedMaterial : mat)
      );
      setSuccess('Material actualizado exitosamente');
      return updatedMaterial;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar un material
   */
  const deleteMaterial = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.deleteMaterial(id);
      setMateriales(prev => prev.filter(mat => mat.id !== id));
      setSuccess('Material eliminado exitosamente');
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
   * Recargar materiales
   */
  const refresh = useCallback(() => {
    return fetchMateriales();
  }, [fetchMateriales]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchMateriales();
    }
  }, [autoFetch, fetchMateriales]);

  return {
    // Estado
    materiales,
    loading,
    error,
    success,
    
    // Métodos
    fetchMateriales,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    clearMessages,
    refresh,
  };
};