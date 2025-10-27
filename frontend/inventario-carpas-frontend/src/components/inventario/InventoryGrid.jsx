// frontend/src/components/inventario/InventoryGrid.jsx

import React from 'react';
import ElementoCard from './elementoCard';

/**
 * Grid de elementos con estado vacío
 */
const InventoryGrid = ({
  elementos,
  onEdit,
  onDelete,
  onViewSeries,
  hasActiveFilters,
  onCreateElemento
}) => {
  // Si hay elementos, mostrar grid
  if (elementos.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elementos.map((elemento) => (
          <ElementoCard
            key={elemento.id}
            elemento={elemento}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewSeries={onViewSeries}
          />
        ))}
      </div>
    );
  }

  // Estado vacío
  return (
    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
      <div className="text-7xl mb-4">
        {hasActiveFilters ? '🔍' : '📦'}
      </div>
      <h3 className="text-2xl font-semibold text-gray-700 mb-2">
        {hasActiveFilters 
          ? 'No se encontraron elementos' 
          : 'No hay elementos en el inventario'}
      </h3>
      <p className="text-gray-500 mb-6">
        {hasActiveFilters
          ? 'Intenta ajustar los filtros o la búsqueda'
          : 'Comienza agregando tu primer elemento'}
      </p>
      {!hasActiveFilters && (
        <button
          onClick={onCreateElemento}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Primer Elemento
        </button>
      )}
    </div>
  );
};

export default InventoryGrid;