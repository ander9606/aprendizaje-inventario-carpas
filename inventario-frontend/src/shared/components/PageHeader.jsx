// ============================================
// COMPONENTE: PageHeader
// Header reutilizable - tablet-first responsive
// ============================================

import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * PageHeader - Header estandarizado para páginas
 *
 * @param {React.ComponentType} props.icon - Icono de lucide-react
 * @param {string} props.iconColor - Color de fondo del icono
 * @param {string} props.title - Título principal
 * @param {string} props.subtitle - Subtítulo descriptivo
 * @param {string} [props.backTo] - Ruta para botón "Volver"
 * @param {string} [props.backLabel] - Texto del botón "Volver"
 * @param {React.ReactNode} [props.actions] - Contenido extra (botones)
 */
const PageHeader = ({ icon: Icon, iconColor = 'bg-slate-500', title, subtitle, backTo, backLabel = 'Volver', actions }) => {
  const navigate = useNavigate()

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 active:text-slate-900
                       mb-3 transition-colors text-sm px-1 py-1.5 -ml-1 rounded-lg
                       min-h-[36px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${iconColor} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-500 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageHeader
