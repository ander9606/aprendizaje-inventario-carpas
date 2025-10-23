// frontend/src/components/inventario/ElementoCard.jsx

import React from 'react';

/**
 * Card especializada para mostrar información de un elemento del inventario
 */
const ElementoCard = ({ elemento, onEdit, onDelete, onViewDetails }) => {
  /**
   * Obtener configuración visual del estado
   */
  const getEstadoConfig = (estado) => {
    const estados = {
      bueno: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '✓',
        label: 'Bueno'
      },
      regular: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '⚠️',
        label: 'Regular'
      },
      malo: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: '❌',
        label: 'Malo'
      },
      en_reparacion: {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: '🔧',
        label: 'En Reparación'
      }
    };
    return estados[estado] || estados.bueno;
  };

  const estadoConfig = getEstadoConfig(elemento.estado);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              {elemento.nombre}
            </h3>
            {elemento.categoria && (
              <span className="inline-block px-2 py-1 bg-white bg-opacity-20 text-white rounded-full text-xs font-medium">
                {elemento.categoria}
              </span>
            )}
          </div>
          
          {/* Badge de estado */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${estadoConfig.color}`}>
            {estadoConfig.icon} {estadoConfig.label}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Información principal en grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Cantidad */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Cantidad</p>
            <p className="text-2xl font-bold text-gray-900">
              {elemento.cantidad || 0}
            </p>
            {elemento.unidad_abrev && (
              <p className="text-xs text-gray-600 mt-1">{elemento.unidad_abrev}</p>
            )}
          </div>

          {/* Series o Stock */}
          {elemento.requiere_series ? (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">Series</p>
              <p className="text-2xl font-bold text-blue-700">
                {elemento.total_series || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">registradas</p>
            </div>
          ) : (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">En Stock</p>
              <p className="text-2xl font-bold text-green-700">
                {elemento.cantidad || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">unidades</p>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="space-y-2 mb-4">
          {elemento.material && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">Material:</span>
              <span className="font-medium text-gray-700">{elemento.material}</span>
            </div>
          )}
          
          {elemento.ubicacion && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">Ubicación:</span>
              <span className="font-medium text-gray-700">{elemento.ubicacion}</span>
            </div>
          )}

          {elemento.fecha_ingreso && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">Ingreso:</span>
              <span className="font-medium text-gray-700">
                {new Date(elemento.fecha_ingreso).toLocaleDateString('es-CO')}
              </span>
            </div>
          )}
        </div>

        {/* Descripción */}
        {elemento.descripcion && (
          <div className="mb-4 pt-3 border-t">
            <p className="text-sm text-gray-600 line-clamp-2">
              {elemento.descripcion}
            </p>
          </div>
        )}

        {/* Badge de tipo */}
        <div className="mb-4">
          {elemento.requiere_series ? (
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              📋 Series Individuales
            </span>
          ) : (
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              📦 Stock General
            </span>
          )}
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="px-5 pb-4 flex gap-2">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(elemento)}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Ver Detalles
          </button>
        )}
        
        <button
          onClick={() => onEdit(elemento)}
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Editar
        </button>
        
        <button
          onClick={() => onDelete(elemento.id)}
          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default ElementoCard;