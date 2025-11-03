// ============================================
// COMPONENTE: EMOJI PICKER
// Selector visual de emojis en cuadrícula
// ============================================

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'

/**
 * ¿QUÉ HACE ESTE COMPONENTE?
 * 
 * EmojiPicker es un selector visual de emojis que permite al usuario
 * elegir un emoji haciendo clic en él en lugar de tener que escribirlo.
 * 
 * CARACTERÍSTICAS:
 * - Muestra emojis organizados por categorías
 * - Buscador para filtrar emojis
 * - Responsive (se adapta a móvil y desktop)
 * - Se puede cerrar haciendo clic fuera
 * - Muestra el emoji seleccionado actualmente
 */

/**
 * EMOJIS ORGANIZADOS POR CATEGORÍA
 * 
 * Aquí definimos todos los emojis disponibles agrupados por categorías
 * que tienen sentido para un sistema de inventario.
 */
const EMOJI_CATEGORIES = {
  'Herramientas': [
    '🔨', '🔧', '🪛', '⚒️', '🛠️', '⚙️', '🔩', '⛏️', 
    '🪚', '🪓', '🔪', '⛓️', '🪝', '📏', '📐', '✂️'
  ],
  'Construcción': [
    '🏗️', '🧱', '🪜', '🏠', '🏢', '🏭', '🏛️', '⚡',
    '🪟', '🚪', '🔦', '💡', '🕯️', '🧯', '🪣', '🧹'
  ],
  'Vehículos': [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
    '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦽', '🦼'
  ],
  'Oficina': [
    '💼', '📁', '📂', '🗂️', '📋', '📊', '📈', '📉',
    '🗃️', '📇', '📌', '📍', '✏️', '✒️', '🖊️', '🖍️'
  ],
  'Electrónicos': [
    '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📱', '☎️', '📞',
    '📟', '📠', '📡', '🔌', '🔋', '🪫', '💾', '💿'
  ],
  'Paquetes': [
    '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '📤',
    '📥', '🎁', '🛍️', '🎒', '👜', '🧳', '💼', '🎀'
  ],
  'Diversos': [
    '⭐', '✨', '💫', '🔥', '💧', '🌊', '🎯', '🎨',
    '🎭', '🎪', '🎡', '🎢', '🎰', '🧩', '🎮', '🎲'
  ]
}

/**
 * COMPONENTE PRINCIPAL: EmojiPicker
 * 
 * @param {string} selectedEmoji - Emoji actualmente seleccionado
 * @param {function} onSelect - Función que se ejecuta al seleccionar un emoji
 * @param {function} onClose - Función para cerrar el picker
 * 
 * @example
 * <EmojiPicker 
 *   selectedEmoji="📦"
 *   onSelect={(emoji) => setValue('icono', emoji)}
 *   onClose={() => setShowPicker(false)}
 * />
 */
const EmojiPicker = ({ selectedEmoji, onSelect, onClose }) => {
  
  // Log de debug
  console.log('🎨 EmojiPicker montado')
  console.log('📦 Props:', { selectedEmoji, hasOnSelect: !!onSelect, hasOnClose: !!onClose })
  
  // ============================================
  // ESTADO: Búsqueda
  // ============================================
  const [searchTerm, setSearchTerm] = useState('')
  
  // ============================================
  // FUNCIÓN: Filtrar emojis por búsqueda
  // ============================================
  /**
   * Esta función filtra las categorías de emojis basándose en el término de búsqueda
   * 
   * ¿CÓMO FUNCIONA?
   * 1. Si no hay búsqueda, devuelve todas las categorías
   * 2. Si hay búsqueda, filtra las categorías que contengan el término
   * 3. Devuelve un objeto con solo las categorías que coinciden
   */
  const filteredCategories = searchTerm
    ? Object.entries(EMOJI_CATEGORIES).reduce((acc, [category, emojis]) => {
        // Filtramos si el nombre de la categoría contiene el término de búsqueda
        if (category.toLowerCase().includes(searchTerm.toLowerCase())) {
          acc[category] = emojis
        }
        return acc
      }, {})
    : EMOJI_CATEGORIES
  
  // ============================================
  // HANDLER: Seleccionar emoji
  // ============================================
  /**
   * Cuando el usuario hace clic en un emoji:
   * 1. Ejecutamos la función onSelect con el emoji
   * 2. Cerramos el picker automáticamente
   */
  const handleSelectEmoji = (emoji) => {
    console.log('✨ Emoji seleccionado:', emoji)
    onSelect(emoji)
    console.log('📞 Llamando a onClose()')
    onClose()
  }
  
  // ============================================
  // RENDER: UI del componente
  // IMPORTANTE: Usamos Portal para renderizar fuera del Modal
  // ============================================
  const pickerContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 
        OVERLAY (fondo oscuro)
        - Cubre toda la pantalla
        - Al hacer clic, cierra el picker
        - z-index muy alto para estar sobre el Modal
      */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          console.log('🖱️ Clic en overlay del EmojiPicker')
          onClose()
        }}
      />
      
      {/* 
        CONTENEDOR DEL PICKER
        - Se muestra sobre el overlay
        - Tiene scroll interno si hay muchos emojis
      */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] max-w-md max-h-[80vh] flex flex-col">
        
        {/* ============================================
            HEADER: Título y botón de cerrar
            ============================================ */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Selecciona un emoji
          </h3>
          
          {/* Botón de cerrar (X) */}
          <button
            onClick={() => {
              console.log('🖱️ Clic en botón X del EmojiPicker')
              onClose()
            }}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* ============================================
            BARRA DE BÚSQUEDA
            ============================================ */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="relative">
            {/* Icono de búsqueda */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            
            {/* Input de búsqueda */}
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Botón para limpiar búsqueda (solo aparece si hay texto) */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 
                         hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* ============================================
            CONTENEDOR DE EMOJIS (con scroll)
            ============================================ */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* 
            EXPLICACIÓN DEL CÓDIGO SIGUIENTE:
            
            Object.entries() convierte el objeto de categorías en un array de [clave, valor]
            Por ejemplo: [['Herramientas', ['🔨', '🔧', ...]], ['Construcción', [...]]]
            
            Luego iteramos sobre cada categoría y mostramos:
            1. El nombre de la categoría
            2. Una cuadrícula con todos los emojis de esa categoría
          */}
          {Object.entries(filteredCategories).map(([category, emojis]) => (
            <div key={category} className="mb-6 last:mb-0">
              {/* Título de la categoría */}
              <h4 className="text-sm font-medium text-slate-600 mb-2">
                {category}
              </h4>
              
              {/* 
                CUADRÍCULA DE EMOJIS
                - grid-cols-8: 8 columnas en desktop
                - grid-cols-6: 6 columnas en tablet
                - grid-cols-5: 5 columnas en móvil
                - gap-2: espacio entre emojis
              */}
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className={`
                      w-10 h-10 flex items-center justify-center
                      text-2xl rounded-lg transition-all
                      hover:bg-blue-50 hover:scale-110
                      ${selectedEmoji === emoji 
                        ? 'bg-blue-100 ring-2 ring-blue-500' 
                        : 'bg-slate-50 hover:bg-blue-50'
                      }
                    `}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Mensaje si no hay resultados */}
          {Object.keys(filteredCategories).length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-lg mb-1">😕</p>
              <p className="text-sm">No se encontraron categorías</p>
              <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
        
        {/* ============================================
            FOOTER: Botón de cancelar
            ============================================ */}
        <div className="px-4 py-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              console.log('🖱️ Clic en botón Cancelar del EmojiPicker')
              onClose()
            }}
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 
                     text-slate-700 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
  
  // ============================================
  // USAR PORTAL PARA RENDERIZAR FUERA DEL MODAL
  // ============================================
  /**
   * createPortal renderiza el componente en document.body
   * en lugar de en su posición normal del árbol DOM.
   * 
   * Esto es CRUCIAL porque:
   * - El EmojiPicker está dentro de un Modal
   * - El Modal tiene su propio z-index
   * - Si el EmojiPicker es hijo del Modal, queda limitado por su contexto
   * - Con Portal, el EmojiPicker se renderiza como hermano del Modal
   * - Así su z-index funciona correctamente
   */
  return createPortal(pickerContent, document.body)
}

/**
 * ============================================
 * NOTAS DE USO:
 * ============================================
 * 
 * 1. INSTALACIÓN:
 *    No necesita instalación adicional, solo lucide-react que ya tienes
 * 
 * 2. PERSONALIZACIÓN:
 *    - Puedes agregar/quitar emojis en EMOJI_CATEGORIES
 *    - Puedes cambiar las categorías según tus necesidades
 *    - Puedes ajustar los colores en las clases de Tailwind
 * 
 * 3. RESPONSIVE:
 *    - El picker se adapta automáticamente al tamaño de pantalla
 *    - En móvil muestra 5 columnas
 *    - En tablet muestra 6 columnas
 *    - En desktop muestra 8 columnas
 * 
 * 4. ACCESIBILIDAD:
 *    - Cada emoji es un botón clickeable
 *    - Se puede cerrar con el botón X o haciendo clic fuera
 *    - Tiene focus states para navegación por teclado
 */

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================
export default EmojiPicker