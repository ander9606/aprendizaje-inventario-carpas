// ============================================
// FORMULARIO: EDITAR CANTIDAD DE LOTE
// Modal para ajustar directamente la cantidad de un lote
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Package } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { EstadoBadge } from '../common/Badge'
import UbicacionBadge from '../common/UbicacionBadge'
import { SUCCESS_MESSAGES } from "../../utils/constants"
import { lotesAPI } from '../../api'
import { useQueryClient } from '@tanstack/react-query'

/**
 * ============================================
 * COMPONENTE: EditarLoteModal
 * ============================================
 *
 * Modal para editar la cantidad de un lote existente.
 *
 * CASOS DE USO:
 * - Ajustes de inventario
 * - Correcciones
 * - Registrar pérdidas/robos
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {function} onSuccess - Callback después de editar
 * @param {Object} lote - Lote a editar
 * @param {string} ubicacion - Ubicación del lote
 * @param {Object} elemento - Elemento al que pertenece
 */
function EditarLoteModal({
  isOpen,
  onClose,
  onSuccess,
  lote,
  ubicacion,
  elemento
}) {
  // ============================================
  // 1. ESTADOS DEL FORMULARIO
  // ============================================

  const [formData, setFormData] = useState({
    cantidad: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  // ============================================
  // 2. EFECTOS
  // ============================================

  /**
   * EFECTO: Cargar cantidad actual al abrir
   */
  useEffect(() => {
    if (isOpen && lote) {
      setFormData({
        cantidad: String(lote.cantidad || '')
      })
      setErrors({})
    }
  }, [isOpen, lote])

  // ============================================
  // 3. VALIDACIÓN
  // ============================================

  const validateForm = () => {
    const newErrors = {}

    // Validar cantidad
    if (!formData.cantidad) {
      newErrors.cantidad = 'Ingresa la nueva cantidad'
    } else {
      const cantidad = Number(formData.cantidad)

      if (isNaN(cantidad) || cantidad < 0) {
        newErrors.cantidad = 'La cantidad debe ser 0 o mayor'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // 4. HANDLERS
  // ============================================

  const handleCantidadChange = (e) => {
    let value = e.target.value

    // Permitir solo números
    if (value && !/^\d+$/.test(value)) {
      return
    }

    setFormData(prev => ({
      ...prev,
      cantidad: value
    }))

    if (errors.cantidad) {
      setErrors(prev => ({ ...prev, cantidad: undefined }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar
    if (!validateForm()) {
      toast.error('Por favor corrige los errores')
      return
    }

    const nuevaCantidad = Number(formData.cantidad)

    // Verificar si cambió
    if (nuevaCantidad === lote.cantidad) {
      toast.info('La cantidad no ha cambiado')
      onClose()
      return
    }

    setIsSubmitting(true)

    try {
      // Llamar API para actualizar
      await lotesAPI.actualizar(lote.id, {
        cantidad: nuevaCantidad
      })

      // Invalidar cache
      queryClient.invalidateQueries({
        queryKey: ['lotes', 'elemento', elemento.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos', elemento.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos', 'subcategoria']
      })

      // Mostrar mensaje según la acción
      if (nuevaCantidad === 0) {
        toast.success('Lote eliminado (cantidad = 0)')
      } else if (nuevaCantidad > lote.cantidad) {
        toast.success(`Incrementado de ${lote.cantidad} a ${nuevaCantidad}`)
      } else {
        toast.success(`Reducido de ${lote.cantidad} a ${nuevaCantidad}`)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al actualizar lote:', error)
      const mensaje = error.response?.data?.mensaje || error.message || 'Error al actualizar cantidad'
      toast.error(mensaje)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // 5. RENDERIZADO
  // ============================================

  if (!lote) return null

  const cantidadActual = lote.cantidad || 0
  const nuevaCantidad = Number(formData.cantidad) || 0
  const diferencia = nuevaCantidad - cantidadActual

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Cantidad - ${elemento?.nombre || ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>

        {/* ============================================
            INFORMACIÓN DEL LOTE
            ============================================ */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Lote actual:
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <UbicacionBadge ubicacion={ubicacion || 'Sin ubicación'} />
            <EstadoBadge estado={lote.estado} />
            <span className="text-sm text-slate-600">•</span>
            <span className="font-bold text-slate-900">
              {cantidadActual} {cantidadActual === 1 ? 'unidad' : 'unidades'}
            </span>
          </div>
        </div>

        {/* ============================================
            CAMPO: Nueva Cantidad
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nueva cantidad *
          </label>

          <input
            type="number"
            value={formData.cantidad}
            onChange={handleCantidadChange}
            placeholder="0"
            min="0"
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
            <p className="mt-1 text-sm text-red-600">
              {errors.cantidad}
            </p>
          )}

          {/* Preview del cambio */}
          {formData.cantidad && !errors.cantidad && diferencia !== 0 && (
            <div className={`
              mt-2 p-2 rounded-lg text-sm
              ${diferencia > 0
                ? 'bg-green-50 text-green-700'
                : diferencia < 0
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-50 text-slate-600'
              }
            `}>
              {diferencia > 0 && (
                <span>✅ Se agregarán {diferencia} {diferencia === 1 ? 'unidad' : 'unidades'}</span>
              )}
              {diferencia < 0 && (
                <span>⚠️ Se restarán {Math.abs(diferencia)} {Math.abs(diferencia) === 1 ? 'unidad' : 'unidades'}</span>
              )}
              {nuevaCantidad === 0 && (
                <span className="font-medium">🗑️ El lote será eliminado automáticamente</span>
              )}
            </div>
          )}
        </div>

        {/* ============================================
            INFORMACIÓN: Casos de uso
            ============================================ */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>
              <strong>Usa esta función para:</strong> Ajustes de inventario, correcciones, registrar pérdidas o robos.
              Para mover entre ubicaciones usa el botón "Mover lotes".
            </span>
          </p>
        </div>

        {/* ============================================
            FOOTER: Botones
            ============================================ */}
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || diferencia === 0}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default EditarLoteModal
