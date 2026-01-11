// ============================================
// COMPONENTE: DialogModal
// Modal de confirmación estilizado
// Reemplaza window.confirm() con mejor UX
// ============================================

import { useEffect } from 'react'
import { AlertTriangle, Trash2, Info, CheckCircle, X } from 'lucide-react'

/**
 * Componente DialogModal - Diálogo de confirmación
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {string} tipo - Tipo: 'danger' | 'warning' | 'info' | 'success'
 * @param {string} titulo - Título del diálogo
 * @param {string} mensaje - Mensaje descriptivo
 * @param {string} textoConfirmar - Texto del botón confirmar
 * @param {string} textoCancelar - Texto del botón cancelar
 * @param {function} onConfirm - Callback al confirmar
 * @param {function} onCancel - Callback al cancelar
 */
export default function DialogModal({
  isOpen,
  onClose,
  tipo = 'warning',
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  // ============================================
  // EFECTO: Bloquear scroll cuando está abierto
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
        onCancel?.()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  // ============================================
  // CONFIGURACIÓN POR TIPO
  // ============================================
  const tipoConfig = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      buttonText: 'text-white',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      buttonText: 'text-white',
    },
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: 'text-white',
    },
  }

  const config = tipoConfig[tipo] || tipoConfig.warning
  const IconComponent = config.icon

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[100]
                 flex items-center justify-center p-4
                 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel?.()
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md
                   animate-slideUp"
      >
        {/* Header con icono */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icono */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full
                         flex items-center justify-center
                         ${config.iconBg}`}
            >
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>

            {/* Contenido */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {titulo}
              </h3>
              {mensaje && (
                <p className="mt-2 text-sm text-slate-600">{mensaje}</p>
              )}
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onCancel}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600
                       transition-colors p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700
                     bg-white border border-slate-300 rounded-lg
                     hover:bg-slate-50 transition-colors"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg
                       transition-colors ${config.buttonBg} ${config.buttonText}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
