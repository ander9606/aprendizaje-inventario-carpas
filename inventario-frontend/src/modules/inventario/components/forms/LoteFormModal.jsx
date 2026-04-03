// ============================================
// FORMULARIO: MOVER CANTIDAD (Lotes)
// Modal para mover cantidad entre lotes
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { EstadoBadge } from '@shared/components/Badge'
import UbicacionBadge from '@shared/components/UbicacionBadge'
import UbicacionSelector from '@shared/components/UbicacionSelector'
import { ESTADOS, SUCCESS_MESSAGES } from '@shared/utils/constants';
import { useMoverCantidad } from '../../hooks/useLotes'
import lotesAPI from '../../api/apiLotes'
import { useTranslation } from 'react-i18next'

/**
 * ============================================
 * COMPONENTE: LoteFormModal
 * ============================================
 *
 * Modal para mover cantidad de un lote a otro.
 *
 * LÓGICA IMPORTANTE:
 * - Mueve cantidad de ORIGEN a DESTINO
 * - Si el destino (ubicación + estado) ya existe → CONSOLIDA
 * - Si el destino NO existe → CREA nuevo lote
 * - Si el origen queda en 0 → ELIMINA lote origen
 *
 * CASOS DE USO:
 * 1. Traslado entre bodegas (mismo estado)
 * 2. Cambio de estado (misma ubicación)
 * 3. Alquilar (cambiar a estado alquilado, sin ubicación)
 * 4. Devolver (de alquilado a disponible con ubicación)
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {function} onSuccess - Callback después de mover
 * @param {Object} lote - Lote origen
 * @param {string} ubicacionOrigen - Ubicación actual del lote
 * @param {Object} elemento - Elemento al que pertenece
 *
 * @example
 * <LoteFormModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={handleSuccess}
 *   lote={{ id: 1, cantidad: 50, estado: 'bueno' }}
 *   ubicacionOrigen="Bodega A"
 *   elemento={elemento}
 * />
 */
function LoteFormModal({
  isOpen,
  onClose,
  onSuccess,
  lote,
  ubicacionOrigen,
  elemento
}) {
  // ============================================
  // 1. ESTADOS DEL FORMULARIO
  // ============================================

  /**
   * formData: Datos del formulario
   *
   * CAMPOS:
   * - cantidad: Cantidad a mover (máximo: lote.cantidad)
   * - ubicacion_destino: Nueva ubicación
   * - estado_destino: Nuevo estado (el motivo se infiere automáticamente)
   * - descripcion: Descripción detallada del movimiento (opcional)
   */
  const [formData, setFormData] = useState({
    cantidad: '',
    ubicacion_destino: '',
    estado_destino: lote?.estado || ESTADOS.BUENO,
    descripcion: ''
  })

  /**
   * errors: Errores de validación
   */
  const [errors, setErrors] = useState({})

  /**
   * previewConsolidacion: Indica si se va a consolidar
   * true = se sumará a lote existente
   * false = se creará nuevo lote
   */
  const [previewConsolidacion, setPreviewConsolidacion] = useState(false)

  // ============================================
  // 2. HOOKS DE MUTATIONS
  // ============================================

  const { moverCantidad } = useMoverCantidad()

  // ============================================
  // 3. EFECTOS
  // ============================================

  /**
   * EFECTO: Resetear formulario al abrir
   */
  useEffect(() => {
    if (isOpen && lote) {
      setFormData({
        cantidad: '',
        ubicacion_destino: '',
        estado_destino: lote.estado,
        descripcion: ''
      })
      setErrors({})
      setPreviewConsolidacion(false)
    }
  }, [isOpen, lote])

  /**
   * EFECTO: Actualizar preview de consolidación
   *
   * ¿QUÉ HACE?
   * Verifica si la combinación ubicación+estado ya existe
   * para mostrar mensaje de consolidación
   */
  useEffect(() => {
    if (formData.ubicacion_destino && formData.estado_destino && elemento?.id) {
      let cancelado = false
      lotesAPI.verificarExiste(elemento.id, formData.ubicacion_destino, formData.estado_destino)
        .then(res => {
          if (!cancelado) setPreviewConsolidacion(res.data?.existe || false)
        })
        .catch(() => {
          if (!cancelado) setPreviewConsolidacion(false)
        })
      return () => { cancelado = true }
    } else {
      setPreviewConsolidacion(false)
    }
  }, [formData.ubicacion_destino, formData.estado_destino, elemento?.id])

  // ============================================
  // 5. FUNCIONES DE VALIDACIÓN
  // ============================================

  /**
   * validateForm: Valida el formulario
   *
   * @returns {boolean} - true si es válido
   *
   * REGLAS:
   * - cantidad: Obligatoria, mayor a 0, no exceder disponible
   * - ubicacion_destino: Obligatoria si NO es alquilado
   * - estado_destino: Obligatorio
   * (El motivo se calcula automáticamente basado en el estado destino)
   */
  const validateForm = () => {
    const newErrors = {}

    // Validar cantidad
    if (!formData.cantidad) {
      newErrors.cantidad = 'Ingresa la cantidad a mover'
    } else {
      const cantidad = Number(formData.cantidad)

      if (isNaN(cantidad) || cantidad <= 0) {
        newErrors.cantidad = 'La cantidad debe ser mayor a 0'
      } else if (cantidad > lote.cantidad) {
        newErrors.cantidad = `No puedes mover más de ${lote.cantidad} unidades`
      }
    }

    // Validar ubicación destino
    // REGLA: Si NO es alquilado, DEBE tener ubicación
    if (formData.estado_destino !== ESTADOS.ALQUILADO) {
      if (!formData.ubicacion_destino.trim()) {
        newErrors.ubicacion_destino = 'Selecciona la ubicación destino'
      }
    }

    // Validar que NO sea el mismo origen
    if (
      formData.ubicacion_destino === ubicacionOrigen &&
      formData.estado_destino === lote.estado
    ) {
      newErrors.ubicacion_destino = 'El destino no puede ser igual al origen'
      newErrors.estado_destino = 'El destino no puede ser igual al origen'
    }

    // Validar estado
    if (!formData.estado_destino) {
      newErrors.estado_destino = 'Selecciona el estado destino'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // 6. HANDLERS
  // ============================================

  /**
   * handleCantidadChange: Maneja cambio de cantidad
   *
   * VALIDACIÓN EN TIEMPO REAL:
   * - Solo permite números
   * - No permite negativos
   * - Advierte si excede disponible
   */
  const handleCantidadChange = (e) => {
    let value = e.target.value

    // Permitir solo números
    if (value && !/^\d+$/.test(value)) {
      return
    }

    // Convertir a número
    const numero = Number(value)

    // Validar máximo
    if (numero > lote.cantidad) {
      toast.warning(`Máximo disponible: ${lote.cantidad}`)
      value = String(lote.cantidad)
    }

    setFormData(prev => ({
      ...prev,
      cantidad: value
    }))

    if (errors.cantidad) {
      setErrors(prev => ({ ...prev, cantidad: undefined }))
    }
  }

  /**
   * handleEstadoChange: Maneja cambio de estado destino
   *
   * LÓGICA ESPECIAL:
   * Si cambia a ALQUILADO → limpiar ubicación
   */
  const handleEstadoChange = (nuevoEstado) => {
    setFormData(prev => ({
      ...prev,
      estado_destino: nuevoEstado,
      // Si es alquilado, limpiar ubicación
      ubicacion_destino: nuevoEstado === ESTADOS.ALQUILADO
        ? ''
        : prev.ubicacion_destino
    }))

    if (errors.estado_destino) {
      setErrors(prev => ({ ...prev, estado_destino: undefined }))
    }
  }

  /**
   * handleUbicacionChange: Maneja cambio de ubicación
   */
  const handleUbicacionChange = (nuevaUbicacion) => {
    setFormData(prev => ({
      ...prev,
      ubicacion_destino: nuevaUbicacion
    }))

    if (errors.ubicacion_destino) {
      setErrors(prev => ({ ...prev, ubicacion_destino: undefined }))
    }
  }

  /**
   * handleUsarTodo: Usa toda la cantidad disponible
   */
  const handleUsarTodo = () => {
    setFormData(prev => ({
      ...prev,
      cantidad: String(lote.cantidad)
    }))

    if (errors.cantidad) {
      setErrors(prev => ({ ...prev, cantidad: undefined }))
    }
  }

  /**
   * handleSubmit: Maneja envío del formulario
   */
  const handleSubmit = (e) => {
    e.preventDefault()

    // Validar
    if (!validateForm()) {
      toast.error('Por favor corrige los errores')
      return
    }

    // ============================================
    // CALCULAR MOTIVO AUTOMÁTICAMENTE
    // ============================================
    // El motivo se infiere del estado destino seleccionado
    let motivo;

    if (formData.estado_destino === ESTADOS.ALQUILADO) {
      motivo = 'alquiler';
    } else if (formData.estado_destino === ESTADOS.MANTENIMIENTO) {
      motivo = 'reparacion';
    } else if (formData.estado_destino === ESTADOS.DANADO) {
      motivo = 'danado';
    } else if (formData.estado_destino === ESTADOS.BUENO && lote.estado === ESTADOS.ALQUILADO) {
      motivo = 'devolucion';
    } else if (formData.estado_destino === lote.estado) {
      // Solo cambio de ubicación, mismo estado
      motivo = 'traslado';
    } else {
      motivo = 'ajuste';
    }

    // Preparar datos
    const dataToSend = {
      lote_origen_id: lote.id,
      cantidad: Number(formData.cantidad),
      ubicacion_destino: formData.estado_destino === ESTADOS.ALQUILADO
        ? null
        : formData.ubicacion_destino.trim(),
      estado_destino: formData.estado_destino,
      motivo: motivo,
      descripcion: formData.descripcion.trim() || null
    }

    // Ejecutar mutation
    moverCantidad.mutate(dataToSend, {
      onSuccess: () => {
        toast.success(SUCCESS_MESSAGES.LOTE_MOVIDO)
        onSuccess()
        onClose()
      },
      onError: (error) => {
        toast.error(error.message || 'Error al mover cantidad')
      }
    })
  }

  // ============================================
  // 7. RENDERIZADO
  // ============================================

  if (!lote) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mover Cantidad - ${elemento?.nombre || ''}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>

        {/* ============================================
            INFORMACIÓN DEL ORIGEN
            ============================================ */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Origen:
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <UbicacionBadge ubicacion={ubicacionOrigen} />
            <EstadoBadge estado={lote.estado} />
            <span className="text-sm text-slate-600">
              •
            </span>
            <span className="font-bold text-slate-900">
              {lote.cantidad} unidades disponibles
            </span>
          </div>
        </div>

        {/* ============================================
            CAMPO: Cantidad a Mover
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cantidad a mover *
          </label>

          <div className="flex gap-2">
            <input
              type="number"
              value={formData.cantidad}
              onChange={handleCantidadChange}
              placeholder="0"
              min="1"
              max={lote.cantidad}
              className={`
                flex-1 px-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2
                ${errors.cantidad
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-blue-500'
                }
              `}
            />

            {/* Botón "Usar todo" */}
            <Button
              type="button"
              variant="outline"
              onClick={handleUsarTodo}
            >
              Usar todo ({lote.cantidad})
            </Button>
          </div>

          {errors.cantidad && (
            <p className="mt-1 text-sm text-red-600">
              {errors.cantidad}
            </p>
          )}

          {/* Preview: Cantidad que quedará */}
          {formData.cantidad && (
            <p className="mt-2 text-sm text-slate-600">
              {lote.cantidad - Number(formData.cantidad)} unidades quedarán en el origen
              {lote.cantidad - Number(formData.cantidad) === 0 && (
                <span className="text-amber-600 font-medium">
                  {' '}(El lote origen se eliminará)
                </span>
              )}
            </p>
          )}
        </div>

        {/* ============================================
            SEPARADOR VISUAL
            ============================================ */}
        <div className="flex items-center justify-center my-6">
          <div className="p-3 bg-blue-50 rounded-full">
            <ArrowRight className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* ============================================
            SECCIÓN: DESTINO
            ============================================ */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm font-medium text-blue-900 mb-3">
            Destino:
          </p>

          {/* ============================================
              CAMPO: Estado Destino
              ============================================ */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estado destino *
            </label>

            <div className="grid grid-cols-2 gap-2">
              {Object.values(ESTADOS).map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => handleEstadoChange(estado)}
                  className={`
                    p-3 border-2 rounded-lg text-left transition-all
                    ${formData.estado_destino === estado
                      ? 'border-blue-600 bg-blue-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }
                  `}
                >
                  <EstadoBadge estado={estado} size="sm" />
                </button>
              ))}
            </div>

            {errors.estado_destino && (
              <p className="mt-2 text-sm text-red-600">
                {errors.estado_destino}
              </p>
            )}
          </div>

          {/* ============================================
              CAMPO: Ubicación Destino
              ============================================ */}
          {formData.estado_destino !== ESTADOS.ALQUILADO && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ubicación destino *
              </label>

              <UbicacionSelector
                value={formData.ubicacion_destino}
                onChange={handleUbicacionChange}
                placeholder="Selecciona ubicación destino"
              />

              {errors.ubicacion_destino && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ubicacion_destino}
                </p>
              )}
            </div>
          )}

          {/* Mensaje si está alquilado */}
          {formData.estado_destino === ESTADOS.ALQUILADO && (
            <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-sm text-blue-700">
                ℹ️ Los lotes alquilados no tienen ubicación física
              </p>
            </div>
          )}
        </div>

        {/* ============================================
            PREVIEW: Consolidación
            ============================================ */}
        {previewConsolidacion && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✅ Se sumará a un lote existente (consolidación)
            </p>
            <p className="text-xs text-green-600 mt-1">
              Ya existe un lote con esta ubicación y estado
            </p>
          </div>
        )}

        {!previewConsolidacion && formData.ubicacion_destino && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">
              ✨ Se creará un nuevo lote
            </p>
            <p className="text-xs text-blue-600 mt-1">
              No existe un lote con esta combinación de ubicación y estado
            </p>
          </div>
        )}

        {/* ============================================
            INFORMACIÓN: Motivo automático
            ============================================ */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>
              <strong>El motivo se registra automáticamente:</strong>
              {formData.estado_destino === ESTADOS.ALQUILADO && ' Alquiler'}
              {formData.estado_destino === ESTADOS.MANTENIMIENTO && ' Reparación'}
              {formData.estado_destino === ESTADOS.DANADO && ' Marcado como dañado'}
              {formData.estado_destino === ESTADOS.BUENO && lote?.estado === ESTADOS.ALQUILADO && ' Devolución de alquiler'}
              {formData.estado_destino === lote?.estado && ' Traslado entre ubicaciones'}
              {!(formData.estado_destino === ESTADOS.ALQUILADO ||
                 formData.estado_destino === ESTADOS.MANTENIMIENTO ||
                 formData.estado_destino === ESTADOS.DANADO ||
                 (formData.estado_destino === ESTADOS.BUENO && lote?.estado === ESTADOS.ALQUILADO) ||
                 formData.estado_destino === lote?.estado) && ' Ajuste de inventario'}
            </span>
          </p>
        </div>

        {/* ============================================
            CAMPO: Descripción
            ============================================ */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Detalles adicionales del movimiento..."
            rows={2}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* ============================================
            FOOTER: Botones
            ============================================ */}
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={moverCantidad.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={moverCantidad.isPending}
          >
            {moverCantidad.isPending ? 'Moviendo...' : 'Mover Cantidad'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default LoteFormModal