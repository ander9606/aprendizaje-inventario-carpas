// ============================================
// COMPONENTE: EMPTY STATE
// Mensaje cuando no hay datos
// ============================================

import { PackageX, Search, Inbox } from 'lucide-react'
import Button from './Button'

/**
 * Componente EmptyState - Estado vacío
 * 
 * @param {string} type - Tipo de estado: 'no-data' | 'no-results' | 'empty'
 * @param {string} title - Título del mensaje
 * @param {string} description - Descripción del mensaje
 * @param {ReactNode} icon - Ícono personalizado (opcional)
 * @param {object} action - Acción opcional: { label, onClick, icon }
 * 
 * @example
 * <EmptyState 
 *   type="no-data" 
 *   title="No hay categorías" 
 *   description="Crea tu primera categoría"
 *   action={{ label: "Crear categoría", onClick: handleCreate }}
 * />
 */
function EmptyState({
  type = 'no-data',
  title,
  description,
  icon: CustomIcon = null,
  action = null,
  className = ''
}) {
  
  // ============================================
  // ÍCONOS POR TIPO
  // ============================================
  const icons = {
    'no-data': Inbox,
    'no-results': Search,
    'empty': PackageX
  }
  
  // ============================================
  // TEXTOS POR DEFECTO SEGÚN TIPO
  // ============================================
  const defaults = {
    'no-data': {
      title: 'No hay datos disponibles',
      description: 'Aún no se han agregado elementos'
    },
    'no-results': {
      title: 'No se encontraron resultados',
      description: 'Intenta con otros términos de búsqueda'
    },
    'empty': {
      title: 'Sin elementos',
      description: 'Esta sección está vacía'
    }
  }
  
  // Usar ícono personalizado o por defecto
  const Icon = CustomIcon || icons[type]
  
  // Usar textos proporcionados o por defecto
  const finalTitle = title || defaults[type].title
  const finalDescription = description || defaults[type].description
  
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Ícono */}
      <div className="mb-4 p-4 bg-slate-100 rounded-full">
        <Icon className="w-12 h-12 text-slate-400" />
      </div>
      
      {/* Título */}
      <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">
        {finalTitle}
      </h3>
      
      {/* Descripción */}
      <p className="text-slate-600 text-center max-w-md mb-6">
        {finalDescription}
      </p>
      
      {/* Acción (botón opcional) */}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          icon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState