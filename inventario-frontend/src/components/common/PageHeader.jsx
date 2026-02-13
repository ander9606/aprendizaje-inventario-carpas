// ============================================
// COMPONENTE: PageHeader
// Header reutilizable para páginas del sistema
// ============================================

import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * PageHeader - Header estandarizado para páginas
 *
 * @param {object} props
 * @param {React.ComponentType} props.icon - Icono de lucide-react
 * @param {string} props.iconColor - Color de fondo del icono (ej: 'bg-blue-500')
 * @param {string} props.title - Título principal
 * @param {string} props.subtitle - Subtítulo descriptivo
 * @param {string} [props.backTo] - Ruta para botón "Volver"
 * @param {string} [props.backLabel] - Texto del botón "Volver" (default: 'Volver')
 * @param {React.ReactNode} [props.actions] - Contenido extra a la derecha (botones, etc.)
 *
 * @example
 * <PageHeader
 *   icon={Settings}
 *   iconColor="bg-slate-500"
 *   title="Configuración"
 *   subtitle="Gestiona los datos maestros"
 *   backTo="/"
 *   backLabel="Volver a Módulos"
 * />
 */
const PageHeader = ({ icon: Icon, iconColor = 'bg-slate-500', title, subtitle, backTo, backLabel = 'Volver', actions }) => {
  const navigate = useNavigate()

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${iconColor} flex items-center justify-center shadow-sm`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageHeader
