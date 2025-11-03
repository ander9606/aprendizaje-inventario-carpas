// ============================================
// COMPONENTE: MODAL
// Ventana emergente para formularios
// ============================================

import { X } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Componente Modal - Ventana emergente
 * 
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} title - Título del modal
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {boolean} showCloseButton - Mostrar botón de cerrar
 * @param {boolean} closeOnOverlay - Cerrar al hacer click fuera
 * @param {ReactNode} children - Contenido del modal
 * 
 * @example
 * <Modal isOpen={isOpen} onClose={closeModal} title="Nueva Categoría" size="md">
 *   <form>...</form>
 * </Modal>
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
  
  // ============================================
  // EFECTO: Bloquear scroll cuando modal está abierto
  // ============================================
  useEffect(() => {
    if (isOpen) {
      // Guardamos el scroll actual
      const scrollY = window.scrollY
      
      // Bloqueamos el scroll del body
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      
      // Cleanup: restaurar scroll al cerrar
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
  
  // ============================================
  // Si no está abierto, no renderizar nada
  // ============================================
  if (!isOpen) return null
  
  // ============================================
  // TAMAÑOS DEL MODAL
  // ============================================
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }
  
  // ============================================
  // HANDLER: Cerrar al hacer click en overlay
  // ============================================
  const handleOverlayClick = (e) => {
    // Solo cerrar si se hace click directamente en el overlay
    // (no en el contenido del modal)
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return (
    <>
      {/* ============================================
          OVERLAY - Fondo oscuro
          ============================================ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 
                   flex items-center justify-center p-4
                   animate-fadeIn"
        onClick={handleOverlayClick}
      >
        {/* ============================================
            CONTENEDOR DEL MODAL
            ============================================ */}
        <div
          className={`
            bg-white rounded-lg shadow-2xl
            w-full ${sizeStyles[size]}
            max-h-[90vh] flex flex-col
            animate-slideUp
            ${className}
          `}
        >
          {/* ============================================
              HEADER DEL MODAL
              ============================================ */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            {/* Título */}
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            
            {/* Botón de cerrar */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 
                         transition-colors p-1 rounded-lg
                         hover:bg-slate-100"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* ============================================
              CONTENIDO DEL MODAL (con scroll)
              ============================================ */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// SUB-COMPONENTE: MODAL FOOTER
// ============================================
/**
 * Modal.Footer - Pie del modal con botones
 */
Modal.Footer = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`
        px-6 py-4 border-t border-slate-200 
        bg-slate-50 rounded-b-lg
        flex items-center justify-end gap-3
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default Modal