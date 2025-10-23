// frontend/src/components/modals/MovimientoModal.jsx
import React, { useState } from 'react';
import Modal from './Modal';

/**
 * Modal para registrar movimientos de lote (ENTRADA/SALIDA)
 */
const MovimientoModal = ({ isOpen, onClose, onSubmit, elementos, loading }) => {
  const [formData, setFormData] = useState({
    elemento_id: '',
    tipo_movimiento: 'ENTRADA',
    cantidad: '',
    cleaning_status: 'CLEAN',
    current_status: 'AVAILABLE',
    ubicacion: '',
    observaciones: ''
  });

  const [errors, setErrors] = useState({});

  /**
   * Manejar cambios en el formulario
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario lo edita
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Validar formulario
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.elemento_id) {
      newErrors.elemento_id = 'Debe seleccionar un elemento';
    }

    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.cleaning_status) {
      newErrors.cleaning_status = 'Debe seleccionar un estado de limpieza';
    }

    if (!formData.current_status) {
      newErrors.current_status = 'Debe seleccionar un estado actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      // Preparar datos para enviar
      const dataToSubmit = {
        ...formData,
        elemento_id: parseInt(formData.elemento_id),
        cantidad: parseInt(formData.cantidad)
      };

      await onSubmit(dataToSubmit);
      
      // Limpiar formulario después de enviar exitosamente
      setFormData({
        elemento_id: '',
        tipo_movimiento: 'ENTRADA',
        cantidad: '',
        cleaning_status: 'CLEAN',
        current_status: 'AVAILABLE',
        ubicacion: '',
        observaciones: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error al crear movimiento:', error);
    }
  };

  /**
   * Manejar cierre del modal
   */
  const handleClose = () => {
    setFormData({
      elemento_id: '',
      tipo_movimiento: 'ENTRADA',
      cantidad: '',
      cleaning_status: 'CLEAN',
      current_status: 'AVAILABLE',
      ubicacion: '',
      observaciones: ''
    });
    setErrors({});
    onClose();
  };

  // Filtrar solo elementos que NO usan series (porque series se manejan individualmente)
  const elementosLote = elementos.filter(e => !e.usa_series);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Movimiento de Lote" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información del Movimiento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Información del Movimiento
          </h3>

          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'tipo_movimiento', value: 'ENTRADA' } })}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.tipo_movimiento === 'ENTRADA'
                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📥</div>
                  <div>Entrada</div>
                  <div className="text-xs mt-1 opacity-75">Agregar unidades</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'tipo_movimiento', value: 'SALIDA' } })}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.tipo_movimiento === 'SALIDA'
                    ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📤</div>
                  <div>Salida</div>
                  <div className="text-xs mt-1 opacity-75">Retirar unidades</div>
                </div>
              </button>
            </div>
          </div>

          {/* Elemento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Elemento <span className="text-red-500">*</span>
            </label>
            <select
              name="elemento_id"
              value={formData.elemento_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.elemento_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione un elemento</option>
              {elementosLote.map(elemento => (
                <option key={elemento.id} value={elemento.id}>
                  {elemento.nombre} ({elemento.codigo})
                </option>
              ))}
            </select>
            {errors.elemento_id && (
              <p className="text-red-500 text-sm mt-1">{errors.elemento_id}</p>
            )}
            {elementosLote.length === 0 && (
              <p className="text-yellow-600 text-sm mt-1">
                ⚠️ No hay elementos que manejen lotes. Cree elementos sin series para usar esta función.
              </p>
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.cantidad ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Número de unidades"
            />
            {errors.cantidad && (
              <p className="text-red-500 text-sm mt-1">{errors.cantidad}</p>
            )}
          </div>
        </div>

        {/* Estados */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Estados
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estado de Limpieza */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Limpieza <span className="text-red-500">*</span>
              </label>
              <select
                name="cleaning_status"
                value={formData.cleaning_status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cleaning_status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="CLEAN">✨ Limpio</option>
                <option value="DIRTY">🧽 Sucio</option>
                <option value="VERY_DIRTY">🧼 Muy Sucio</option>
                <option value="DAMAGED">⚠️ Dañado</option>
              </select>
              {errors.cleaning_status && (
                <p className="text-red-500 text-sm mt-1">{errors.cleaning_status}</p>
              )}
            </div>

            {/* Estado Actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Actual <span className="text-red-500">*</span>
              </label>
              <select
                name="current_status"
                value={formData.current_status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.current_status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="AVAILABLE">✓ Disponible</option>
                <option value="RENTED">📤 Alquilado</option>
                <option value="CLEANING">🧹 En Limpieza</option>
                <option value="MAINTENANCE">🔧 Mantenimiento</option>
                <option value="RETIRED">📦 Retirado</option>
              </select>
              {errors.current_status && (
                <p className="text-red-500 text-sm mt-1">{errors.current_status}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Información Adicional
          </h3>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Bodega A, Estante 3"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas sobre el movimiento..."
            />
          </div>
        </div>

        {/* Resumen */}
        {formData.elemento_id && formData.cantidad && (
          <div className={`p-4 rounded-lg border-2 ${
            formData.tipo_movimiento === 'ENTRADA' 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <h4 className="font-semibold mb-2">📋 Resumen del Movimiento:</h4>
            <ul className="text-sm space-y-1">
              <li>
                • <strong>Tipo:</strong> {formData.tipo_movimiento === 'ENTRADA' ? '📥 Entrada' : '📤 Salida'}
              </li>
              <li>
                • <strong>Cantidad:</strong> {formData.cantidad} unidades
              </li>
              <li>
                • <strong>Estado:</strong> {formData.cleaning_status} / {formData.current_status}
              </li>
              {formData.ubicacion && (
                <li>• <strong>Ubicación:</strong> {formData.ubicacion}</li>
              )}
            </ul>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || elementosLote.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Registrando...' : 'Registrar Movimiento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MovimientoModal;