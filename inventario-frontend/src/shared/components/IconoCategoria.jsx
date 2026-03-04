// ============================================
// COMPONENTE: IconoCategoria
// Renderiza un símbolo de categoría (emoji o icono)
// ============================================

import SymbolRenderer from "./picker/SymbolRenderer";

/**
 * Componente que renderiza un emoji o icono como icono de categoría
 *
 * @param {string} value - Emoji o nombre del icono
 * @param {string} className - Clases CSS adicionales
 * @param {number} size - Tamaño del icono
 *
 * @example
 * <IconoCategoria value="🎪" />
 * <IconoCategoria value="Truck" />
 */
export function IconoCategoria({
  value,
  className = "",
  size = 20
}) {
  return (
    <SymbolRenderer
      value={value}
      className={className}
      size={size}
    />
  )
}

export default IconoCategoria
