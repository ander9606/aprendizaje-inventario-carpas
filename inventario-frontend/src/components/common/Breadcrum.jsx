// ============================================
// COMPONENTE: BREADCRUMB
// Navegación de migas de pan (Inicio > Categoría > Subcategoría)
// ============================================

import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * ¿QUÉ ES UN BREADCRUMB?
 * 
 * Es la navegación tipo "migas de pan" que muestra dónde está el usuario:
 * 
 * Ejemplo visual:
 * 🏠 Inicio > 📦 Carpas > 🏕️ Carpa 3x3
 * 
 * Permite al usuario:
 * - Saber en qué nivel está
 * - Volver atrás haciendo click en niveles anteriores
 * - Entender la jerarquía del sistema
 */

/**
 * COMPONENTE: Breadcrumb
 * 
 * @param {Array} items - Array de objetos con la ruta de navegación
 * 
 * Formato de items:
 * [
 *   { label: 'Inicio', path: '/', icon: <Home /> },
 *   { label: 'Carpas', path: '/categorias/1', icon: '🏕️' },
 *   { label: 'Carpa 3x3', path: '/elementos/5' }
 * ]
 * 
 * @example
 * <Breadcrumb items={[
 *   { label: 'Inicio', path: '/' },
 *   { label: 'Carpas', path: '/categorias/1' }
 * ]} />
 */
const Breadcrumb = ({ items = [] }) => {
  
  // Si no hay items, no mostrar nada
  if (!items || items.length === 0) {
    return null
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {/* ============================================
          MAPEAR CADA ITEM DEL BREADCRUMB
          ============================================ */}
      {items.map((item, index) => {
        // Determinar si es el último item (actual)
        const isLast = index === items.length - 1
        
        return (
          <div key={index} className="flex items-center space-x-2">
            {/* ============================================
                LINK O TEXTO (según si es el último)
                ============================================ */}
            {isLast ? (
              // Si es el último item, solo mostrar texto (no es clickeable)
              <span className="flex items-center gap-2 text-slate-900 font-semibold">
                {/* Icono si existe */}
                {item.icon && (
                  typeof item.icon === 'string' ? (
                    <span className="text-lg">{item.icon}</span>
                  ) : (
                    item.icon
                  )
                )}
                {item.label}
              </span>
            ) : (
              // Si NO es el último, mostrar como link
              <Link
                to={item.path}
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                {/* Icono si existe */}
                {item.icon && (
                  typeof item.icon === 'string' ? (
                    <span className="text-lg">{item.icon}</span>
                  ) : (
                    item.icon
                  )
                )}
                {item.label}
              </Link>
            )}
            
            {/* ============================================
                SEPARADOR (chevron) - No mostrar en el último
                ============================================ */}
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Breadcrumb