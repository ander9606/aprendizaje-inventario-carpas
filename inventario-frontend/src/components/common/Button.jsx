// ============================================
// COMPONENTE: BUTTON
// Botón reutilizable con variantes y estados
// ============================================

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
  // COMBINAMOS TODOS LOS ESTILOS
  // ============================================
  const buttonClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
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
        <span className={iconSizes[size]}>
          {icon}
        </span>
      )}
      
      {/* Texto del botón */}
      {children}
    </button>
  )
}

export default Button