// ============================================
// FORMULARIO: ELEMENTO
// Modal para crear o editar un elemento
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useCreateElemento, useUpdateElemento } from '../../hooks/Useelementos'
import { Edit3, Package } from 'lucide-react'

/**
 * ============================================
 * COMPONENTE: ElementoFormModal
 * ============================================
 *
 * Modal simplificado para crear o editar un elemento.
 *
 * SIMPLIFICACIÓN:
 * - Solo pedimos: nombre, descripción, tipo de gestión
 * - Para LOTES: valores por defecto (cantidad=0, estado='bueno', ubicacion='Bodega')
 * - Los detalles se configuran después en la página de detalle
 */
function ElementoFormModal({
  isOpen,
  onClose,
  onSuccess,
  subcategoriaId,
  elemento = null
}) {
  // ============================================
  // 1. DETERMINAR MODO
  // ============================================
  const isEditMode = elemento && elemento.id

  // ============================================
  // 2. ESTADOS DEL FORMULARIO
  // ============================================
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    requiere_series: true,
    cantidad: 0  // Solo se usa para lotes
  })

  const [errors, setErrors] = useState({})

  // ============================================
  // 3. HOOKS DE MUTATIONS
  // ============================================
  const createElemento = useCreateElemento()
  const updateElemento = useUpdateElemento()
  const mutation = isEditMode ? updateElemento : createElemento

  // ============================================
  // 4. EFECTOS
  // ============================================
  useEffect(() => {
    if (isOpen && isEditMode) {
      setFormData({
        nombre: elemento.nombre || '',
        descripcion: elemento.descripcion || '',
        requiere_series: elemento.requiere_series ?? true,
        cantidad: elemento.cantidad || 0
      })
    } else if (isOpen && !isEditMode) {
      setFormData({
        nombre: '',
        descripcion: '',
        requiere_series: true,
        cantidad: 0
      })
    }
    setErrors({})
  }, [isOpen, elemento, isEditMode])

  // ============================================
  // 5. VALIDACIÓN
  // ============================================
  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres'
    }

    // Validar cantidad solo para lotes
    if (!formData.requiere_series) {
      if (formData.cantidad < 0) {
        newErrors.cantidad = 'La cantidad no puede ser negativa'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // 6. HANDLERS
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCantidadChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      cantidad: value === '' ? 0 : parseInt(value, 10) || 0
    }))
    if (errors.cantidad) {
      setErrors(prev => ({ ...prev, cantidad: undefined }))
    }
  }

  const handleTipoGestionChange = (requiereSeries) => {
    if (isEditMode) {
      toast.warning('No se puede cambiar el tipo de gestión una vez creado el elemento.')
      return
    }
    setFormData(prev => ({
      ...prev,
      requiere_series: requiereSeries,
      cantidad: requiereSeries ? 0 : prev.cantidad  // Reset cantidad si cambia a series
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor corrige los errores del formulario')
      return
    }

    // ============================================
    // PREPARAR DATOS PARA EL BACKEND
    // ============================================
    const dataToSend = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      requiere_series: formData.requiere_series,
      categoria_id: isEditMode
        ? elemento.categoria_id
        : parseInt(subcategoriaId, 10),
      // Para SERIES: cantidad=0, sin ubicación
      // Para LOTES: cantidad del form, ubicación=Bodega, estado=bueno
      cantidad: formData.requiere_series ? 0 : (formData.cantidad || 0),
      estado: 'bueno',
      ubicacion: formData.requiere_series ? null : 'Bodega'
    }

    console.log('📤 Enviando datos al backend:', dataToSend)

    // ============================================
    // EJECUTAR MUTATION
   // ============================================
    mutation.mutate(
  isEditMode
    ? { id: elemento.id, ...dataToSend }
    : dataToSend,
  {
    onSuccess: () => {
      toast.success(isEditMode ? 'Elemento actualizado' : 'Elemento creado')
      onSuccess?.()
      onClose()
    },
    onError: (error) => {
      console.error('Error en la mutación:', error)
      const mensaje = error.response?.data?.mensaje ||
        error.message ||
        'Error al guardar el elemento'
      toast.error(mensaje)
    }
  }
)
  }

  // ============================================
  // 7. RENDERIZADO
  // ============================================
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Elemento' : 'Nuevo Elemento'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>

        {/* CAMPO: Nombre */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nombre del elemento *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ej: Carpa Doite 3x3"
            className={`
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2
              ${errors.nombre
                ? 'border-red-300 focus:ring-red-500'
                : 'border-slate-300 focus:ring-blue-500'
              }
            `}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
          )}
        </div>

        {/* CAMPO: Descripción */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Descripción detallada del elemento..."
            rows={3}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
          <p className="mt-1 text-xs text-slate-500">
            💡 Los elementos heredan el ícono de su subcategoría
          </p>
        </div>

        {/* CAMPO: Tipo de gestión */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Tipo de gestión *
          </label>

          <div className="space-y-3">
            {/* Opción: Series */}
            <label
              className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${formData.requiere_series
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                }
                ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="requiere_series"
                checked={formData.requiere_series === true}
                onChange={() => handleTipoGestionChange(true)}
                disabled={isEditMode}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Gestión por Series
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Tracking individual
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Cada unidad tiene número de serie único. Ideal para carpas, proyectores, equipos de sonido.
                </p>
              </div>
            </label>

            {/* Opción: Lotes */}
            <label
              className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${!formData.requiere_series
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
                }
                ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="requiere_series"
                checked={formData.requiere_series === false}
                onChange={() => handleTipoGestionChange(false)}
                disabled={isEditMode}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  Gestión por Lotes
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Tracking por cantidad
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Gestión por cantidad agrupada. Ideal para sillas, mástiles, postes, estacas.
                </p>
              </div>
            </label>
          </div>

          {isEditMode && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
              <span>⚠️</span>
              No se puede cambiar el tipo de gestión una vez creado el elemento
            </p>
          )}
        </div>

        {/* CAMPO: Cantidad inicial (solo para LOTES) */}
        {!formData.requiere_series && !isEditMode && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cantidad inicial *
            </label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleCantidadChange}
              min="0"
              placeholder="0"
              className={`
                w-full px-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2
                ${errors.cantidad
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-blue-500'
                }
              `}
            />
            {errors.cantidad && (
              <p className="mt-1 text-sm text-red-600">{errors.cantidad}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              💡 Se ubicarán en <strong>Bodega</strong> con estado <strong>Bueno</strong>
            </p>
          </div>
        )}

        {/* MENSAJE INFORMATIVO */}
        {!isEditMode && (
          <div className={`
            mb-4 p-4 rounded-lg border
            ${formData.requiere_series
              ? 'bg-blue-50 border-blue-200'
              : 'bg-purple-50 border-purple-200'
            }
          `}>
            {formData.requiere_series ? (
              <p className="text-sm text-blue-700">
                <strong>ℹ️ Gestión por Series:</strong> El elemento iniciará con 0 unidades.
                Después podrás agregar series individuales con sus números únicos.
              </p>
            ) : (
              <p className="text-sm text-purple-700">
                <strong>ℹ️ Gestión por Lotes:</strong> Las {formData.cantidad || 0} unidades se ubicarán en <strong>Bodega</strong> con estado <strong>Bueno</strong>.
                Después podrás agregar más lotes, mover cantidades y cambiar ubicaciones.
              </p>
            )}
          </div>
        )}

        {/* FOOTER */}
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? (isEditMode ? 'Guardando...' : 'Creando...')
              : (isEditMode ? 'Guardar Cambios' : 'Crear Elemento')
            }
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default ElementoFormModal