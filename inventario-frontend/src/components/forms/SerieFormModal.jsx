// ============================================
// FORMULARIO: SERIE
// Modal para agregar o editar una serie
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { EstadoBadge } from '../common/Badge'
<<<<<<< HEAD
import UbicacionSelector from '../common/UbicacionSelector'
import { ESTADOS } from '../../utils/constants'
=======
import { ESTADOS, ESTADO_LABELS } from '../../utils/constants'
>>>>>>> a9100b0b2c322bf7343667b0c80415b92c023036
import { useCreateSerie, useUpdateSerie } from '../../hooks/Useseries'

/**
 * ============================================
 * COMPONENTE: SerieFormModal
 * ============================================
 *
 * Modal para agregar o editar una serie individual.
 *
 * MODOS:
 * 1. AGREGAR: Si NO se pasa 'serie' prop
 * 2. EDITAR: Si se pasa 'serie' con datos existentes
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {function} onSuccess - Callback después de guardar
 * @param {Object} elemento - Elemento al que pertenece la serie
 * @param {Object} serie - Serie a editar (opcional, si no existe = crear)
 *
 * @example
 * // AGREGAR NUEVA SERIE
 * <SerieFormModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={handleSuccess}
 *   elemento={elemento}
 * />
 *
 * @example
 * // EDITAR SERIE EXISTENTE
 * <SerieFormModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={handleSuccess}
 *   elemento={elemento}
 *   serie={serieExistente}
 * />
 */
function SerieFormModal({
  isOpen,
  onClose,
  onSuccess,
  elemento,
  serie = null // null = crear, con datos = editar
}){
  // ============================================
  // 1. DETERMINAR MODO
  // ============================================

  /**
   * isEditMode: true si estamos editando
   */
  const isEditMode = serie && serie.id

  // ============================================
  // 2. ESTADOS DEL FORMULARIO
  // ============================================

  /**
   * formData: Datos del formulario
   *
   * CAMPOS:
   * - numero_serie: Número de serie único (ej: "DOITE-001")
   * - estado: Estado de la serie ('nuevo', 'bueno', etc)
   * - ubicacion: Ubicación física (ej: "Bodega A")
   */
  const [formData, setFormData] = useState({
    numero_serie: '',
    estado: ESTADOS.BUENO, // Estado por defecto
    ubicacion: ''
  })

  /**
   * errors: Errores de validación
   */
  const [errors, setErrors] = useState({})

  /**
   * isGeneratingNumber: Si está generando número automático
   * Útil para mostrar loading mientras genera
   */
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)


  // ============================================
  // 3. HOOKS DE MUTATIONS
  // ============================================

    const { createSerie: createSerieFn, isPending: isCreating } = useCreateSerie()
    const { updateSerie: updateSerieFn, isPending: isUpdating } = useUpdateSerie()

    const mutationIsPending = isEditMode ? isUpdating : isCreating


  // ============================================
  // 4. EFECTOS
  // ============================================

  /**
   * EFECTO: Cargar datos al abrir el modal
   *
   * Si es modo editar: Carga datos de la serie
   * Si es modo crear: Resetea el formulario
   */
  useEffect(() => {
    if (isOpen && isEditMode) {
      // Modo editar: cargar datos
      setFormData({
        numero_serie: serie.numero_serie || '',
        estado: serie.estado || ESTADOS.BUENO,
        ubicacion: serie.ubicacion || ''
      })
    } else if (isOpen && !isEditMode) {
      // Modo crear: resetear
      setFormData({
        numero_serie: '',
        estado: ESTADOS.BUENO,
        ubicacion: ''
      })
    }

    // Limpiar errores
    setErrors({})
  }, [isOpen, serie, isEditMode])

  // ============================================
  // 5. FUNCIONES DE VALIDACIÓN
  // ============================================

  /**
   * validateForm: Valida el formulario
   *
   * @returns {boolean} - true si es válido
   *
   * REGLAS:
   * - numero_serie: Obligatorio, mínimo 3 caracteres
   * - estado: Obligatorio, debe ser un estado válido
   * - ubicacion: Obligatoria si NO está alquilado
   */
  const validateForm = () => {
    const newErrors = {}

    // Validar número de serie
    if (!formData.numero_serie.trim()) {
      newErrors.numero_serie = 'El número de serie es obligatorio'
    } else if (formData.numero_serie.trim().length < 3) {
      newErrors.numero_serie = 'Debe tener al menos 3 caracteres'
    }

    // Validar estado
    if (!formData.estado) {
      newErrors.estado = 'Selecciona un estado'
    }

    // Validar ubicación
    // REGLA: Si NO está alquilado, DEBE tener ubicación
    if (formData.estado !== ESTADOS.ALQUILADO && !formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es obligatoria (excepto para alquilados)'
    }

    // Si está alquilado, ubicación debe ser null
    if (formData.estado === ESTADOS.ALQUILADO && formData.ubicacion.trim()) {
      newErrors.ubicacion = 'Las series alquiladas no tienen ubicación física'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // 6. HANDLERS
  // ============================================

  /**
   * handleInputChange: Maneja cambios en inputs
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  /**
   * handleEstadoChange: Maneja cambio de estado
   *
   * @param {string} nuevoEstado - El nuevo estado seleccionado
   *
   * LÓGICA ESPECIAL:
   * Si cambia a ALQUILADO → limpiar ubicación
   */
  const handleEstadoChange = (nuevoEstado) => {
    setFormData(prev => ({
      ...prev,
      estado: nuevoEstado,
      // Si cambia a alquilado, limpiar ubicación
      ubicacion: nuevoEstado === ESTADOS.ALQUILADO ? '' : prev.ubicacion
    }))

    // Limpiar errores
    if (errors.estado) {
      setErrors(prev => ({ ...prev, estado: undefined }))
    }
  }


  /**
   * handleGenerarNumero: Genera número de serie automáticamente
   *
   * LÓGICA:
   * 1. Obtiene el último número usado
   * 2. Incrementa en 1
   * 3. Formatea con ceros a la izquierda
   *
   * EJEMPLO:
   * Si el último es "DOITE-005" → genera "DOITE-006"
   */
  const handleGenerarNumero = async () => {
    setIsGeneratingNumber(true)

    try {
      // TODO: Llamar a API para obtener siguiente número
      // const response = await seriesAPI.obtenerSiguienteNumero(elemento.id)
      // const siguienteNumero = response.data.numero

      // Placeholder mientras implementamos
      const prefijo = elemento.nombre.substring(0, 5).toUpperCase()
      const numero = Math.floor(Math.random() * 1000) + 1
      const siguienteNumero = `${prefijo}-${String(numero).padStart(3, '0')}`

      setFormData(prev => ({
        ...prev,
        numero_serie: siguienteNumero
      }))

      toast.success('Número generado automáticamente')
    } catch (error) {
      toast.error(error.message || 'Error al generar número')
    } finally {
      setIsGeneratingNumber(false)
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
      numero_serie: formData.numero_serie.trim(),
      estado: formData.estado,
      // Si está alquilado, ubicación es null
      ubicacion: formData.estado === ESTADOS.ALQUILADO
        ? null
        : formData.ubicacion.trim() || null
    }

    // Si estamos creando, agregar elemento_id
    if (!isEditMode) {
      dataToSend.id_elemento = elemento.id
    }

    // Ejecutar mutation
    if (isEditMode) {
  updateSerieFn(
    { id: serie.id, data: dataToSend },
    {
      onSuccess: () => {
        toast.success('Serie actualizada exitosamente')
        onSuccess()
        onClose()
      },
      onError: (error) => {
        toast.error(error.message || 'Error al actualizar serie')
      }
    }
  )
} else {
  createSerieFn(dataToSend, {
    onSuccess: () => {
      toast.success('Serie agregada exitosamente')
      onSuccess()
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear serie')
    }
  })
}}


  // ============================================
  // 7. RENDERIZADO
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Serie' : `Agregar Serie a ${elemento?.nombre}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>

        {/* ============================================
            CAMPO: Número de Serie
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Número de Serie *
          </label>

          <div className="flex gap-2">
            {/* Input del número */}
            <input
              type="text"
              name="numero_serie"
              value={formData.numero_serie}
              onChange={handleInputChange}
              placeholder="Ej: DOITE-001"
              disabled={isEditMode} // No se puede cambiar al editar
              className={`
                flex-1 px-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2
                ${isEditMode ? 'bg-slate-100 cursor-not-allowed' : ''}
                ${errors.numero_serie
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-blue-500'
                }
              `}
            />

            {/* Botón generar automático (solo en crear) */}
            {!isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerarNumero}
                disabled={isGeneratingNumber}
              >
                {isGeneratingNumber ? 'Generando...' : '🎲 Auto'}
              </Button>
            )}
          </div>

          {errors.numero_serie && (
            <p className="mt-1 text-sm text-red-600">
              {errors.numero_serie}
            </p>
          )}

          {/* Mensaje si está editando */}
          {isEditMode && (
            <p className="mt-1 text-sm text-slate-500">
              El número de serie no se puede modificar
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Estado
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Estado *
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* Mapear todos los estados posibles */}
            {Object.values(ESTADOS).map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => handleEstadoChange(estado)}
                className={`
                  p-3 border-2 rounded-lg text-left
                  transition-all
                  ${formData.estado === estado
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
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

        {/* ============================================
            CAMPO: Ubicación
            ============================================

            NOTA: Solo se muestra si NO está alquilado
            ============================================ */}
        {formData.estado !== ESTADOS.ALQUILADO && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ubicación *
            </label>

            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleInputChange}
              placeholder="Ej: Bodega A"
              className={`
                w-full px-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2
                ${errors.ubicacion
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-blue-500'
                }
              `}
            />

            {errors.ubicacion && (
              <p className="mt-1 text-sm text-red-600">
                {errors.ubicacion}
              </p>
            )}
          </div>
        )}

        {/* Mensaje si está alquilado */}
        {formData.estado === ESTADOS.ALQUILADO && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ℹ️ Las series alquiladas no tienen ubicación física
              (están fuera de las instalaciones)
            </p>
          </div>
        )}

        {/* ============================================
            FOOTER: Botones
            ============================================ */}
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutationIsPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutationIsPending}
          >
            {mutationIsPending
              ? (isEditMode ? 'Guardando...' : 'Agregando...')
              : (isEditMode ? 'Guardar Cambios' : 'Agregar Serie')
            }
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default SerieFormModal