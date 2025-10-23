// frontend/src/components/common/StatsCard.jsx

import React from 'react';

/**
 * Card especializada para mostrar estadísticas
 * Mejora visual del Card base con iconos y colores
 */
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  subtitle,
  trend,
  onClick 
}) => {
  /**
   * Configuración de colores por tipo
   */
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'bg-blue-100',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'bg-green-100',
      border: 'border-green-200'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'bg-red-100',
      border: 'border-red-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'bg-yellow-100',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'bg-purple-100',
      border: 'border-purple-200'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      icon: 'bg-gray-100',
      border: 'border-gray-200'
    }
  };

  const colors = colorConfig[color] || colorConfig.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 border-l-4 ${colors.border} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        {icon && (
          <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center text-2xl`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mb-2">
        <p className={`text-4xl font-bold ${colors.text}`}>
          {value}
        </p>
      </div>

      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}

      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {trend.direction === 'up' && (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className={`text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.value}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              {trend.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;