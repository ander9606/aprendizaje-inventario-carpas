// frontend/src/components/inventario/ElementoCard.jsx
// VERSIÓN MEJORADA con mejor diseño visual

import React from 'react';

/**
 * Card mejorada para mostrar elementos del inventario
 * Más visual, con badges, progreso, y mejor organización
 */
const ElementoCard = ({ 
  elemento, 
  onEdit, 
  onDelete, 
  onViewSeries,  // Nueva prop para ver series
  
}) => {
  
  /**
   * Configuración de colores por estado
   */
  const getEstadoConfig = (estado) => {
    const configs = {
      bueno: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        dot: 'bg-green-500',
        icon: '✓',
        label: 'Bueno'
      },
      regular: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500',
        icon: '⚠️',
        label: 'Regular'
      },
      malo: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-500',
        icon: '❌',
        label: 'Malo'
      },
      en_reparacion: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        icon: '🔧',
        label: 'En Reparación'
      }
    };
    return configs[estado] || configs.bueno;
  };

  const estadoConfig = getEstadoConfig(elemento.estado);

  /**
   * Calcular porcentaje de stock disponible
   */
  const calcularStockPercentage = () => {
    if (elemento.requiere_series && elemento.total_series > 0) {
      // Para elementos con series
      const disponibles = elemento.series_disponibles || 0;
      return Math.round((disponibles / elemento.total_series) * 100);
    } else if (!elemento.requiere_series && elemento.cantidad > 0) {
      // Para elementos sin series (lote)
      // Asumimos que toda la cantidad está disponible por ahora
      return 100;
    }
    return 0;
  };

  const stockPercentage = calcularStockPercentage();

  /**
   * Obtener color de la barra de progreso
   */
  const getProgressColor = () => {
    if (stockPercentage >= 70) return 'bg-green-500';
    if (stockPercentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100">
      
      {/* Header con gradiente y estado */}
      <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-5 py-4">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="relative flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
              {elemento.nombre}
            </h3>
            {elemento.categoria && (
              <span className="inline-flex items-center px-2 py-0.5 bg-white bg-opacity-20 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                📁 {elemento.categoria}
              </span>
            )}
          </div>
          
          {/* Badge de estado */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 ${estadoConfig.bg} ${estadoConfig.border} border rounded-lg`}>
            <span className={`w-2 h-2 ${estadoConfig.dot} rounded-full animate-pulse`}></span>
            <span className={`text-xs font-semibold ${estadoConfig.text}`}>
              {estadoConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Cantidad */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 font-medium">
              {elemento.requiere_series ? 'Total Series' : 'Cantidad'}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {elemento.requiere_series ? elemento.total_series || 0 : elemento.cantidad || 0}
            </p>
            {elemento.unidad_abrev && !elemento.requiere_series && (
              <p className="text-xs text-gray-600 mt-0.5">{elemento.unidad_abrev}</p>
            )}
          </div>

          {/* Disponibles */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 mb-1 font-medium">Disponibles</p>
            <p className="text-2xl font-bold text-green-700">
              {elemento.requiere_series 
                ? elemento.series_disponibles || 0 
                : elemento.cantidad || 0}
            </p>
            <p className="text-xs text-green-600 mt-0.5">{stockPercentage}%</p>
          </div>

        </div>

        {/* Barra de progreso de stock */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">Disponibilidad</span>
            <span className="text-gray-900 font-semibold">{stockPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${stockPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          
          {elemento.material && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20 flex-shrink-0">🎨 Material:</span>
              <span className="font-medium text-gray-700 truncate">{elemento.material}</span>
            </div>
          )}
          
          {elemento.ubicacion && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20 flex-shrink-0">📍 Ubicación:</span>
              <span className="font-medium text-gray-700 truncate">{elemento.ubicacion}</span>
            </div>
          )}

          {elemento.fecha_ingreso && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20 flex-shrink-0">📅 Ingreso:</span>
              <span className="font-medium text-gray-700">
                {new Date(elemento.fecha_ingreso).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Descripción */}
        {elemento.descripcion && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {elemento.descripcion}
            </p>
          </div>
        )}

        {/* Badge de tipo de gestión */}
        <div className="flex items-center gap-2">
          {elemento.requiere_series ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-medium">
              <span>📋</span>
              <span>Series Individuales</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium">
              <span>📦</span>
              <span>Stock General</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="px-5 pb-4 flex gap-2">
        
        {/* Ver Series (solo si tiene series) */}
        {elemento.requiere_series && onViewSeries && (
          <button
            onClick={() => onViewSeries(elemento)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium border border-indigo-200"
          >
            <span>📋</span>
            <span>Ver Series ({elemento.total_series || 0})</span>
          </button>
        )}

        {/* Editar */}
        <button
          onClick={() => onEdit(elemento)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Editar</span>
        </button>
        
        {/* Eliminar */}
        <button
          onClick={() => onDelete(elemento.id)}
          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ElementoCard;