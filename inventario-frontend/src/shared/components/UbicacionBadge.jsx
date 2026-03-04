// ============================================
// COMPONENTE: UBICACION BADGE
// Badge pequeño para mostrar ubicación
// ============================================

import { MapPin } from 'lucide-react'

/**
 * Componente UbicacionBadge - Badge de ubicación
 *
 * @param {string} ubicacion - Nombre de la ubicación
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {boolean} showIcon - Mostrar ícono de ubicación
 * @param {string} variant - Variante visual: 'default' | 'outlined' | 'subtle'
 * @param {function} onClick - Función al hacer click (opcional)
 *
 * @example
 * <UbicacionBadge ubicacion="Bodega A" />
 * <UbicacionBadge ubicacion="Estante 12" size="sm" showIcon={false} />
 * <UbicacionBadge ubicacion="Bodega Principal" variant="outlined" onClick={handleClick} />
 */
export const UbicacionBadge = ({
  ubicacion,
  size = 'md',
  showIcon = true,
  variant = 'default',
  onClick,
  className = '',
  ...props
}) => {

  // ============================================
  // ESTILOS BASE
  // ============================================
  const baseStyles = `
    inline-flex items-center
    font-medium rounded-full
    transition-all duration-200
  `

  // ============================================
  // ESTILOS POR TAMAÑO
  // ============================================
  const sizeStyles = {
    sm: {
      container: 'px-2 py-0.5 text-xs gap-1',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'px-2.5 py-1 text-sm gap-1.5',
      icon: 'w-3.5 h-3.5'
    },
    lg: {
      container: 'px-3 py-1.5 text-base gap-2',
      icon: 'w-4 h-4'
    }
  }

  // ============================================
  // ESTILOS POR VARIANTE
  // ============================================
  const variantStyles = {
    default: `
      bg-blue-100 text-blue-700 border border-blue-200
      ${onClick ? 'hover:bg-blue-200 hover:border-blue-300 cursor-pointer' : ''}
    `,
    outlined: `
      bg-white text-blue-700 border-2 border-blue-300
      ${onClick ? 'hover:bg-blue-50 hover:border-blue-400 cursor-pointer' : ''}
    `,
    subtle: `
      bg-slate-100 text-slate-700 border border-slate-200
      ${onClick ? 'hover:bg-slate-200 hover:border-slate-300 cursor-pointer' : ''}
    `
  }

  const sizes = sizeStyles[size]

  const badgeClasses = `
    ${baseStyles}
    ${sizes.container}
    ${variantStyles[variant]}
    ${className}
  `

  // ============================================
  // COMPONENTE
  // ============================================
  const content = (
    <>
      {/* Ícono de ubicación */}
      {showIcon && (
        <MapPin className={sizes.icon} />
      )}

      {/* Texto de ubicación */}
      <span className="truncate">
        {ubicacion}
      </span>
    </>
  )

  // Si es clickeable, usar button
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={badgeClasses}
        {...props}
      >
        {content}
      </button>
    )
  }

  // Si no, usar span
  return (
    <span className={badgeClasses} {...props}>
      {content}
    </span>
  )
}

export default UbicacionBadge
