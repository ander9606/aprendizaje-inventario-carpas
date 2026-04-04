// ============================================
// FORMULARIO: DEVOLVER SERIE A BODEGA
// Modal rápido para devolver series individuales a bodega principal
// ============================================

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { EstadoBadge } from '@shared/components/Badge'
import UbicacionBadge from '@shared/components/UbicacionBadge'
import seriesAPI from '../../api/apiSeries'
import { useGetUbicacionPrincipal } from '../../hooks/useUbicaciones'
import { ESTADOS } from '@shared/utils/constants'
import Spinner from '@shared/components/Spinner'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      toast.error(t('inventory.incompleteData'))
      return
    }

    if (!ubicacionPrincipal) {
      toast.error(t('inventory.noMainLocationError'))
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
        t('inventory.serieReturnedSuccess', { serial: serie.numero_serie, name: ubicacionPrincipal.nombre, state: estadoDestino })
      )

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al devolver serie a bodega:', error)
      const mensaje = error.response?.data?.mensaje || error.message || t('inventory.errorReturning')
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
      <Modal isOpen={isOpen} onClose={onClose} title={t('common.loading')} size="md">
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" text={t('inventory.loadingMainLocation')} />
        </div>
      </Modal>
    )
  }

  // Advertencia si no hay ubicación principal
  if (!ubicacionPrincipal) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('inventory.warning')} size="md">
        <div className="p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t('inventory.noMainLocationConfigured')}
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            {t('inventory.configureMainLocation')}
          </p>
          <Button onClick={onClose} variant="primary">
            {t('inventory.understood')}
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
      title={t('inventory.returnToWarehouseTitle', { name: nombreUbicacionPrincipal })}
      size="md"
    >
      <div>
        {/* ============================================
            INFORMACIÓN DE LA SERIE
            ============================================ */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-3">
            {t('inventory.thisSeriesWillBeReturned')}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">{t('inventory.elementLabel')}</span>
              <span className="font-semibold text-slate-900">{elemento?.nombre || 'Sin nombre'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">{t('inventory.serieNumber')}</span>
              <span className="font-mono font-semibold text-slate-900">{serie.numero_serie}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">{t('common.location')}:</span>
              <UbicacionBadge ubicacion={serie.ubicacion || t('inventory.noLocation')} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-24">{t('inventory.currentState')}</span>
              <EstadoBadge estado={serie.estado} size="sm" />
            </div>
          </div>
        </div>

        {/* ============================================
            PREGUNTA: ¿En qué estado?
            ============================================ */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3 text-center">
            {t('inventory.whatStateToReturn', { name: nombreUbicacionPrincipal })}
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
                <span className="font-semibold text-green-700">{t('states.good')}</span>
                <span className="text-xs text-slate-600">{t('inventory.workingCorrectly')}</span>
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
                <span className="font-semibold text-red-700">{t('states.damaged')}</span>
                <span className="text-xs text-slate-600">{t('inventory.requiresRepair')}</span>
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
              <span dangerouslySetInnerHTML={{ __html: t('inventory.returnSerieInfo', { serial: serie.numero_serie, name: nombreUbicacionPrincipal }) }} />
            </span>
          </p>
        </div>

        {/* Badge de ubicación principal */}
        {!!ubicacionPrincipal.es_principal && (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-slate-600">
            <span>⭐</span>
            <span>{t('inventory.systemMainLocation')}</span>
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
            {t('common.cancel')}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export default DevolverSerieBodegaModal
