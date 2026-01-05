import { Search, X } from "lucide-react"
import { useEmojiPicker } from "../../../hooks/useEmojiPicker"
import { EMOJI_CATEGORIES } from "../../../constants/emojiCategories"

// Re-exportar para compatibilidad
export { IconoCategoria } from "../IconoCategoria"

export default function EmojiPicker({
  value,
  onSelect,
  categories = EMOJI_CATEGORIES,
  searchable = true
}) {
  const {
    search,
    setSearch,
    filteredCategories,
    selectEmoji
  } = useEmojiPicker({
    open: true, // siempre activo, el modal lo controla SymbolPicker
    categories,
    onSelect
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Buscador */}
      {searchable && (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar emoji..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                           hover:bg-slate-100 rounded"
              >
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="overflow-y-auto max-h-[55vh] pr-1">
        {Object.entries(filteredCategories).map(([category, emojis]) => (
          <div key={category} className="mb-5 last:mb-0">
            <p className="text-xs font-medium text-slate-500 mb-2">
              {category}
            </p>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
              {emojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => selectEmoji(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-2xl
                    rounded-lg transition
                    ${value === emoji
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "bg-slate-50 hover:bg-blue-50 hover:scale-110"}
                  `}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p className="text-lg mb-1">😕</p>
            <p className="text-sm">No se encontraron emojis</p>
          </div>
        )}
      </div>
    </div>
  )
}
