// frontend/src/components/modals/CreateElementoModal.jsx
// VERSIÓN ACTUALIZADA - Compatible con ElementoModel del backend

import React, { useState } from 'react';
import Modal from './Modal';

/**
 * Modal para crear un nuevo elemento
 * Campos basados en ElementoModel del backend
 */
const CreateElementoModal = ({ isOpen, onClose, onSubmit, categorias, materiales, unidades, loading }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: '0',
    requiere_series: false,
    categoria_id: '',
    material_id: '',
    unidad_id: '',
    estado: 'bueno',
    ubicacion: '',
    fecha_ingreso: new Date().toISOString().split('T')[0] // Fecha actual
  });

  const [errors, setErrors] = useState({});

  /**
   * Manejar cambios en el formulario
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (formData.cantidad && isNaN(parseInt(formData.cantidad))) {
      newErrors.cantidad = 'Debe ser un número válido';
    }

    if (parseInt(formData.cantidad) < 0) {
      newErrors.cantidad = 'La cantidad no puede ser negativa';
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
      // Preparar datos para enviar (coincide con ElementoModel)
      const dataToSubmit = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        cantidad: parseInt(formData.cantidad) || 0,
        requiere_series: formData.requiere_series,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        material_id: formData.material_id ? parseInt(formData.material_id) : null,
        unidad_id: formData.unidad_id ? parseInt(formData.unidad_id) : null,
        estado: formData.estado,
        ubicacion: formData.ubicacion.trim() || null,
        fecha_ingreso: formData.fecha_ingreso || null
      };

      await onSubmit(dataToSubmit);
      
      // Limpiar formulario después de enviar exitosamente
      setFormData({
        nombre: '',
        descripcion: '',
        cantidad: '0',
        requiere_series: false,
        categoria_id: '',
        material_id: '',
        unidad_id: '',
        estado: 'bueno',
        ubicacion: '',
        fecha_ingreso: new Date().toISOString().split('T')[0]
      });
      setErrors({});
    } catch (error) {
      console.error('Error al crear elemento:', error);
    }
  };

  /**
   * Manejar cierre del modal
   */
  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      cantidad: '0',
      requiere_series: false,
      categoria_id: '',
      material_id: '',
      unidad_id: '',
      estado: 'bueno',
      ubicacion: '',
      fecha_ingreso: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Elemento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información Básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Información Básica
          </h3>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Carpa 3x3"
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción detallada del elemento..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Inicial
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cantidad ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.cantidad && (
                <p className="text-red-500 text-sm mt-1">{errors.cantidad}</p>
              )}
            </div>

            {/* Fecha de Ingreso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                name="fecha_ingreso"
                value={formData.fecha_ingreso}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Clasificación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Clasificación
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin categoría</option>
                {categorias?.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <select
                name="material_id"
                value={formData.material_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin material</option>
                {materiales?.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Unidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Medida
              </label>
              <select
                name="unidad_id"
                value={formData.unidad_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin unidad</option>
                {unidades?.map(unidad => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.abreviatura})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estado y Ubicación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Estado y Ubicación
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bueno">✓ Bueno</option>
                <option value="regular">⚠️ Regular</option>
                <option value="malo">❌ Malo</option>
                <option value="en_reparacion">🔧 En Reparación</option>
              </select>
            </div>

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
          </div>
        </div>

        {/* Configuración de Series */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Configuración
          </h3>

          {/* Requiere Series */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="requiere_series"
              id="requiere_series"
              checked={formData.requiere_series}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="requiere_series" className="ml-2 text-sm text-gray-700">
              Este elemento requiere <strong>números de serie individuales</strong>
            </label>
          </div>

          {!formData.requiere_series ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ Este elemento se manejará por <strong>cantidad en stock</strong> sin series individuales
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✓ Este elemento tendrá <strong>series individuales</strong> que se asignarán posteriormente
              </p>
            </div>
          )}
        </div>

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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Creando...' : 'Crear Elemento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateElementoModal;