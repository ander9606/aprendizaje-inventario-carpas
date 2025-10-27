// frontend/src/components/inventario/InventoryFilters.jsx

import React from 'react';

/**
 * Barra de búsqueda y filtros del inventario
 */
const InventoryFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategoria,
  onCategoriaChange,
  selectedEstado,
  onEstadoChange,
  selectedTipo,
  onTipoChange,
  categorias,
  onLimpiar,
  hasActiveFilters
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
      
      {/* Búsqueda */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Buscar por nombre, descripción, categoría o ubicación..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg 
            className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Filtros:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Filtro por Categoría */}
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Categoría</label>
            <select
              value={selectedCategoria}
              onChange={(e) => onCategoriaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Estado</label>
            <select
              value={selectedEstado}
              onChange={(e) => onEstadoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="bueno">✓ Bueno</option>
              <option value="regular">⚠️ Regular</option>
              <option value="malo">❌ Malo</option>
              <option value="en_reparacion">🔧 En Reparación</option>
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Tipo de Gestión</label>
            <select
              value={selectedTipo}
              onChange={(e) => onTipoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="series">📋 Con Series</option>
              <option value="lote">📦 Por Lote</option>
            </select>
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={onLimpiar}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryFilters;