// frontend/src/hooks/useElementos.js
// VERSIÓN FINAL - Compatible con respuestas en formato objeto

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar elementos del inventario
 * Compatible con respuestas en formato objeto {elementos: [...]}
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
      // apiService.getElementos ya maneja la extracción del array
      const data = await apiService.getElementos(conSeries);
      
      // Verificar que sea un array
      if (!Array.isArray(data)) {
        console.error('❌ Los datos no son un array después de procesar:', data);
        setElementos([]);
        setError('Formato de respuesta inválido');
        return [];
      }
      
      console.log(`✅ ${data.length} elementos cargados correctamente`);
      setElementos(data);
      return data;
    } catch (err) {
      console.error('❌ Error al cargar elementos:', err);
      const errorMessage = err.message || 'Error al cargar elementos';
      setError(errorMessage);
      setElementos([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conSeries]);

  /**
   * Crear un nuevo elemento
   */
  const createElemento = useCallback(async (elementoData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const newElemento = await apiService.createElemento(elementoData);
      
      // Agregar al estado local
      setElementos(prev => [...prev, newElemento]);
      setSuccess('Elemento creado exitosamente');
      
      return newElemento;
    } catch (err) {
      console.error('❌ Error al crear elemento:', err);
      const errorMessage = err.message || 'Error al crear elemento';
      setError(errorMessage);
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
      
      // Actualizar en el estado local
      setElementos(prev => 
        prev.map(elem => elem.id === id ? updatedElemento : elem)
      );
      setSuccess('Elemento actualizado exitosamente');
      
      return updatedElemento;
    } catch (err) {
      console.error('❌ Error al actualizar elemento:', err);
      const errorMessage = err.message || 'Error al actualizar elemento';
      setError(errorMessage);
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
      
      // Remover del estado local
      setElementos(prev => prev.filter(elem => elem.id !== id));
      setSuccess('Elemento eliminado exitosamente');
    } catch (err) {
      console.error('❌ Error al eliminar elemento:', err);
      const errorMessage = err.message || 'Error al eliminar elemento';
      setError(errorMessage);
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
    elementos,
    loading,
    error,
    success,
    fetchElementos,
    createElemento,
    updateElemento,
    deleteElemento,
    clearMessages,
    refresh,
  };
};