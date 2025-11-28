// ============================================
// COMPONENTE: UBICACION SELECTOR
// Selector/Input para elegir ubicaciones
// ============================================

import { useState, useEffect } from 'react'
import { MapPin, ChevronDown, Plus, X } from 'lucide-react'

/**
 * Componente UbicacionSelector - Selector de ubicación
 *
 * Permite seleccionar una ubicación de una lista predefinida
 * o escribir una nueva ubicación personalizada.
 *
 * @param {string} value - Valor actual de la ubicación
 * @param {function} onChange - Callback cuando cambia la ubicación
 * @param {string} placeholder - Placeholder del input
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} error - Mensaje de error (opcional)
 * @param {Array} ubicaciones - Lista de ubicaciones (opcional, usa predefinidas si no se pasa)
 *
 * @example
 * <UbicacionSelector
 *   value={formData.ubicacion}
 *   onChange={(ubicacion) => setFormData({ ...formData, ubicacion })}
 *   placeholder="Selecciona una ubicación"
 * />
 */
const UbicacionSelector = ({
  value = '',
  onChange,
  placeholder = 'Selecciona o escribe una ubicación',
  disabled = false,
  error = null,
  ubicaciones = null,
  className = ''
}) => {
  // ============================================
  // ESTADO LOCAL
  // ============================================
  
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  
  // Ubicaciones predefinidas (puedes cargarlas de la API después)
  const ubicacionesPredefinidas = ubicaciones || [
    'Bodega A',
    'Bodega B',
    'Bodega Principal',
    'Taller',
    'Almacén',
    'Oficina',
    'Exhibición',
    'Vehículo 1',
    'Vehículo 2'
  ]
  
  // Filtrar ubicaciones según el input
  const ubicacionesFiltradas = ubicacionesPredefinidas.filter(
    ub => ub.toLowerCase().includes(inputValue.toLowerCase())
  )
  
  // ============================================
  // EFECTOS
  // ============================================
  
  // Sincronizar cuando cambia el value externo
  useEffect(() => {
    setInputValue(value)
  }, [value])
  
  // ============================================
  // HANDLERS
  // ============================================
  
  /**
   * Manejar cambio en el input
   */
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
  }
  
  /**
   * Seleccionar una ubicación de la lista
   */
  const handleSelectUbicacion = (ubicacion) => {
    setInputValue(ubicacion)
    onChange(ubicacion)
    setIsOpen(false)
  }
  
  /**
   * Manejar cuando el input pierde foco
   */
  const handleInputBlur = () => {
    // Pequeño delay para permitir click en opciones
    setTimeout(() => {
      setIsOpen(false)
      // Si el usuario escribió algo nuevo, usarlo
      if (inputValue !== value) {
        onChange(inputValue)
      }
    }, 200)
  }
  
  /**
   * Limpiar el valor
   */
  const handleClear = (e) => {
    e.stopPropagation()
    setInputValue('')
    onChange('')
  }
  
  /**
   * Manejar tecla Enter
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onChange(inputValue)
      setIsOpen(false)
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={`relative ${className}`}>
      {/* Input principal */}
      <div className="relative">
        {/* Ícono de ubicación */}
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        
        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border rounded-lg
            focus:outline-none focus:ring-2
            disabled:bg-slate-100 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-slate-300 focus:ring-blue-500'
            }
          `}
        />
        
        {/* Botón limpiar / dropdown */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>
      
      {/* Dropdown de opciones */}
      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {ubicacionesFiltradas.length > 0 ? (
            <>
              {ubicacionesFiltradas.map((ubicacion) => (
                <button
                  key={ubicacion}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // Evitar blur antes del click
                  onClick={() => handleSelectUbicacion(ubicacion)}
                  className={`
                    w-full text-left px-4 py-2 text-sm
                    hover:bg-blue-50 transition-colors
                    flex items-center gap-2
                    ${ubicacion === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}
                  `}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{ubicacion}</span>
                </button>
              ))}
              
              {/* Opción para usar valor personalizado si no está en la lista */}
              {inputValue && !ubicacionesFiltradas.includes(inputValue) && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectUbicacion(inputValue)}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>Usar "{inputValue}"</span>
                </button>
              )}
            </>
          ) : (
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-slate-500 mb-2">
                No se encontró "{inputValue}"
              </p>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectUbicacion(inputValue)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Crear ubicación "{inputValue}"
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default UbicacionSelector