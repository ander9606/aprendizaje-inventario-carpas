// ============================================
// COMPONENTE: EMOJI PICKER
// Selector visual de emojis en cuadrícula
// ============================================

import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useEmojiPicker } from '../../hooks/useEmojiPicker'
import { EMOJI_CATEGORIES } from '../../constants/emojiCategories'

export default function EmojiPicker({
  open,
  onSelect,
  onClose,
  categories = EMOJI_CATEGORIES,
  title = 'Seleccionar emoji',
  searchable = true
}) {
  const {
    search,
    setSearch,
    filteredCategories,
    selectEmoji
  } = useEmojiPicker({
    open,
    categories,
    onSelect,
    onClose
  })

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white max-w-lg w-[90vw] max-h-[80vh] rounded-xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Búsqueda */}
        {searchable && (
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar categoría o emoji..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid de emojis */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {Object.entries(filteredCategories).map(([category, emojis]) => (
            <div key={category} className="mb-6 last:mb-0">
              <p className="text-sm font-medium text-slate-600 mb-2">{category}</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {emojis.map((emoji, idx) => (
                  <button
                    key={`${emoji}-${idx}`}
                    type="button"
                    onClick={() => selectEmoji(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl
                             rounded-lg transition-all hover:bg-blue-50 hover:scale-110
                             bg-slate-50"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredCategories).length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-lg mb-1">😕</p>
              <p className="text-sm">No se encontraron emojis</p>
              <p className="text-xs mt-1">Intenta con otro término</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200
                     text-slate-700 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
