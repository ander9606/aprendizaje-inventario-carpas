// ============================================
// COMPONENTE: IconoCategoria
// Renderiza un emoji como icono de categoría
// ============================================

/**
 * Componente que renderiza un emoji como icono
 *
 * @param {string} value - El emoji a mostrar
 * @param {string} className - Clases CSS adicionales
 * @param {number} size - Tamaño del emoji (para compatibilidad)
 *
 * @example
 * <IconoCategoria value="🎪" className="text-4xl" />
 */
export function IconoCategoria({ value, className = '', size }) {
  // Si no hay valor, mostrar emoji por defecto
  if (!value) {
    return <span className={className}>📦</span>
  }

  // Renderizar el emoji
  return <span className={className}>{value}</span>
}

export default IconoCategoria
