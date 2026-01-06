import { useState, useEffect } from "react"
import Modal from "../Modal"
import EmojiPicker from "./Emojipicker"
import IconPicker from "./IconPicker"
import { Smile, Shapes } from "lucide-react"

export default function SymbolPicker({
  open,
  value,
  onSelect,
  onClose
}) {
  const [tab, setTab] = useState("emoji")

  // Reset al abrir
  useEffect(() => {
    if (open) setTab("emoji")
  }, [open])

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Seleccionar icono"
      size="lg"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setTab("emoji")
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium flex gap-2 items-center justify-center
            ${tab === "emoji"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-slate-500 hover:text-slate-700"}
          `}
        >
          <Smile size={18} className="pointer-events-none" /> Emojis
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setTab("icon")
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium flex gap-2 items-center justify-center
            ${tab === "icon"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-slate-500 hover:text-slate-700"}
          `}
        >
          <Shapes size={18} className="pointer-events-none" /> Iconos
        </button>
      </div>

      {/* Contenido */}
      <div className="max-h-[55vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {tab === "emoji" && (
          <EmojiPicker
            value={value}
            onSelect={(emoji) => {
              onSelect(emoji)
              onClose()
            }}
          />
        )}

        {tab === "icon" && (
          <IconPicker
            onSelect={(icon) => {
              onSelect(icon)
              onClose()
            }}
          />
        )}
      </div>
    </Modal>
  )
}
