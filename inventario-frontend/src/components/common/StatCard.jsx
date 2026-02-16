// ============================================
// COMPONENTE: STAT CARD
// Tarjeta de estadística numérica
// ============================================

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
 *   icon="📦"
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
  onClick = null,
  active = false,
  className = '',
  ...props
}) => {

  // ============================================
  // COLORES POR VARIANTE
  // ============================================
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      value: 'text-blue-900',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      value: 'text-green-900',
      icon: 'text-green-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      value: 'text-yellow-900',
      icon: 'text-yellow-500'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      value: 'text-red-900',
      icon: 'text-red-500'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      value: 'text-purple-900',
      icon: 'text-purple-500'
    },
    gray: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      value: 'text-slate-900',
      icon: 'text-slate-500'
    }
  }

  // ============================================
  // TAMAÑOS
  // ============================================
  const sizeStyles = {
    sm: {
      padding: 'p-3',
      iconSize: 'text-2xl',
      valueSize: 'text-2xl',
      labelSize: 'text-xs',
      subtextSize: 'text-xs'
    },
    md: {
      padding: 'p-4',
      iconSize: 'text-3xl',
      valueSize: 'text-3xl',
      labelSize: 'text-sm',
      subtextSize: 'text-sm'
    },
    lg: {
      padding: 'p-6',
      iconSize: 'text-4xl',
      valueSize: 'text-4xl',
      labelSize: 'text-base',
      subtextSize: 'text-base'
    }
  }

  const colors = colorStyles[color]
  const sizes = sizeStyles[size]
  const isClickable = !!onClick
  const Tag = isClickable ? 'button' : 'div'

  return (
    <Tag
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      className={`
        ${colors.bg} ${colors.border}
        border rounded-lg
        ${sizes.padding}
        transition-all duration-200
        ${isClickable
          ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
          : 'hover:shadow-md'
        }
        ${active
          ? 'ring-2 ring-offset-1 ring-current shadow-md scale-[1.02]'
          : isClickable && !active
            ? 'opacity-80 hover:opacity-100'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {/* Layout: Ícono + Contenido */}
      <div className="flex items-center justify-between gap-3">

        {/* Contenido izquierdo: Label + Value */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className={`${colors.text} ${sizes.labelSize} font-medium uppercase tracking-wide mb-1`}>
            {label}
          </p>

          {/* Value */}
          <p className={`${colors.value} ${sizes.valueSize} font-bold`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>

          {/* Subtext (opcional) */}
          {subtext && (
            <p className={`${colors.text} ${sizes.subtextSize} mt-1`}>
              {subtext}
            </p>
          )}
        </div>

        {/* Ícono derecho (opcional) */}
        {icon && (
          <div className={`${sizes.iconSize} ${colors.icon} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </Tag>
  )
}

export default StatCard
