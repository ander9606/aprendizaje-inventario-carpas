// frontend/src/components/inventario/InventoryStats.jsx

import React from 'react';

/**
 * Cards de estadísticas rápidas por estado
 */
const InventoryStats = ({ estados }) => {
  const stats = [
    {
      label: 'Estado Bueno',
      value: estados.bueno,
      color: 'green',
      icon: '✓',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-green-500'
    },
    {
      label: 'Estado Regular',
      value: estados.regular,
      color: 'yellow',
      icon: '⚠️',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500'
    },
    {
      label: 'Estado Malo',
      value: estados.malo,
      color: 'red',
      icon: '❌',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-red-500'
    },
    {
      label: 'En Reparación',
      value: estados.en_reparacion,
      color: 'orange',
      icon: '🔧',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${stat.borderColor}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryStats;