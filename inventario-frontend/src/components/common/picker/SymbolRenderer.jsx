// ============================================
// COMPONENTE: SymbolRenderer
// Renderiza emojis o iconos (lucide) de forma segura
// ============================================

import { lazy, Suspense } from "react"

/**
 * Renderiza un símbolo (emoji o icono)
 *
 * @param {string} value - Emoji Unicode o nombre del icono (ej: "Truck")
 * @param {"emoji"|"icon"} [type] - Fuerza el tipo de render (opcional)
 * @param {string} className - Clases CSS adicionales
 * @param {number} size - Tamaño del icono (default 20)
 *
 * @example
 * <SymbolRenderer value="🎪" />
 * <SymbolRenderer value="Truck" />
 * <SymbolRenderer value="Truck" type="icon" />
 */
export default function SymbolRenderer({
  value,
  type,
  className = "",
  size = 20
}) {
  /* ==============================
     Fallback global
  ============================== */
  if (!value) {
    return <span className={className}>📦</span>
  }

  /* ==============================
     Detección de tipo
     - Emojis nunca empiezan por mayúscula
     - Iconos Lucide siempre empiezan por mayúscula
  ============================== */
  const isEmoji =
    type === "emoji" ||
    (!type && typeof value === "string" && !/^[A-Z]/.test(value))

  /* ==============================
     Render de emoji
  ============================== */
  if (isEmoji) {
    return <span className={className}>{value}</span>
  }

  /* ==============================
     Render de iconos (lazy load)
  ============================== */
  const LazyIcon = lazy(() =>
    import("lucide-react").then(mod => ({
      default: mod[value] || (() => <span className={className}>📦</span>)
    }))
  )

  return (
    <Suspense fallback={<span className={className}>📦</span>}>
      <LazyIcon className={className} size={size} />
    </Suspense>
  )
}
