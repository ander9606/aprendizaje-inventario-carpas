// ============================================
// COMPONENTE: CARD
// Tarjeta reutilizable con estructura modular
// ============================================

/**
 * Componente Card - Tarjeta contenedora
 * 
 * @param {string} variant - Variante: 'default' | 'outlined' | 'elevated'
 * @param {ReactNode} children - Contenido de la tarjeta
 * @param {function} onClick - Función al hacer click (opcional, hace la card clickeable)
 * @param {string} className - Clases CSS adicionales
 * 
 * @example
 * <Card variant="outlined">
 *   <Card.Header>
 *     <Card.Title>Mi Tarjeta</Card.Title>
 *   </Card.Header>
 *   <Card.Content>
 *     Contenido aquí
 *   </Card.Content>
 * </Card>
 */
export const Card = ({
  variant = 'default',
  children,
  onClick,
  className = '',
  ...props
}) => {
  
  // ============================================
  // ESTILOS BASE
  // ============================================
  const baseStyles = `
    bg-white rounded-lg
    transition-all duration-200
  `
  
  // ============================================
  // ESTILOS POR VARIANTE
  // ============================================
  const variantStyles = {
    default: 'border border-slate-200',
    outlined: 'border-2 border-slate-300',
    elevated: 'shadow-lg hover:shadow-xl'
  }
  
  // ============================================
  // ESTILOS SI ES CLICKEABLE
  // ============================================
  const clickableStyles = onClick
    ? 'cursor-pointer hover:shadow-md hover:border-blue-300'
    : ''
  
  const cardClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${clickableStyles}
    ${className}
  `
  
  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: CARD HEADER
// ============================================
/**
 * Card.Header - Encabezado de la tarjeta
 */
Card.Header = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-b border-slate-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: CARD TITLE
// ============================================
/**
 * Card.Title - Título de la tarjeta
 */
Card.Title = ({ children, className = '', ...props }) => {
  return (
    <h3
      className={`text-lg font-semibold text-slate-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

// ============================================
// SUB-COMPONENTE: CARD DESCRIPTION
// ============================================
/**
 * Card.Description - Descripción de la tarjeta
 */
Card.Description = ({ children, className = '', ...props }) => {
  return (
    <p
      className={`text-sm text-slate-600 mt-1 ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

// ============================================
// SUB-COMPONENTE: CARD CONTENT
// ============================================
/**
 * Card.Content - Contenido principal de la tarjeta
 */
Card.Content = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: CARD FOOTER
// ============================================
/**
 * Card.Footer - Pie de la tarjeta
 */
Card.Footer = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: CARD ACTIONS
// ============================================
/**
 * Card.Actions - Contenedor de acciones (botones)
 */
Card.Actions = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card