// ============================================
// COMPONENTE: DROPDOWN MENU
// Menu desplegable reutilizable con iconos
// ============================================

import { MoreVertical } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente DropdownMenu - Menu contextual reutilizable
 *
 * @param {array} options - Opciones: [{ label, icon, onClick, show, danger }]
 * @param {string} triggerClassName - Clases del boton trigger
 * @param {string} menuClassName - Clases del dropdown (ej: 'w-48' vs 'w-56')
 * @param {string} iconSize - Tamano del icono (default: 'w-4 h-4')
 *
 * @example
 * <DropdownMenu
 *   options={[
 *     { label: 'Editar', icon: Edit2, onClick: handleEdit },
 *     { label: 'Eliminar', icon: Trash2, onClick: handleDelete, danger: true }
 *   ]}
 * />
 */
const DropdownMenu = ({
  options = [],
  triggerClassName = '',
  menuClassName = 'w-48',
  iconSize = 'w-4 h-4'
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const visibleOptions = options.filter(opt => opt.show !== false)

  if (visibleOptions.length === 0) return null

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen(!menuOpen)
        }}
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center
                   hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors ${triggerClassName}`}
        aria-label="Opciones"
      >
        <MoreVertical className={`${iconSize} text-slate-600`} />
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className={`absolute right-0 mt-2 ${menuClassName} bg-white shadow-xl rounded-xl border border-slate-200 py-1.5 z-50`}>
            {visibleOptions.map((option, idx) => {
              const IconComp = option.icon
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    option.onClick()
                  }}
                  className={`
                    w-full text-left px-4 py-3 text-sm min-h-[44px]
                    flex items-center gap-2.5
                    transition-colors
                    ${option.danger
                      ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                      : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }
                  `}
                >
                  {IconComp && <IconComp className={iconSize} />}
                  {option.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default DropdownMenu
