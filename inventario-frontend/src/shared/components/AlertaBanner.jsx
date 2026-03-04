// ============================================
// COMPONENTE: ALERTA BANNER
// Banner de alerta con información destacada
// ============================================

import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente AlertaBanner - Banner de alerta
 *
 * @param {string} tipo - Tipo: 'success' | 'info' | 'warning' | 'error'
 * @param {string} mensaje - Mensaje principal
 * @param {object} detalles - Objeto con detalles adicionales (opcional)
 * @param {boolean} dismissible - Permite cerrar el banner
 * @param {function} onDismiss - Callback al cerrar
 * @param {ReactNode} action - Botón de acción (opcional)
 *
 * @example
 * <AlertaBanner
 *   tipo="warning"
 *   mensaje="Devolución HOY"
 *   detalles={{
 *     cliente: "Juan Pérez",
 *     telefono: "300-123-4567",
 *     fecha: "2024-01-15"
 *   }}
 *   dismissible
 * />
 */
export const AlertaBanner = ({
  tipo = 'info',
  mensaje,
  detalles = null,
  dismissible = false,
  onDismiss,
  action = null,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true)

  // ============================================
  // ESTILOS POR TIPO
  // ============================================
  const tipoStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600'
    }
  }

  const styles = tipoStyles[tipo]
  const IconComponent = styles.icon

  // ============================================
  // HANDLER: Cerrar banner
  // ============================================
  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  // Si está oculto, no renderizar
  if (!isVisible) return null

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border-l-4 rounded-lg p-4
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Ícono */}
        <IconComponent className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Mensaje principal */}
          <p className="font-semibold mb-1">
            {mensaje}
          </p>

          {/* Detalles (si existen) */}
          {detalles && (
            <div className="text-sm space-y-0.5 mt-2">
              {Object.entries(detalles).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-medium capitalize">
                    {key}:
                  </span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Acción (botón opcional) */}
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>

        {/* Botón de cerrar */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              ${styles.iconColor}
              hover:opacity-70
              transition-opacity
              flex-shrink-0
              p-1
              rounded
              hover:bg-black hover:bg-opacity-5
            `}
            aria-label="Cerrar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default AlertaBanner
