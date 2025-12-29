import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useEmojiPicker } from '../../hooks/useEmojiPicker'

const DEFAULT_CATEGORIES = {
  objetos: ['📦', '📌', '📎'],
  personas: ['👤', '👷', '🧑‍💼'],
  tiempo: ['⏰', '📅'],
  ubicacion: ['📍', '🗺️'],
  eventos: ['🎉', '🎪'],
  seguridad: ['⚠️', '🦺']
}

export default function EmojiPicker({
  open,
  onSelect,
  onClose,
  categories = DEFAULT_CATEGORIES,
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white max-w-lg w-full rounded-xl p-4">

        <div className="flex justify-between mb-3">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {searchable && (
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar emoji..."
            className="w-full mb-3 border px-2 py-1 rounded"
          />
        )}

        <div className="max-h-64 overflow-y-auto">
          {Object.entries(filteredCategories).map(([cat, emojis]) => (
            <div key={cat}>
              <p className="text-xs text-gray-500 uppercase">{cat}</p>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map(e => (
                  <button key={e} onClick={() => selectEmoji(e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>,
    document.body
  )
}
