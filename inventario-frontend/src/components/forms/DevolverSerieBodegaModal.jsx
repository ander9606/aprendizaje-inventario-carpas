// ============================================
// FORMULARIO: DEVOLVER SERIE A BODEGA
// Modal rápido para devolver series individuales a bodega principal
// ============================================

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { EstadoBadge } from '../common/Badge'
import UbicacionBadge from '../common/UbicacionBadge'
import { seriesAPI } from '../../api'
import { useGetUbicacionPrincipal } from '../../hooks/Useubicaciones'
import { ESTADOS } from '../../utils/constants'
import Spinner from '../common/Spinner'

/**
 * ============================================
 * COMPONENTE: DevolverSerieBodegaModal
 * ============================================
 *
 * Modal para devolver rápidamente una serie individual a la bodega principal.
 *
 * AHORA USA LA UBICACIÓN PRINCIPAL DINÁMICA del sistema.
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {function} onSuccess - Callback después de devolver
 * @param {Object} serie - Serie a devolver
 * @param {Object} elemento - Elemento al que pertenece la serie
 */
function DevolverSerieBodegaModal({
  isOpen,
  onClose,
  onSuccess,
  serie,
  elemento
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // ============================================
  // OBTENER UBICACIÓN PRINCIPAL
  // ============================================
  const { ubicacion: ubicacionPrincipal, isLoading: isLoadingUbicacion } = useGetUbicacionPrincipal()

  // ============================================
  // HANDLERS
  // ============================================

  const handleDevolver = async (estadoDestino) => {
    if (!serie || !elemento) {
      toast.error('Datos incompletos')
      return
    }

    if (!ubicacionPrincipal) {
      toast.error('No hay ubicación principal configurada')
      return
    }

    setIsSubmitting(true)

    try {
      // Actualizar la serie con la nueva ubicación y estado
      await seriesAPI.actualizar(serie.id, {
        numero_serie: serie.numero_serie, // Backend requiere este campo siempre
        ubicacion: ubicacionPrincipal.nombre,
        estado: estadoDestino
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
        `Serie ${serie.numero_serie} devuelta a ${ubicacionPrincipal.nombre} como "${estadoDestino}"`
      )

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al devolver serie a bodega:', error)
      const mensaje = error.response?.data?.mensaje || error.message || 'Error al devolver'
      toast.error(mensaje)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  if (!serie) return null

  // Mostrar spinner mientras carga la ubicación principal
  if (isLoadingUbicacion) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando..." size="md">
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" text="Cargando ubicación principal..." />
        </div>
      </Modal>
    )
  }

  // Advertencia si no hay ubicación principal
  if (!ubicacionPrincipal) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Advertencia" size="md">
        <div className="p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay ubicación principal configurada
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Configura una ubicación como principal desde el menú de Ubicaciones para poder usar esta función.
          </p>
          <Button onClick={onClose} variant="primary">
            Entendido
          </Button>
        </div>
      </Modal>
    )
  }

  const nombreUbicacionPrincipal = ubicacionPrincipal.nombre

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Devolver a ${nombreUbicacionPrincipal}`}
      size="md"
    >
      <div>
        {/* ============================================
            INFORMACIÓN DE LA SERIE
            ============================================ */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Se devolverá esta serie:
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">Elemento:</span>
              <span className="font-semibold text-slate-900">{elemento?.nombre || 'Sin nombre'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">Nº Serie:</span>
              <span className="font-mono font-semibold text-slate-900">{serie.numero_serie}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">Ubicación:</span>
              <UbicacionBadge ubicacion={serie.ubicacion || 'Sin ubicación'} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">Estado actual:</span>
              <EstadoBadge estado={serie.estado} size="sm" />
            </div>
          </div>
        </div>

        {/* ============================================
            PREGUNTA: ¿En qué estado?
            ============================================ */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3 text-center">
            ¿En qué estado quieres devolver a {nombreUbicacionPrincipal}?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Botón: Devolver como Bueno */}
            <button
              onClick={() => handleDevolver(ESTADOS.BUENO)}
              disabled={isSubmitting}
              className="
                p-4 border-2 border-green-300 rounded-lg
                hover:bg-green-50 hover:border-green-500
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-green-500
              "
            >
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="font-semibold text-green-700">Bueno</span>
                <span className="text-xs text-slate-600">Funcionando correctamente</span>
              </div>
            </button>

            {/* Botón: Devolver como Dañado */}
            <button
              onClick={() => handleDevolver(ESTADOS.DANADO)}
              disabled={isSubmitting}
              className="
                p-4 border-2 border-red-300 rounded-lg
                hover:bg-red-50 hover:border-red-500
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-red-500
              "
            >
              <div className="flex flex-col items-center gap-2">
                <XCircle className="w-8 h-8 text-red-600" />
                <span className="font-semibold text-red-700">Dañado</span>
                <span className="text-xs text-slate-600">Requiere reparación</span>
              </div>
            </button>
          </div>
        </div>

        {/* ============================================
            INFORMACIÓN
            ============================================ */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>
              Al devolver, la serie <strong>{serie.numero_serie}</strong> se moverá
              a {nombreUbicacionPrincipal} y cambiará al estado que selecciones.
            </span>
          </p>
        </div>

        {/* Badge de ubicación principal */}
        {ubicacionPrincipal.es_principal && (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-slate-600">
            <span>⭐</span>
            <span>Ubicación principal del sistema</span>
          </div>
        )}

        {/* ============================================
            FOOTER: Botón Cancelar
            ============================================ */}
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full"
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export default DevolverSerieBodegaModal
