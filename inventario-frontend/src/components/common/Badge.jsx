// ============================================
// COMPONENTE: BADGE
// Etiqueta para mostrar estados
// ============================================

/**
 * Componente Badge - Etiqueta de estado
 * 
 * @param {string} variant - Variante de color: 'success' | 'info' | 'warning' | 'danger' | 'neutral'
 * @param {ReactNode} icon - Ícono opcional
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {ReactNode} children - Texto del badge
 * 
 * @example
 * <Badge variant="success" icon={<CheckCircle />}>
 *   Disponible
 * </Badge>
 */
export const Badge = ({
  variant = 'neutral',
  icon = null,
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  
  // ============================================
  // ESTILOS BASE
  // ============================================
  const baseStyles = `
    inline-flex items-center
    font-medium rounded-full
    transition-colors duration-200
  `
  
  // ============================================
  // ESTILOS POR TAMAÑO
  // ============================================
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  }
  
  // ============================================
  // ESTILOS POR VARIANTE (colores)
  // ============================================
  const variantStyles = {
    success: 'bg-green-100 text-green-700 border border-green-200',
    info: 'bg-blue-100 text-blue-700 border border-blue-200',
    warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    purple: 'bg-purple-100 text-purple-700 border border-purple-200'
  }
  
  // ============================================
  // TAMAÑO DEL ÍCONO
  // ============================================
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const badgeClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `
  
  return (
    <span className={badgeClasses} {...props}>
      {/* Ícono (si se proporciona) */}
      {icon && (
        <span className={iconSizes[size]}>
          {icon}
        </span>
      )}
      
      {/* Texto */}
      {children}
    </span>
  )
}

// ============================================
// VARIANTE: BADGE CON PUNTO
// Badge con un punto de color a la izquierda
// ============================================
export const BadgeWithDot = ({
  variant = 'neutral',
  children,
  className = '',
  ...props
}) => {
  
  // Colores del punto según la variante
  const dotColors = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    neutral: 'bg-slate-500',
    purple: 'bg-purple-500'
  }
  
  return (
    <Badge variant={variant} className={className} {...props}>
      <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} />
      {children}
    </Badge>
  )
}

export default Badge