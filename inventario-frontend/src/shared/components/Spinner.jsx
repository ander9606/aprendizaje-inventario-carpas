// ============================================
// COMPONENTE: SPINNER
// Indicador de carga animado
// ============================================

import { Loader2 } from 'lucide-react'

/**
 * Componente Spinner - Indicador de carga
 * 
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} color - Color del spinner (clase de Tailwind)
 * @param {string} text - Texto opcional debajo del spinner
 * @param {boolean} fullScreen - Si debe ocupar toda la pantalla
 * 
 * @example
 * <Spinner size="lg" text="Cargando datos..." />
 */
export const Spinner = ({
  size = 'md',
  color = 'text-blue-600',
  text = '',
  fullScreen = false,
  className = ''
}) => {
  
  // ============================================
  // TAMAÑOS DEL SPINNER
  // ============================================
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  
  // ============================================
  // CONTENEDOR BASE
  // ============================================
  const containerStyles = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50'
    : 'flex items-center justify-center'
  
  return (
    <div className={`${containerStyles} ${className}`}>
      <div className="flex flex-col items-center gap-3">
        {/* Spinner animado */}
        <Loader2 
          className={`${sizeStyles[size]} ${color} animate-spin`}
        />
        
        {/* Texto opcional */}
        {text && (
          <p className="text-slate-600 text-sm font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================
// VARIANTE: SPINNER INLINE
// Spinner pequeño para usar dentro de texto
// ============================================
export const SpinnerInline = ({ className = '' }) => {
  return (
    <Loader2 className={`w-4 h-4 text-blue-600 animate-spin inline ${className}`} />
  )
}

// ============================================
// VARIANTE: SPINNER DE PUNTOS
// Animación de 3 puntos (más sutil)
// ============================================
export const SpinnerDots = ({ className = '' }) => {
  return (
    <div className={`flex gap-1 ${className}`}>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export default Spinner