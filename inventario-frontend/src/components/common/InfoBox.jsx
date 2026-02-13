// ============================================
// COMPONENTE: InfoBox
// Caja informativa/nota reutilizable
// ============================================

import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

/**
 * InfoBox - Caja de información/nota con diferentes variantes
 *
 * @param {object} props
 * @param {'info'|'warning'|'success'|'error'} [props.variant='info'] - Variante de color
 * @param {React.ReactNode} props.children - Contenido
 *
 * @example
 * <InfoBox variant="warning">
 *   <strong>Flujo recomendado:</strong> Primero crea las ciudades...
 * </InfoBox>
 */
const InfoBox = ({ variant = 'info', children }) => {
  const styles = {
    info: {
      box: 'bg-blue-50 border-blue-200 text-blue-700',
      icon: Info
    },
    warning: {
      box: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle
    },
    success: {
      box: 'bg-green-50 border-green-200 text-green-700',
      icon: CheckCircle
    },
    error: {
      box: 'bg-red-50 border-red-200 text-red-700',
      icon: XCircle
    }
  }

  const { box, icon: IconComp } = styles[variant] || styles.info

  return (
    <div className={`p-4 border rounded-xl flex items-start gap-3 ${box}`}>
      <IconComp className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
      <div className="text-sm">{children}</div>
    </div>
  )
}

export default InfoBox
