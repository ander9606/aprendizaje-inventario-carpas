// ============================================
// COMPONENTE: BREADCRUMB
// Navegación de migas de pan (Inicio > Categoría > Subcategoría)
// ============================================

import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import SymbolRenderer from './picker/SymbolRenderer'

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
 * @param {string} className - Clases adicionales para el nav
 *
 * Formato de items:
 * [
 *   { label: 'Inicio', path: '/', icon: '🏠' },           // Con path (usa Link)
 *   { label: 'Carpas', onClick: () => {}, icon: '🏕️' },   // Con onClick (usa button)
 *   { label: 'Carpa 3x3' }                                 // Sin path ni onClick (último item)
 * ]
 *
 * Soporta:
 * - path: Usa React Router Link
 * - onClick: Usa un botón clickeable
 * - Sin ambos: Muestra como texto (último item de la ruta)
 *
 * @example
 * // Con rutas (path)
 * <Breadcrumb items={[
 *   { label: 'Inicio', path: '/' },
 *   { label: 'Carpas', path: '/categorias/1' }
 * ]} />
 *
 * @example
 * // Con callbacks (onClick)
 * <Breadcrumb items={[
 *   { label: 'Productos', onClick: () => setNivel(0) },
 *   { label: 'Carpas', onClick: () => setNivel(1) },
 *   { label: 'P10' }
 * ]} />
 */
const Breadcrumb = ({ items = [], className = '' }) => {

  // Si no hay items, no mostrar nada
  if (!items || items.length === 0) {
    return null
  }

  // Renderiza el icono si existe (soporta emojis y nombres de iconos Lucide)
  const renderIcon = (icon) => {
    if (!icon) return null

    // Si es un componente React (ReactNode), renderizarlo directamente
    if (typeof icon !== 'string') {
      return icon
    }

    // Si es string, usar SymbolRenderer que soporta emojis e iconos
    return <SymbolRenderer value={icon} size={16} className="text-lg" />
  }

  return (
    <nav className={`flex items-center flex-wrap gap-y-1 text-sm ${className}`}>
      {/* ============================================
          MAPEAR CADA ITEM DEL BREADCRUMB
          ============================================ */}
      {items.map((item, index) => {
        // Determinar si es el último item (actual)
        const isLast = index === items.length - 1

        // Contenido común del item (icono + label)
        const itemContent = (
          <>
            {renderIcon(item.icon)}
            {item.label}
          </>
        )

        return (
          <div key={index} className="flex items-center gap-2">
            {/* ============================================
                RENDERIZADO SEGÚN TIPO DE NAVEGACIÓN
                ============================================ */}
            {isLast ? (
              // ÚLTIMO ITEM: Solo texto, no es clickeable
              <span className="flex items-center gap-2 text-slate-900 font-semibold">
                {itemContent}
              </span>
            ) : item.path ? (
              // CON PATH: Usar React Router Link
              <Link
                to={item.path}
                className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {itemContent}
              </Link>
            ) : item.onClick ? (
              // CON ONCLICK: Usar button
              <button
                type="button"
                onClick={item.onClick}
                className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                {itemContent}
              </button>
            ) : (
              // SIN NAVEGACIÓN: Solo texto
              <span className="flex items-center gap-2 text-slate-600">
                {itemContent}
              </span>
            )}

            {/* ============================================
                SEPARADOR (chevron) - No mostrar en el último
                ============================================ */}
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
