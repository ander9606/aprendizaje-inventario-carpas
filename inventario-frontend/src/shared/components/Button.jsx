// ============================================
// COMPONENTE: BUTTON
// Botón reutilizable - tablet-first con touch targets 44px+
// ============================================

import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Componente Button - Botón reutilizable tablet-first
 *
 * @param {string} variant - Variante: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {ReactNode} icon - Ícono opcional
 * @param {boolean} loading - Estado de carga
 * @param {boolean} fullWidth - Ocupar todo el ancho
 * @param {boolean} disabled - Deshabilitado
 * @param {string} type - Tipo: 'button' | 'submit' | 'reset'
 * @param {function} onClick - Handler de click
 * @param {ReactNode} children - Contenido
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
  // ESTILOS BASE - touch-friendly por defecto
  // ============================================
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-full
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.97]
    select-none
    ${fullWidth ? 'w-full' : ''}
  `

  // ============================================
  // ESTILOS POR TAMAÑO - mínimo 44px de alto para touch
  // ============================================
  const sizeStyles = {
    sm: 'px-3.5 py-2 text-sm gap-1.5 min-h-[36px]',
    md: 'px-5 py-2.5 text-base gap-2 min-h-[44px]',
    lg: 'px-6 py-3.5 text-lg gap-2.5 min-h-[52px]'
  }

  // ============================================
  // ESTILOS POR COLOR
  // ============================================
  const colorStyles = {
    blue: `
      bg-blue-600 text-white
      hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-500
    `,
    green: `
      bg-green-600 text-white
      hover:bg-green-700 active:bg-green-800
      focus:ring-green-500
    `,
    red: `
      bg-red-600 text-white
      hover:bg-red-700 active:bg-red-800
      focus:ring-red-500
    `,
    orange: `
      bg-orange-600 text-white
      hover:bg-orange-700 active:bg-orange-800
      focus:ring-orange-500
    `,
    slate: `
      bg-slate-600 text-white
      hover:bg-slate-700 active:bg-slate-800
      focus:ring-slate-500
    `,
    purple: `
      bg-purple-600 text-white
      hover:bg-purple-700 active:bg-purple-800
      focus:ring-purple-500
    `,
    teal: `
      bg-teal-600 text-white
      hover:bg-teal-700 active:bg-teal-800
      focus:ring-teal-500
    `
  }

  // ============================================
  // ESTILOS POR VARIANTE
  // ============================================
  const variantStyles = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-500
    `,
    secondary: `
      bg-slate-100 text-slate-700
      hover:bg-slate-200 active:bg-slate-300
      focus:ring-slate-400
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700 active:bg-red-800
      focus:ring-red-500
    `,
    success: `
      bg-green-600 text-white
      hover:bg-green-700 active:bg-green-800
      focus:ring-green-500
    `,
    ghost: `
      bg-transparent text-slate-700
      hover:bg-slate-100 active:bg-slate-200
      focus:ring-slate-400
    `,
    outline: `
      bg-transparent text-slate-700
      border-2 border-slate-300
      hover:bg-slate-50 active:bg-slate-100
      focus:ring-slate-400
    `,
    'outline-light': `
      bg-white text-slate-700
      border border-slate-200 shadow-sm
      hover:bg-slate-50 active:bg-slate-100
      focus:ring-slate-400
    `
  }

  // ============================================
  // TAMAÑO DEL ÍCONO
  // ============================================
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  // ============================================
  // DETERMINAR ESTILOS DE COLOR
  // ============================================
  const getColorStyles = () => {
    if (variant === 'outline' && color) {
      const outlineColorStyles = {
        blue: 'bg-transparent text-blue-600 border-2 border-blue-300 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-400',
        green: 'bg-transparent text-green-600 border-2 border-green-300 hover:bg-green-50 active:bg-green-100 focus:ring-green-400',
        red: 'bg-transparent text-red-600 border-2 border-red-300 hover:bg-red-50 active:bg-red-100 focus:ring-red-400',
        orange: 'bg-transparent text-orange-600 border-2 border-orange-300 hover:bg-orange-50 active:bg-orange-100 focus:ring-orange-400',
        slate: 'bg-transparent text-slate-600 border-2 border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400'
      }
      return outlineColorStyles[color] || variantStyles.outline
    }
    if (color && colorStyles[color]) {
      return colorStyles[color]
    }
    return variantStyles[variant]
  }

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
      {loading && (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      )}

      {!loading && icon && (
        React.isValidElement(icon)
          ? <span className={`${iconSizes[size]} inline-flex items-center justify-center flex-shrink-0`}>{icon}</span>
          : <span className={`${iconSizes[size]} inline-flex items-center justify-center flex-shrink-0`}>{React.createElement(icon, { className: iconSizes[size] })}</span>
      )}

      {children && <span>{children}</span>}
    </button>
  )
}

export default Button
