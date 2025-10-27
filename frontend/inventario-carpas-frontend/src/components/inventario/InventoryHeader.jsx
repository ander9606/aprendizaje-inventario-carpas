// frontend/src/components/inventario/InventoryHeader.jsx

import React from 'react';

/**
 * Header del inventario con título, stats y botones de acción
 */
const InventoryHeader = ({ 
  estadisticas,
  onCreateElemento,
  onCreateMovimiento,
  onRefresh,
  loading 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Título y stats */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📦 Inventario
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-gray-600">
                <span className="font-semibold text-blue-600">{estadisticas.total}</span> elementos
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span className="text-gray-600">
                <span className="font-semibold text-purple-600">{estadisticas.conSeries}</span> con series
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-600">{estadisticas.sinSeries}</span> por lote
              </span>
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onCreateElemento}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Elemento
          </button>
          
          <button
            onClick={onCreateMovimiento}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
          >
            <span className="text-lg">📦</span>
            Movimiento Lote
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg transition-colors font-medium border border-gray-300 disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryHeader;