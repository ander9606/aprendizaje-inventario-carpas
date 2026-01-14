// ============================================
// COMPONENTE: STAT CARD
// Tarjeta de estadística numérica mejorada
// ============================================

import { Package, Sparkles, CheckCircle, ShoppingBag, Wrench, AlertTriangle } from 'lucide-react'

/**
 * Componente StatCard - Muestra una estadística con valor numérico
 *
 * @param {string} label - Etiqueta de la estadística
 * @param {number} value - Valor numérico
 * @param {string} color - Color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
 * @param {string} icon - Emoji o ícono (opcional)
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {ReactNode} subtext - Texto adicional (opcional)
 *
 * @example
 * <StatCard
 *   label="Total"
 *   value={200}
 *   color="blue"
 *   subtext="elementos"
 * />
 */
export const StatCard = ({
  label,
  value = 0,
  color = 'blue',
  icon = null,
  size = 'md',
  subtext = null,
  className = '',
  ...props
}) => {

  // ============================================
  // ÍCONOS POR DEFECTO SEGÚN LABEL
  // ============================================
  const getDefaultIcon = () => {
    const labelLower = label?.toLowerCase() || ''
    if (labelLower.includes('total')) return Package
    if (labelLower.includes('nuevo')) return Sparkles
    if (labelLower.includes('bueno')) return CheckCircle
    if (labelLower.includes('alquil')) return ShoppingBag
    if (labelLower.includes('manten')) return Wrench
    if (labelLower.includes('daña') || labelLower.includes('dañ')) return AlertTriangle
    return Package
  }

  const IconComponent = icon || getDefaultIcon()

  // ============================================
  // COLORES POR VARIANTE (Mejorados)
  // ============================================
  const colorStyles = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-600',
      value: 'text-blue-700',
      iconBg: 'bg-blue-100',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-600',
      value: 'text-green-700',
      iconBg: 'bg-green-100',
      icon: 'text-green-500'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      text: 'text-amber-600',
      value: 'text-amber-700',
      iconBg: 'bg-amber-100',
      icon: 'text-amber-500'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-600',
      value: 'text-red-700',
      iconBg: 'bg-red-100',
      icon: 'text-red-500'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-600',
      value: 'text-purple-700',
      iconBg: 'bg-purple-100',
      icon: 'text-purple-500'
    },
    gray: {
      bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-600',
      value: 'text-slate-700',
      iconBg: 'bg-slate-100',
      icon: 'text-slate-500'
    }
  }

  // ============================================
  // TAMAÑOS
  // ============================================
  const sizeStyles = {
    sm: {
      padding: 'p-3',
      iconSize: 'w-4 h-4',
      iconWrapper: 'w-8 h-8',
      valueSize: 'text-xl',
      labelSize: 'text-xs',
      subtextSize: 'text-xs'
    },
    md: {
      padding: 'p-4',
      iconSize: 'w-5 h-5',
      iconWrapper: 'w-10 h-10',
      valueSize: 'text-2xl',
      labelSize: 'text-xs',
      subtextSize: 'text-sm'
    },
    lg: {
      padding: 'p-5',
      iconSize: 'w-6 h-6',
      iconWrapper: 'w-12 h-12',
      valueSize: 'text-3xl',
      labelSize: 'text-sm',
      subtextSize: 'text-base'
    }
  }

  const colors = colorStyles[color] || colorStyles.gray
  const sizes = sizeStyles[size] || sizeStyles.md

  return (
    <div
      className={`
        ${colors.bg} ${colors.border}
        border rounded-xl
        ${sizes.padding}
        transition-all duration-200
        hover:shadow-md hover:scale-[1.02]
        ${className}
      `}
      {...props}
    >
      {/* Layout vertical centrado */}
      <div className="flex flex-col">
        {/* Label arriba */}
        <p className={`${colors.text} ${sizes.labelSize} font-semibold uppercase tracking-wider mb-1`}>
          {label}
        </p>

        {/* Contenedor de valor e ícono */}
        <div className="flex items-center justify-between">
          {/* Value */}
          <p className={`${colors.value} ${sizes.valueSize} font-bold`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>

          {/* Ícono */}
          {IconComponent && (
            <div className={`${sizes.iconWrapper} ${colors.iconBg} rounded-lg flex items-center justify-center`}>
              {/* Verificar si es un componente React (forwardRef o función) */}
              {typeof IconComponent === 'function' || (IconComponent.$$typeof && IconComponent.render) ? (
                <IconComponent className={`${sizes.iconSize} ${colors.icon}`} />
              ) : typeof IconComponent === 'string' ? (
                <span className={`${sizes.iconSize} flex items-center justify-center`}>{IconComponent}</span>
              ) : null}
            </div>
          )}
        </div>

        {/* Subtext (opcional) */}
        {subtext && (
          <p className={`${colors.text} ${sizes.subtextSize} mt-1 opacity-80`}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}

export default StatCard
