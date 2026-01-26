// ============================================
// COMPONENTE: CategoriaCardSelector
// Tarjeta de categoría para selector de productos
// ============================================

import { Package } from 'lucide-react'
import { IconoCategoria } from '../common/IconoCategoria'

const CategoriaCardSelector = ({
  categoria,
  onClick,
  disabled = false
}) => {
  const { nombre, emoji, total_productos } = categoria

  return (
    <button
      type="button"
      onClick={() => !disabled && onClick?.(categoria)}
      disabled={disabled}
      className={`
        w-full p-4 rounded-xl border-2 transition-all duration-200
        text-left flex flex-col items-center gap-3
        ${disabled
          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
          : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer'
        }
      `}
    >
      {/* Icono/Emoji */}
      <div className="w-16 h-16 flex items-center justify-center bg-slate-100 rounded-xl">
        <IconoCategoria
          value={emoji || '📦'}
          className="text-4xl"
          size={40}
        />
      </div>

      {/* Nombre */}
      <h4 className="font-semibold text-slate-800 text-center">
        {nombre}
      </h4>

      {/* Contador de productos */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <Package className="w-4 h-4" />
        <span>{total_productos} producto{total_productos !== 1 ? 's' : ''}</span>
      </div>
    </button>
  )
}

export default CategoriaCardSelector
