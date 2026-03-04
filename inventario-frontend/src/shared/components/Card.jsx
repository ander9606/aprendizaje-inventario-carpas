// ============================================
// COMPONENTE: CARD
// Tarjeta reutilizable con estructura modular
// ============================================

import { useState } from 'react'
import { MoreVertical } from 'lucide-react'

/**
 * Componente Card - Tarjeta contenedora
 *
 * @param {string} variant - Variante: 'default' | 'outlined' | 'elevated'
 * @param {ReactNode} children - Contenido de la tarjeta
 * @param {function} onClick - Función al hacer click (opcional, hace la card clickeable)
 * @param {string} title - Título del header (opcional)
 * @param {string} subtitle - Subtítulo del header (opcional)
 * @param {string} icon - Emoji/ícono del header (opcional)
 * @param {array} menuOptions - Opciones del menú: [{ label, onClick, danger }]
 * @param {string} className - Clases CSS adicionales
 *
 * @example
 * <Card
 *   variant="outlined"
 *   title="Carpa Doite"
 *   subtitle="Gestión por series"
 *   icon="🏕️"
 *   menuOptions={[
 *     { label: 'Editar', onClick: handleEdit },
 *     { label: 'Eliminar', onClick: handleDelete, danger: true }
 *   ]}
 * >
 *   <Card.Content>
 *     Contenido aquí
 *   </Card.Content>
 * </Card>
 */
export const Card = ({
  variant = 'default',
  children,
  onClick,
  title,
  subtitle,
  icon,
  menuOptions = [],
  className = '',
  ...props
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  
  // ============================================
  // ESTILOS BASE
  // ============================================
  const baseStyles = `
    bg-white rounded-lg relative overflow-visible
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
      {/* Header con título, subtítulo, ícono y menú (si se proporciona) */}
      {(title || menuOptions.length > 0) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          {/* Sección izquierda: ícono + título */}
          <div className="flex items-center gap-3 flex-1">
            {icon && (
              <span className="text-2xl flex-shrink-0">
                {icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-slate-600 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Menú de opciones (si existe) */}
          {menuOptions.length > 0 && (
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation() // Evitar que se active el onClick del Card
                  setMenuOpen(!menuOpen)
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Opciones"
              >
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>

              {/* Dropdown del menú */}
              {menuOpen && (
                <>
                  {/* Overlay para cerrar el menú */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />

                  {/* Menú flotante */}
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-slate-200 py-2 z-20">
                    {menuOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(false)
                          option.onClick()
                        }}
                        className={`
                          w-full text-left px-4 py-2 text-sm
                          transition-colors
                          ${option.danger
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-slate-700 hover:bg-slate-50'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenido de la card */}
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