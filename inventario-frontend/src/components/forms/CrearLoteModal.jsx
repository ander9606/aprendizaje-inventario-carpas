// ============================================
// FORMULARIO: CREAR LOTE
// Modal para crear un nuevo lote
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Package } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { EstadoBadge } from '../common/Badge'
import UbicacionSelector from '../common/UbicacionSelector'
import { ESTADOS, SUCCESS_MESSAGES } from "../../utils/constants"
import { lotesAPI } from '../../api'
import { useQueryClient } from '@tanstack/react-query'

/**
 * ============================================
 * COMPONENTE: CrearLoteModal
 * ============================================
 *
 * Modal para crear un nuevo lote para un elemento.
 *
 * DIFERENCIA CON LoteFormModal:
 * - LoteFormModal: Mueve cantidad entre lotes existentes
 * - CrearLoteModal: Crea un lote completamente nuevo desde cero
 *
 * CASOS DE USO:
 * 1. Agregar inventario nuevo (compra de unidades)
 * 2. Registrar stock inicial
 * 3. Agregar lote en nueva ubicación
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {function} onSuccess - Callback después de crear
 * @param {Object} elemento - Elemento al que pertenece el lote
 *
 * @example
 * <CrearLoteModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={handleSuccess}
 *   elemento={elemento}
 * />
 */
function CrearLoteModal({
  isOpen,
  onClose,
  onSuccess,
  elemento
}) {
  // ============================================
  // 1. ESTADOS DEL FORMULARIO
  // ============================================

  const [formData, setFormData] = useState({
    lote_numero: '',
    cantidad: '',
    estado: ESTADOS.BUENO,
    ubicacion: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  // ============================================
  // 2. EFECTOS
  // ============================================

  /**
   * EFECTO: Resetear formulario al abrir
   */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        lote_numero: '',
        cantidad: '',
        estado: ESTADOS.BUENO,
        ubicacion: '',
      })
      setErrors({})
    }
  }, [isOpen])

  // ============================================
  // 3. VALIDACIÓN
  // ============================================

  const validateForm = () => {
    const newErrors = {}

    // Validar lote_numero
    if (!formData.lote_numero.trim()) {
      newErrors.lote_numero = 'Ingresa el número de lote'
    } else if (formData.lote_numero.trim().length < 3) {
      newErrors.lote_numero = 'El número de lote debe tener al menos 3 caracteres'
    }

    // Validar cantidad
    if (!formData.cantidad) {
      newErrors.cantidad = 'Ingresa la cantidad'
    } else {
      const cantidad = Number(formData.cantidad)
      if (isNaN(cantidad) || cantidad <= 0) {
        newErrors.cantidad = 'La cantidad debe ser mayor a 0'
      }
    }

    // Validar ubicación
    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'Selecciona la ubicación'
    }

    // Validar estado
    if (!formData.estado) {
      newErrors.estado = 'Selecciona el estado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // 4. HANDLERS
  // ============================================

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

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

  const handleEstadoChange = (nuevoEstado) => {
    setFormData(prev => ({
      ...prev,
      estado: nuevoEstado
    }))

    if (errors.estado) {
      setErrors(prev => ({ ...prev, estado: undefined }))
    }
  }

  const handleUbicacionChange = (nuevaUbicacion) => {
    setFormData(prev => ({
      ...prev,
      ubicacion: nuevaUbicacion
    }))

    if (errors.ubicacion) {
      setErrors(prev => ({ ...prev, ubicacion: undefined }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar
    if (!validateForm()) {
      toast.error('Por favor corrige los errores')
      return
    }

    // Preparar datos
    const dataToSend = {
      elemento_id: elemento.id,
      lote_numero: formData.lote_numero.trim(),
      cantidad: Number(formData.cantidad),
      estado: formData.estado,
      ubicacion: formData.ubicacion.trim()
    }

    setIsSubmitting(true)

    try {
      // Llamar API
      await lotesAPI.crear(dataToSend)

      // Invalidar cache
      queryClient.invalidateQueries({
        queryKey: ['lotes', 'elemento', elemento.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos', elemento.id]
      })

      toast.success(SUCCESS_MESSAGES.LOTE_CREADO || 'Lote creado exitosamente')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al crear lote:', error)
      const mensaje = error.response?.data?.mensaje || error.message || 'Error al crear lote'
      toast.error(mensaje)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // 5. RENDERIZADO
  // ============================================

  if (!elemento) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Agregar Lote - ${elemento.nombre}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>

        {/* INFO DEL ELEMENTO */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-slate-600" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Elemento:
              </p>
              <p className="text-base font-semibold text-slate-900">
                {elemento.nombre}
              </p>
            </div>
          </div>
        </div>

        {/* CAMPO: Número de Lote */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Número de lote *
          </label>
          <input
            type="text"
            name="lote_numero"
            value={formData.lote_numero}
            onChange={handleInputChange}
            placeholder="Ej: LOTE-001, L-2024-01, etc."
            className={`
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2
              ${errors.lote_numero
                ? 'border-red-300 focus:ring-red-500'
                : 'border-slate-300 focus:ring-blue-500'
              }
            `}
          />
          {errors.lote_numero && (
            <p className="mt-1 text-sm text-red-600">
              {errors.lote_numero}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            💡 Usa un formato único e identificable
          </p>
        </div>

        {/* CAMPO: Cantidad */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cantidad *
          </label>
          <input
            type="number"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleCantidadChange}
            placeholder="0"
            min="1"
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
        </div>

        {/* CAMPO: Estado */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estado *
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[ESTADOS.NUEVO, ESTADOS.BUENO, ESTADOS.MANTENIMIENTO, ESTADOS.DANADO].map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => handleEstadoChange(estado)}
                className={`
                  p-3 border-2 rounded-lg text-left transition-all
                  ${formData.estado === estado
                    ? 'border-blue-600 bg-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }
                `}
              >
                <EstadoBadge estado={estado} size="sm" />
              </button>
            ))}
          </div>

          {errors.estado && (
            <p className="mt-2 text-sm text-red-600">
              {errors.estado}
            </p>
          )}
        </div>

        {/* CAMPO: Ubicación */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ubicación *
          </label>

          <UbicacionSelector
            value={formData.ubicacion}
            onChange={handleUbicacionChange}
            placeholder="Selecciona ubicación del lote"
          />

          {errors.ubicacion && (
            <p className="mt-1 text-sm text-red-600">
              {errors.ubicacion}
            </p>
          )}
        </div>

        {/* FOOTER: Botones */}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear Lote'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default CrearLoteModal
