// ============================================
// COMPONENTE: UBICACION SELECTOR
// Selector de ubicaciones con opción de crear nueva
// ============================================

import { useState } from 'react'
import { useGetUbicacionesActivas } from '../../hooks/Useubicaciones'
import Button from './Button'
import { MapPin, Plus } from 'lucide-react'

/**
 * Componente UbicacionSelector - Selector de ubicaciones
 *
 * @param {string} value - ID de la ubicación seleccionada
 * @param {function} onChange - Callback cuando cambia la selección (recibe el ID)
 * @param {function} onUbicacionChange - Callback opcional para recibir el objeto completo de ubicación
 * @param {string} placeholder - Texto placeholder del select
 * @param {boolean} required - Si el campo es obligatorio
 * @param {boolean} disabled - Si el campo está deshabilitado
 * @param {string} error - Mensaje de error a mostrar
 * @param {string} label - Label del campo
 * @param {boolean} showAddButton - Mostrar botón para agregar nueva ubicación
 * @param {function} onAddNew - Callback para agregar nueva ubicación
 * @param {string} className - Clases CSS adicionales
 *
 * @example
 * <UbicacionSelector
 *   value={formData.ubicacion_id}
 *   onChange={(id) => setFormData({ ...formData, ubicacion_id: id })}
 *   label="Ubicación"
 *   required
 * />
 */
export const UbicacionSelector = ({
  value,
  onChange,
  onUbicacionChange,
  placeholder = 'Seleccionar ubicación...',
  required = false,
  disabled = false,
  error = null,
  label = 'Ubicación',
  showAddButton = false,
  onAddNew,
  className = ''
}) => {
  const { ubicaciones, isLoading } = useGetUbicacionesActivas()
  const [showAddModal, setShowAddModal] = useState(false)

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const selectedId = e.target.value

    // Llamar onChange con el ID
    if (onChange) {
      onChange(selectedId || null)
    }

    // Si hay callback para el objeto completo, buscarlo y enviarlo
    if (onUbicacionChange && selectedId) {
      const ubicacion = ubicaciones.find(u => u.id === parseInt(selectedId))
      onUbicacionChange(ubicacion)
    } else if (onUbicacionChange) {
      onUbicacionChange(null)
    }
  }

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew()
    } else {
      setShowAddModal(true)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Contenedor de Select + Botón */}
      <div className="flex gap-2">
        {/* Select */}
        <select
          value={value || ''}
          onChange={handleChange}
          disabled={disabled || isLoading}
          required={required}
          className={`
            flex-1 px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2
            ${error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-slate-300 focus:ring-blue-500'
            }
            ${disabled || isLoading ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
          `}
        >
          {/* Opción vacía / placeholder */}
          <option value="">
            {isLoading ? 'Cargando ubicaciones...' : placeholder}
          </option>

          {/* Opciones de ubicaciones */}
          {ubicaciones.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {ubicacion.nombre}
              {ubicacion.tipo && ` (${ubicacion.tipo})`}
              {ubicacion.ciudad && ` - ${ubicacion.ciudad}`}
            </option>
          ))}
        </select>

        {/* Botón "Agregar nueva" (opcional) */}
        {showAddButton && onAddNew && (
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddNew}
            disabled={disabled}
          >
            Nueva
          </Button>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Hint opcional */}
      {!error && ubicaciones.length === 0 && !isLoading && (
        <p className="mt-1 text-xs text-slate-500">
          No hay ubicaciones disponibles. Crea una nueva ubicación primero.
        </p>
      )}
    </div>
  )
}

export default UbicacionSelector
