// frontend/src/hooks/useLotes.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Hook personalizado para manejar operaciones de lotes
 * @param {boolean} autoFetch - Si debe cargar automáticamente al montar
 */
export const useLotes = (autoFetch = true) => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Obtener resumen de lotes
   */
  const fetchLotesResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getLotesResumen();
      setLotes(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear un movimiento de lote
   * @param {Object} movimientoData - Datos del movimiento
   * @param {number} movimientoData.elemento_id - ID del elemento
   * @param {string} movimientoData.tipo_movimiento - ENTRADA o SALIDA
   * @param {number} movimientoData.cantidad - Cantidad de unidades
   * @param {string} movimientoData.cleaning_status - Estado de limpieza
   * @param {string} movimientoData.current_status - Estado actual
   * @param {string} movimientoData.ubicacion - Ubicación (opcional)
   * @param {string} movimientoData.observaciones - Observaciones (opcional)
   */
  const createMovimientoLote = useCallback(async (movimientoData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await apiService.createMovimientoLote(movimientoData);
      setSuccess(`Movimiento de ${movimientoData.tipo_movimiento} registrado exitosamente`);
      // Recargar lotes después del movimiento
      await fetchLotesResumen();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchLotesResumen]);

  /**
   * Limpiar mensajes de error y éxito
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  /**
   * Recargar lotes
   */
  const refresh = useCallback(() => {
    return fetchLotesResumen();
  }, [fetchLotesResumen]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchLotesResumen();
    }
  }, [autoFetch, fetchLotesResumen]);

  return {
    // Estado
    lotes,
    loading,
    error,
    success,
    
    // Métodos
    fetchLotesResumen,
    createMovimientoLote,
    clearMessages,
    refresh,
  };
};