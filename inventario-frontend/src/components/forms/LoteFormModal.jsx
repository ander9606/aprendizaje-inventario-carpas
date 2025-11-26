// ============================================
// FORMULARIO: MOVER CANTIDAD (Lotes)
// Modal para mover cantidad entre lotes
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { EstadoBadge } from '../common/Badge'
import UbicacionBadge from '../common/UbicacionBadge'
import UbicacionSelector from '../common/UbicacionSelector'
import { ESTADOS, ESTADO_LABELS } from '../../utils/constants'
import { useMoverCantidad } from '../../hooks/Uselotes'

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
   * - estado_destino: Nuevo estado
   * - motivo: Razón del movimiento ('traslado', 'alquiler', 'devolucion', etc)
   * - descripcion: Descripción detallada del movimiento
   */
  const [formData, setFormData] = useState({
    cantidad: '',
    ubicacion_destino: '',
    estado_destino: lote?.estado || ESTADOS.BUENO,
    motivo: 'traslado',
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

  const moverCantidad = useMoverCantidad()

  // ============================================
  // 3. CONSTANTES
  // ============================================

  /**
   * MOTIVOS: Razones posibles para mover cantidad
   *
   * CATEGORÍAS:
   * - Logística: Traslados entre ubicaciones
   * - Operación: Alquileres y devoluciones
   * - Mantenimiento: Reparaciones y daños
   * - Inventario: Ajustes y conteos
   */
  const MOTIVOS = [
    { value: 'traslado', label: '📦 Traslado entre ubicaciones' },
    { value: 'alquiler', label: '🎯 Alquiler' },
    { value: 'devolucion', label: '↩️ Devolución de alquiler' },
    { value: 'reparacion', label: '🔧 Envío a mantenimiento' },
    { value: 'danado', label: '⚠️ Marcado como dañado' },
    { value: 'ajuste', label: '📊 Ajuste de inventario' },
    { value: 'otro', label: '📝 Otro motivo' }
  ]

  // ============================================
  // 4. EFECTOS
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
        motivo: 'traslado',
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
    if (formData.ubicacion_destino && formData.estado_destino) {
      // TODO: Consultar API si existe lote con misma ubicación+estado
      // const existe = await lotesAPI.verificarExiste(elemento.id, ubicacion, estado)
      // setPreviewConsolidacion(existe)

      // Placeholder: random
      setPreviewConsolidacion(Math.random() > 0.5)
    } else {
      setPreviewConsolidacion(false)
    }
  }, [formData.ubicacion_destino, formData.estado_destino])

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
   * - motivo: Obligatorio
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

    // Validar motivo
    if (!formData.motivo) {
      newErrors.motivo = 'Selecciona el motivo del movimiento'
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
   * handleMotivoChange: Maneja cambio de motivo
   *
   * AUTO-COMPLETAR:
   * Según el motivo, puede auto-completar el estado destino
   */
  const handleMotivoChange = (e) => {
    const motivo = e.target.value

    setFormData(prev => {
      const newData = { ...prev, motivo }

      // Auto-completar estado según motivo
      switch (motivo) {
        case 'alquiler':
          newData.estado_destino = ESTADOS.ALQUILADO
          newData.ubicacion_destino = ''
          break
        case 'devolucion':
          newData.estado_destino = ESTADOS.BUENO
          break
        case 'reparacion':
          newData.estado_destino = ESTADOS.MANTENIMIENTO
          break
        case 'danado':
          newData.estado_destino = ESTADOS.DANADO
          break
        default:
          // Mantener estado actual
          break
      }

      return newData
    })

    if (errors.motivo) {
      setErrors(prev => ({ ...prev, motivo: undefined }))
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

    // Preparar datos
    const dataToSend = {
      lote_origen_id: lote.id,
      cantidad: Number(formData.cantidad),
      ubicacion_destino: formData.estado_destino === ESTADOS.ALQUILADO
        ? null
        : formData.ubicacion_destino.trim(),
      estado_destino: formData.estado_destino,
      motivo: formData.motivo,
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
      title="Mover Cantidad"
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
            CAMPO: Motivo
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Motivo del movimiento *
          </label>

          <select
            value={formData.motivo}
            onChange={handleMotivoChange}
            className={`
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2
              ${errors.motivo
                ? 'border-red-300 focus:ring-red-500'
                : 'border-slate-300 focus:ring-blue-500'
              }
            `}
          >
            {MOTIVOS.map((motivo) => (
              <option key={motivo.value} value={motivo.value}>
                {motivo.label}
              </option>
            ))}
          </select>

          {errors.motivo && (
            <p className="mt-1 text-sm text-red-600">
              {errors.motivo}
            </p>
          )}
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

/**
 * ============================================
 * 🎓 CONCEPTOS CLAVE
 * ============================================
 *
 * 1. CONSOLIDACIÓN AUTOMÁTICA:
 * ────────────────────────────
 * Si ya existe un lote con la misma ubicación + estado,
 * el backend SUMA las cantidades automáticamente.
 * No crea lote duplicado, consolida.
 *
 *
 * 2. AUTO-ELIMINACIÓN:
 * ───────────────────
 * Si el lote origen queda en 0 después de mover,
 * el backend lo elimina automáticamente.
 *
 *
 * 3. VALIDACIÓN DE MÁXIMO:
 * ────────────────────────
 * No se puede mover más cantidad de la disponible.
 * El input limita el máximo dinámicamente.
 *
 *
 * 4. MOTIVOS DE MOVIMIENTO:
 * ─────────────────────────
 * Se registra el motivo para historial y auditoría.
 * Ayuda a entender por qué se movió la cantidad.
 *
 *
 * 5. AUTO-COMPLETADO INTELIGENTE:
 * ───────────────────────────────
 * Según el motivo seleccionado, auto-completa el estado:
 * - Alquiler → estado = alquilado
 * - Devolución → estado = bueno
 * - Reparación → estado = mantenimiento
 * - Dañado → estado = dañado
 *
 *
 * 6. REGLA DE UBICACIÓN:
 * ──────────────────────
 * - Alquilado → ubicacion = null
 * - Otros estados → ubicacion requerida
 *
 *
 * 7. PREVIEW EN TIEMPO REAL:
 * ──────────────────────────
 * Muestra cuántas unidades quedarán en origen
 * y si se va a consolidar o crear nuevo lote.
 */
