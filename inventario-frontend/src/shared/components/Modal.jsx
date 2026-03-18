// ============================================
// COMPONENTE: MODAL
// Ventana emergente - tablet-first responsive
// En tablet/mobile: full-screen (bottom sheet style)
// En desktop: centrado con max-width
// ============================================

import { X } from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Componente Modal - Ventana emergente tablet-first
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} title - Título del modal
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {boolean} showCloseButton - Mostrar botón de cerrar
 * @param {boolean} closeOnOverlay - Cerrar al hacer click fuera
 * @param {ReactNode} children - Contenido del modal
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  children,
  className = ''
}) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const contentRef = useRef(null)

  // ============================================
  // Detectar breakpoint
  // ============================================
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // ============================================
  // EFECTO: Bloquear scroll cuando modal está abierto
  // ============================================
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // ============================================
  // EFECTO: Cerrar con tecla Escape
  // ============================================
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // ============================================
  // TAMAÑOS DEL MODAL (solo desktop)
  // ============================================
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }

  // ============================================
  // MOBILE/TABLET: Full-screen modal
  // ============================================
  if (!isDesktop) {
    return (
      <div
        className="fixed inset-0 z-50 bg-white flex flex-col animate-slideUpSheet safe-area-top safe-area-bottom"
      >
        {/* Header fijo */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[56px]">
          <h2 className="text-lg font-bold text-slate-900 truncate pr-2">
            {title}
          </h2>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl
                         text-slate-500 hover:text-slate-700 active:bg-slate-100
                         transition-colors flex-shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Contenido scrollable */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto touch-scroll px-4 py-4"
        >
          {children}
        </div>
      </div>
    )
  }

  // ============================================
  // DESKTOP: Modal centrado tradicional
  // ============================================
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50
                 flex items-center justify-center p-4
                 animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-white rounded-xl shadow-2xl
          w-full ${sizeStyles[size]}
          max-h-[90vh] flex flex-col
          animate-slideUp
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {title}
          </h2>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600
                       transition-colors p-2 rounded-xl
                       hover:bg-slate-100 active:bg-slate-200"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Contenido (con scroll) */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: MODAL FOOTER
// ============================================
Modal.Footer = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`
        px-4 py-4 lg:px-6 border-t border-slate-200
        bg-slate-50 lg:rounded-b-xl
        flex items-center justify-end gap-3
        safe-area-bottom
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default Modal
