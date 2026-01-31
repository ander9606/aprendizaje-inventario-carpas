// ============================================
// COMPONENTE: BUTTON
// Botón reutilizable con variantes y estados
// ============================================

import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Componente Button - Botón reutilizable
 * 
 * @param {string} variant - Variante del botón: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {ReactNode} icon - Ícono opcional (componente de lucide-react)
 * @param {boolean} loading - Si está en estado de carga
 * @param {boolean} fullWidth - Si debe ocupar todo el ancho
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} type - Tipo de botón: 'button' | 'submit' | 'reset'
 * @param {function} onClick - Función al hacer click
 * @param {ReactNode} children - Contenido del botón (texto)
 * 
 * @example
 * <Button variant="primary" size="md" icon={<Plus />} onClick={handleClick}>
 *   Crear categoría
 * </Button>
 */
export const Button = ({
  variant = 'primary',
  color,
  size = 'md',
  icon = null,
  loading = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  ...props
}) => {

  // ============================================
  // ESTILOS BASE (siempre se aplican)
  // ============================================
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `

  // ============================================
  // ESTILOS POR TAMAÑO
  // ============================================
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  }

  // ============================================
  // ESTILOS POR COLOR (alternativa a variant)
  // ============================================
  const colorStyles = {
    blue: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
      active:bg-blue-800
    `,
    green: `
      bg-green-600 text-white
      hover:bg-green-700
      focus:ring-green-500
      active:bg-green-800
    `,
    red: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
      active:bg-red-800
    `,
    orange: `
      bg-orange-600 text-white
      hover:bg-orange-700
      focus:ring-orange-500
      active:bg-orange-800
    `,
    slate: `
      bg-slate-600 text-white
      hover:bg-slate-700
      focus:ring-slate-500
      active:bg-slate-800
    `
  }

  // ============================================
  // ESTILOS POR VARIANTE (colores)
  // ============================================
  const variantStyles = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
      active:bg-blue-800
    `,
    secondary: `
      bg-slate-600 text-white
      hover:bg-slate-700
      focus:ring-slate-500
      active:bg-slate-800
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
      active:bg-red-800
    `,
    success: `
      bg-green-600 text-white
      hover:bg-green-700
      focus:ring-green-500
      active:bg-green-800
    `,
    ghost: `
      bg-transparent text-slate-700
      hover:bg-slate-100
      focus:ring-slate-400
      active:bg-slate-200
    `,
    outline: `
      bg-transparent text-slate-700
      border-2 border-slate-300
      hover:bg-slate-50
      focus:ring-slate-400
      active:bg-slate-100
    `
  }
  
  // ============================================
  // TAMAÑO DEL ÍCONO SEGÚN EL TAMAÑO DEL BOTÓN
  // ============================================
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  // ============================================
  // DETERMINAR ESTILOS DE COLOR
  // Si se pasa color, se usa colorStyles; si es outline con color, se aplica borde
  // ============================================
  const getColorStyles = () => {
    if (variant === 'outline' && color) {
      const outlineColorStyles = {
        blue: 'bg-transparent text-blue-600 border-2 border-blue-300 hover:bg-blue-50 focus:ring-blue-400',
        green: 'bg-transparent text-green-600 border-2 border-green-300 hover:bg-green-50 focus:ring-green-400',
        red: 'bg-transparent text-red-600 border-2 border-red-300 hover:bg-red-50 focus:ring-red-400',
        orange: 'bg-transparent text-orange-600 border-2 border-orange-300 hover:bg-orange-50 focus:ring-orange-400',
        slate: 'bg-transparent text-slate-600 border-2 border-slate-300 hover:bg-slate-50 focus:ring-slate-400'
      }
      return outlineColorStyles[color] || variantStyles.outline
    }
    if (color && colorStyles[color]) {
      return colorStyles[color]
    }
    return variantStyles[variant]
  }

  // ============================================
  // COMBINAMOS TODOS LOS ESTILOS
  // ============================================
  const buttonClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${getColorStyles()}
    ${className}
  `
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Spinner de carga */}
      {loading && (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      )}
      
      {/* Ícono (solo si no está cargando) */}
      {!loading && icon && (
        React.isValidElement(icon)
          ? <span className={iconSizes[size]}>{icon}</span>
          : <span className={iconSizes[size]}>{React.createElement(icon, { className: iconSizes[size] })}</span>
      )}
      
      {/* Texto del botón */}
      {children}
    </button>
  )
}

export default Button