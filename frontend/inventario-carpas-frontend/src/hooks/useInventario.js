// frontend/src/hooks/useInventario.js
import { useElementos } from './useElementos';
import { useSeries } from './useSeries';
import { useLotes } from './useLotes';
import { useCategorias } from './useCategorias';

/**
 * Hook compuesto que combina todas las funcionalidades del inventario
 * Útil para páginas que necesitan múltiples recursos
 * 
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.fetchElementos - Cargar elementos automáticamente
 * @param {boolean} options.fetchLotes - Cargar lotes automáticamente
 * @param {boolean} options.fetchCategorias - Cargar categorías automáticamente
 * @param {boolean} options.conSeries - Incluir series en elementos
 * 
 * @example
 * // Usar en componente de Inventario
 * const {
 *   elementos,
 *   lotes,
 *   categorias,
 *   loading,
 *   createElemento,
 *   createMovimientoLote,
 *   refresh
 * } = useInventario({
 *   fetchElementos: true,
 *   fetchLotes: true,
 *   fetchCategorias: true,
 *   conSeries: true
 * });
 */
export const useInventario = ({
  fetchElementos = true,
  fetchLotes = false,
  fetchCategorias = false,
  conSeries = false
} = {}) => {
  
  const elementos = useElementos(fetchElementos, conSeries);
  const series = useSeries();
  const lotes = useLotes(fetchLotes);
  const categorias = useCategorias(fetchCategorias);

  /**
   * Determina si alguna operación está cargando
   */
  const isLoading = 
    elementos.loading || 
    series.loading || 
    lotes.loading || 
    categorias.loading;

  /**
   * Recopila todos los errores activos
   */
  const errors = [
    elementos.error,
    series.error,
    lotes.error,
    categorias.error
  ].filter(Boolean);

  /**
   * Recopila todos los mensajes de éxito
   */
  const successMessages = [
    elementos.success,
    lotes.success
  ].filter(Boolean);

  /**
   * Refresca todos los recursos cargados
   */
  const refreshAll = async () => {
    const promises = [];
    
    if (fetchElementos) promises.push(elementos.refresh());
    if (fetchLotes) promises.push(lotes.refresh());
    if (fetchCategorias) promises.push(categorias.refresh());
    
    await Promise.all(promises);
  };

  /**
   * Limpia todos los mensajes de error y éxito
   */
  const clearAllMessages = () => {
    elementos.clearMessages();
    series.clearError();
    lotes.clearMessages();
    categorias.clearError();
  };

  return {
    // Estados individuales
    elementos: {
      data: elementos.elementos,
      loading: elementos.loading,
      error: elementos.error,
      success: elementos.success,
      ...elementos
    },
    
    series: {
      data: series.series,
      loading: series.loading,
      error: series.error,
      ...series
    },
    
    lotes: {
      data: lotes.lotes,
      loading: lotes.loading,
      error: lotes.error,
      success: lotes.success,
      ...lotes
    },
    
    categorias: {
      data: categorias.categorias,
      loading: categorias.loading,
      error: categorias.error,
      ...categorias
    },
    
    // Estados combinados
    loading: isLoading,
    errors,
    successMessages,
    hasError: errors.length > 0,
    hasSuccess: successMessages.length > 0,
    
    // Métodos globales
    refreshAll,
    clearAllMessages,
  };
};