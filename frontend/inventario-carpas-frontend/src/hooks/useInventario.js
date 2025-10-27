// frontend/src/hooks/useInventario.js
// VERSIÓN DEPURADA Y SIMPLIFICADA

import { useState, useEffect, useCallback } from 'react';
import { useElementos } from './useElementos';
import { useLotes } from './useLotes';
import { useCategorias } from './useCategorias';

/**
 * Hook maestro para manejar el inventario completo
 * Integra elementos, lotes y categorías
 * VERSIÓN CON DEBUG
 */
export const useInventario = (options = {}) => {
  const {
    fetchElementos = true,
    fetchLotes = false,
    fetchCategorias = true,
    conSeries = false,
  } = options;

  console.log('🔷 useInventario - Opciones:', options);

  // Estado para rastrear errores y mensajes
  const [errors, setErrors] = useState([]);
  const [successMessages, setSuccessMessages] = useState([]);

  // Hooks individuales
  const elementosHook = useElementos(fetchElementos, conSeries);
  const lotesHook = useLotes(fetchLotes);
  const categoriasHook = useCategorias(fetchCategorias);

  console.log('🔷 useInventario - Estado de hooks:', {
    elementos: {
      loading: elementosHook.loading,
      dataLength: elementosHook.elementos?.length,
      error: elementosHook.error
    },
    categorias: {
      loading: categoriasHook.loading,
      dataLength: categoriasHook.categorias?.length,
      error: categoriasHook.error
    }
  });

  /**
   * Recolectar errores de todos los hooks
   */
  useEffect(() => {
    const allErrors = [];
    
    if (elementosHook.error) {
      console.error('❌ Error en elementos:', elementosHook.error);
      allErrors.push(`Elementos: ${elementosHook.error}`);
    }
    if (lotesHook.error) {
      console.error('❌ Error en lotes:', lotesHook.error);
      allErrors.push(`Lotes: ${lotesHook.error}`);
    }
    if (categoriasHook.error) {
      console.error('❌ Error en categorías:', categoriasHook.error);
      allErrors.push(`Categorías: ${categoriasHook.error}`);
    }
    
    setErrors(allErrors);
  }, [elementosHook.error, lotesHook.error, categoriasHook.error]);

  /**
   * Recolectar mensajes de éxito
   */
  useEffect(() => {
    const allSuccess = [];
    
    if (elementosHook.success) {
      console.log('✅ Éxito en elementos:', elementosHook.success);
      allSuccess.push(elementosHook.success);
    }
    if (lotesHook.success) {
      console.log('✅ Éxito en lotes:', lotesHook.success);
      allSuccess.push(lotesHook.success);
    }
    if (categoriasHook.success) {
      console.log('✅ Éxito en categorías:', categoriasHook.success);
      allSuccess.push(categoriasHook.success);
    }
    
    setSuccessMessages(allSuccess);
  }, [elementosHook.success, lotesHook.success, categoriasHook.success]);

  /**
   * Refrescar todos los datos
   */
  const refreshAll = useCallback(async () => {
    console.log('🔄 Refrescando todo el inventario...');
    try {
      if (fetchElementos) {
        console.log('🔄 Refrescando elementos...');
        await elementosHook.refresh();
      }
      if (fetchLotes) {
        console.log('🔄 Refrescando lotes...');
        await lotesHook.refresh();
      }
      if (fetchCategorias) {
        console.log('🔄 Refrescando categorías...');
        await categoriasHook.refresh();
      }
      console.log('✅ Refresco completado');
    } catch (error) {
      console.error('❌ Error al refrescar:', error);
    }
  }, [fetchElementos, fetchLotes, fetchCategorias, elementosHook, lotesHook, categoriasHook]);

  /**
   * Limpiar todos los mensajes
   */
  const clearAllMessages = useCallback(() => {
    console.log('🧹 Limpiando mensajes...');
    setErrors([]);
    setSuccessMessages([]);
    elementosHook.clearMessages?.();
    lotesHook.clearMessages?.();
    categoriasHook.clearMessages?.();
  }, [elementosHook, lotesHook, categoriasHook]);

  // Estado de carga general
  const loading = elementosHook.loading || lotesHook.loading || categoriasHook.loading;

  console.log('🔷 useInventario - Estado final:', {
    loading,
    elementosCount: elementosHook.elementos?.length || 0,
    categoriasCount: categoriasHook.categorias?.length || 0,
    hasError: errors.length > 0,
    hasSuccess: successMessages.length > 0
  });

  return {
    // Elementos
    elementos: {
      data: elementosHook.elementos || [],
      loading: elementosHook.loading,
      error: elementosHook.error,
      createElemento: elementosHook.createElemento,
      updateElemento: elementosHook.updateElemento,
      deleteElemento: elementosHook.deleteElemento,
      refresh: elementosHook.refresh,
    },
    
    // Lotes
    lotes: {
      data: lotesHook.lotes || [],
      loading: lotesHook.loading,
      error: lotesHook.error,
      createMovimientoLote: lotesHook.createMovimientoLote,
      refresh: lotesHook.refresh,
    },
    
    // Categorías
    categorias: {
      data: categoriasHook.categorias || [],
      loading: categoriasHook.loading,
      error: categoriasHook.error,
      refresh: categoriasHook.refresh,
    },
    
    // Estado general
    loading,
    errors,
    successMessages,
    hasError: errors.length > 0,
    hasSuccess: successMessages.length > 0,
    
    // Métodos generales
    refreshAll,
    clearAllMessages,
  };
};