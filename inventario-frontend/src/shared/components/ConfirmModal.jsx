// ============================================
// COMPONENTE: CONFIRM MODAL
// Reemplazo estilizado de window.confirm()
// ============================================

import { AlertTriangle, Trash2, LogOut, CheckCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Modal de confirmación estilizado
 *
 * @param {boolean} isOpen - Si el modal está visible
 * @param {function} onClose - Cerrar sin confirmar
 * @param {function} onConfirm - Acción al confirmar
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje descriptivo
 * @param {string} variant - 'warning' | 'danger' | 'info' | 'success'
 * @param {string} confirmText - Texto del botón confirmar
 * @param {string} cancelText - Texto del botón cancelar
 * @param {boolean} loading - Estado de carga del botón confirmar
 * @param {ReactNode} icon - Ícono personalizado (opcional)
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message = '',
  variant = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  icon: CustomIcon
}) {

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Bloquear scroll
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

  if (!isOpen) return null

  const variants = {
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      ring: 'ring-amber-100'
    },
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      ring: 'ring-red-100'
    },
    info: {
      icon: LogOut,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      ring: 'ring-blue-100'
    },
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      confirmBtn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      ring: 'ring-green-100'
    }
  }

  const v = variants[variant] || variants.warning
  const Icon = CustomIcon || v.icon

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">
        {/* Header con icono */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${v.iconBg} ring-8 ${v.ring} shrink-0`}>
              <Icon className={`w-6 h-6 ${v.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900">
                {title}
              </h3>
              {message && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Botones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center gap-2 ${v.confirmBtn}`}
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
