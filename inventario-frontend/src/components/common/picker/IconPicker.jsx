import * as LucideIcons from "lucide-react"
import { DEFAULT_ICONOS } from "../../../constants/lucidIcons"

export default function IconPicker({ onSelect }) {
  return (
    <div className="space-y-5">
      {Object.entries(DEFAULT_ICONOS).map(([categoria, icons]) => (
        <div key={categoria}>
          <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            {categoria}
          </h4>

          <div className="grid grid-cols-6 gap-3">
            {icons.map((iconName) => {
              const Icon = LucideIcons[iconName]
              if (!Icon) return null

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onSelect(iconName)
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100
                             flex items-center justify-center transition"
                  title={iconName}
                >
                  <Icon size={26} className="pointer-events-none" />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
