// ============================================
// FORMULARIO: MOVER SERIE
// Modal para mover series individuales entre ubicaciones/estados
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { EstadoBadge } from '@shared/components/Badge'
import UbicacionBadge from '@shared/components/UbicacionBadge'
import UbicacionSelector from '@shared/components/UbicacionSelector'
import seriesAPI from '../../api/apiSeries'
import { ESTADOS } from '@shared/utils/constants'
import { useGetUbicacionesActivas } from '../../hooks/useUbicaciones'
import { useTranslation } from 'react-i18next'

/**
 * ============================================
 * COMPONENTE: MoverSerieModal
 * ============================================
 *
 * Modal para mover una serie individual a otra ubicación y/o cambiar estado.
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {function} onSuccess - Callback después de mover
 * @param {Object} serie - Serie a mover
 * @param {Object} elemento - Elemento al que pertenece la serie
 */
function MoverSerieModal({
  isOpen,
  onClose,
  onSuccess,
  serie,
  elemento
}) {
  // ============================================
  // ESTADOS DEL FORMULARIO
  // ============================================
  const [formData, setFormData] = useState({
    ubicacion_destino: '',
    estado_destino: ESTADOS.BUENO,
    descripcion: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  // Cargar ubicaciones activas desde la base de datos
  const { ubicaciones, isLoading: isLoadingUbicaciones } = useGetUbicacionesActivas()

  // ============================================
  // EFECTOS
  // ============================================

  /**
   * Cargar datos iniciales al abrir
   */
  useEffect(() => {
    if (isOpen && serie) {
      setFormData({
        ubicacion_destino: '',
        estado_destino: serie.estado || ESTADOS.BUENO,
        descripcion: ''
      })
      setErrors({})
    }
  }, [isOpen, serie])

  // ============================================
  // VALIDACIÓN
  // ============================================

  const validateForm = () => {
    const newErrors = {}

    if (!formData.ubicacion_destino) {
      newErrors.ubicacion_destino = 'Selecciona una ubicación de destino'
    }

    if (!formData.estado_destino) {
      newErrors.estado_destino = 'Selecciona un estado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor corrige los errores')
      return
    }

    // Verificar si cambió algo
    if (
      formData.ubicacion_destino === serie.ubicacion &&
      formData.estado_destino === serie.estado
    ) {
      toast.info('No hay cambios que guardar')
      onClose()
      return
    }

    setIsSubmitting(true)

    try {
      // Actualizar la serie
      await seriesAPI.actualizar(serie.id, {
        numero_serie: serie.numero_serie, // Backend requiere este campo siempre
        ubicacion: formData.ubicacion_destino,
        estado: formData.estado_destino,
        descripcion: formData.descripcion || `Movida desde ${serie.ubicacion} a ${formData.ubicacion_destino}`
      })

      // Invalidar cache manualmente para asegurar actualización
      queryClient.invalidateQueries({
        queryKey: ['series', 'elemento', elemento.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos', elemento.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos', 'subcategoria']
      })

      toast.success(
        `Serie ${serie.numero_serie} movida a "${formData.ubicacion_destino}"`
      )

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al mover serie:', error)
      const mensaje = error.response?.data?.mensaje || error.message || 'Error al mover serie'
      toast.error(mensaje)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  if (!serie) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mover Serie - ${elemento?.nombre || ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>

        {/* ============================================
            INFORMACIÓN DE LA SERIE
            ============================================ */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Serie actual:
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">Nº Serie:</span>
              <span className="font-mono font-semibold text-slate-900">{serie.numero_serie}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">Ubicación:</span>
              <UbicacionBadge ubicacion={serie.ubicacion || 'Sin ubicación'} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">Estado:</span>
              <EstadoBadge estado={serie.estado} size="sm" />
            </div>
          </div>
        </div>

        {/* ============================================
            CAMPO: Ubicación Destino
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ubicación destino *
          </label>

          <UbicacionSelector
            value={formData.ubicacion_destino}
            onChange={(ubicacion) => {
              setFormData(prev => ({ ...prev, ubicacion_destino: ubicacion }))
              if (errors.ubicacion_destino) {
                setErrors(prev => ({ ...prev, ubicacion_destino: undefined }))
              }
            }}
            placeholder={isLoadingUbicaciones ? 'Cargando ubicaciones...' : 'Selecciona o escribe una ubicación'}
            disabled={isLoadingUbicaciones}
            error={errors.ubicacion_destino}
            ubicaciones={ubicaciones.map(u => u.nombre)}
          />
        </div>

        {/* ============================================
            CAMPO: Estado Destino
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estado *
          </label>

          <select
            value={formData.estado_destino}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, estado_destino: e.target.value }))
              if (errors.estado_destino) {
                setErrors(prev => ({ ...prev, estado_destino: undefined }))
              }
            }}
            className={`
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2
              ${errors.estado_destino
                ? 'border-red-300 focus:ring-red-500'
                : 'border-slate-300 focus:ring-blue-500'
              }
            `}
          >
            <option value="">Selecciona un estado</option>
            {Object.values(ESTADOS).map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>

          {errors.estado_destino && (
            <p className="mt-1 text-sm text-red-600">
              {errors.estado_destino}
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Descripción (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción <span className="text-slate-400">(opcional)</span>
          </label>

          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Ej: Movida para mantenimiento preventivo"
            rows={3}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              resize-none
            "
          />
        </div>

        {/* ============================================
            INFORMACIÓN
            ============================================ */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>
              La serie <strong>{serie.numero_serie}</strong> se moverá a la ubicación
              y estado seleccionados. Este cambio quedará registrado en el historial.
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Moviendo...' : 'Mover Serie'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default MoverSerieModal
