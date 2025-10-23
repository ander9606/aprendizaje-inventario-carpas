// frontend/src/pages/Inventario-handlers.js
// Handlers completos para copiar y pegar cuando implementes los modales

/**
 * HANDLERS PARA ELEMENTOS
 * Copia estos handlers cuando tengas los modales listos
 */

/**
 * Manejar creación de elemento
 * Usar cuando tengas el modal CreateElementoModal
 */
export const handleCreateElemento = async (elementos, formData, setShowCreateModal) => {
  try {
    await elementos.createElemento(formData);
    setShowCreateModal(false);
    // El hook ya actualiza la lista automáticamente
    // Opcional: mostrar notificación personalizada
  } catch (error) {
    console.error('Error al crear elemento:', error);
    // El error ya está manejado por el hook
  }
};

/**
 * Manejar actualización de elemento
 * Usar cuando tengas el modal EditElementoModal
 */
export const handleUpdateElemento = async (elementos, id, formData, setSelectedElemento) => {
  try {
    await elementos.updateElemento(id, formData);
    setSelectedElemento(null);
    // El hook ya actualiza la lista automáticamente
  } catch (error) {
    console.error('Error al actualizar elemento:', error);
  }
};

/**
 * Manejar eliminación de elemento
 * Ya implementado en el componente principal
 */
export const handleDeleteElemento = async (elementos, id) => {
  if (window.confirm('¿Está seguro de eliminar este elemento?')) {
    try {
      await elementos.deleteElemento(id);
      // El hook ya actualiza la lista automáticamente
    } catch (error) {
      console.error('Error al eliminar elemento:', error);
    }
  }
};

/**
 * HANDLERS PARA MOVIMIENTOS DE LOTES
 */

/**
 * Manejar creación de movimiento de lote
 * Usar cuando tengas el modal MovimientoModal
 * 
 * @param {Object} movimientoData - Datos del movimiento
 * @param {number} movimientoData.elemento_id - ID del elemento
 * @param {string} movimientoData.tipo_movimiento - ENTRADA o SALIDA
 * @param {number} movimientoData.cantidad - Cantidad de unidades
 * @param {string} movimientoData.cleaning_status - Estado de limpieza
 * @param {string} movimientoData.current_status - Estado actual
 * @param {string} movimientoData.ubicacion - Ubicación (opcional)
 * @param {string} movimientoData.observaciones - Observaciones (opcional)
 */
export const handleCreateMovimiento = async (lotes, movimientoData, setShowMovimientoModal) => {
  try {
    await lotes.createMovimientoLote(movimientoData);
    setShowMovimientoModal(false);
    // El hook ya recarga los lotes automáticamente
  } catch (error) {
    console.error('Error al crear movimiento:', error);
  }
};

/**
 * EJEMPLO DE USO EN EL COMPONENTE
 * 
 * import { handleCreateElemento, handleUpdateElemento, handleCreateMovimiento } from './Inventario-handlers';
 * 
 * // En tu componente:
 * const Inventario = () => {
 *   const { elementos, lotes } = useInventario(...);
 *   const [showCreateModal, setShowCreateModal] = useState(false);
 *   
 *   // Pasar el handler al modal
 *   <CreateElementoModal 
 *     isOpen={showCreateModal}
 *     onClose={() => setShowCreateModal(false)}
 *     onSubmit={(formData) => handleCreateElemento(elementos, formData, setShowCreateModal)}
 *   />
 * }
 */

/**
 * VALIDACIONES PARA FORMULARIOS
 */

/**
 * Validar datos de elemento antes de enviar
 */
export const validateElementoData = (formData) => {
  const errors = {};

  if (!formData.nombre || formData.nombre.trim() === '') {
    errors.nombre = 'El nombre es requerido';
  }

  if (!formData.codigo || formData.codigo.trim() === '') {
    errors.codigo = 'El código es requerido';
  }

  if (!formData.categoria_id) {
    errors.categoria_id = 'Debe seleccionar una categoría';
  }

  if (formData.usa_series === undefined) {
    errors.usa_series = 'Debe indicar si usa series';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validar datos de movimiento antes de enviar
 */
export const validateMovimientoData = (formData) => {
  const errors = {};

  if (!formData.elemento_id) {
    errors.elemento_id = 'Debe seleccionar un elemento';
  }

  if (!formData.tipo_movimiento || !['ENTRADA', 'SALIDA'].includes(formData.tipo_movimiento)) {
    errors.tipo_movimiento = 'Tipo de movimiento inválido';
  }

  if (!formData.cantidad || formData.cantidad <= 0) {
    errors.cantidad = 'La cantidad debe ser mayor a 0';
  }

  if (!formData.cleaning_status) {
    errors.cleaning_status = 'Debe seleccionar un estado de limpieza';
  }

  if (!formData.current_status) {
    errors.current_status = 'Debe seleccionar un estado actual';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * HELPERS PARA FILTROS
 */

/**
 * Filtrar elementos por categoría
 */
export const filterByCategoria = (elementos, categoriaId) => {
  if (!categoriaId) return elementos;
  return elementos.filter(e => e.categoria_id === categoriaId);
};

/**
 * Filtrar elementos por estado
 */
export const filterByStatus = (elementos, status) => {
  if (!status) return elementos;
  
  return elementos.filter(elemento => {
    if (elemento.usa_series) {
      return elemento.series?.some(serie => serie.current_status === status);
    } else {
      return elemento.lotes?.some(lote => lote.current_status === status);
    }
  });
};

/**
 * Buscar elementos por texto
 */
export const searchElementos = (elementos, searchText) => {
  if (!searchText || searchText.trim() === '') return elementos;
  
  const text = searchText.toLowerCase();
  return elementos.filter(e => 
    e.nombre.toLowerCase().includes(text) ||
    e.codigo.toLowerCase().includes(text) ||
    e.categoria?.nombre.toLowerCase().includes(text)
  );
};

/**
 * HELPERS DE CÁLCULO
 */

/**
 * Calcular total de unidades disponibles
 */
export const getTotalUnidadesDisponibles = (elemento) => {
  if (elemento.usa_series) {
    return elemento.series?.filter(s => s.current_status === 'AVAILABLE').length || 0;
  } else {
    return elemento.lotes
      ?.filter(l => l.current_status === 'AVAILABLE')
      .reduce((sum, l) => sum + l.cantidad_actual, 0) || 0;
  }
};

/**
 * Obtener resumen de estados de un elemento
 */
export const getEstadosResumen = (elemento) => {
  const resumen = {
    available: 0,
    rented: 0,
    cleaning: 0,
    maintenance: 0,
    retired: 0
  };

  if (elemento.usa_series) {
    elemento.series?.forEach(serie => {
      const status = serie.current_status.toLowerCase();
      if (resumen[status] !== undefined) {
        resumen[status]++;
      }
    });
  } else {
    elemento.lotes?.forEach(lote => {
      const status = lote.current_status.toLowerCase();
      if (resumen[status] !== undefined) {
        resumen[status] += lote.cantidad_actual;
      }
    });
  }

  return resumen;
};

/**
 * HELPERS DE FORMATO
 */

/**
 * Formatear estado para mostrar
 */
export const formatStatus = (status) => {
  const statusMap = {
    'AVAILABLE': 'Disponible',
    'RENTED': 'Alquilado',
    'CLEANING': 'En Limpieza',
    'MAINTENANCE': 'Mantenimiento',
    'RETIRED': 'Retirado',
    'CLEAN': 'Limpio',
    'DIRTY': 'Sucio',
    'VERY_DIRTY': 'Muy Sucio',
    'DAMAGED': 'Dañado'
  };
  
  return statusMap[status] || status;
};

/**
 * Obtener clase de color para un estado
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'AVAILABLE': 'bg-green-100 text-green-700',
    'RENTED': 'bg-blue-100 text-blue-700',
    'CLEANING': 'bg-yellow-100 text-yellow-700',
    'MAINTENANCE': 'bg-orange-100 text-orange-700',
    'RETIRED': 'bg-gray-100 text-gray-700',
    'CLEAN': 'bg-green-100 text-green-700',
    'DIRTY': 'bg-yellow-100 text-yellow-700',
    'VERY_DIRTY': 'bg-orange-100 text-orange-700',
    'DAMAGED': 'bg-red-100 text-red-700'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};