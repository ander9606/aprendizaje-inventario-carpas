// ============================================
// FORMULARIO: DEVOLVER A BODEGA
// Modal rápido para devolver lotes a bodega principal
// ============================================

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { EstadoBadge } from '@shared/components/Badge'
import UbicacionBadge from '@shared/components/UbicacionBadge'
import { useMoverCantidad } from '../../hooks/useLotes'
import { useGetUbicacionPrincipal } from '../../hooks/useUbicaciones'
import { ESTADOS } from '@shared/utils/constants'
import Spinner from '@shared/components/Spinner'
import { useTranslation } from 'react-i18next'

/**
 * ============================================
 * COMPONENTE: DevolverBodegaModal
 * ============================================
 *
 * Modal para devolver rápidamente un lote completo a la bodega principal.
 * Mueve toda la cantidad, dejando el origen en 0 (se elimina automáticamente).
 *
 * AHORA USA LA UBICACIÓN PRINCIPAL DINÁMICA del sistema.
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar
 * @param {function} onSuccess - Callback después de devolver
 * @param {Object} lote - Lote a devolver
 * @param {string} ubicacionOrigen - Ubicación actual del lote
 * @param {Object} elemento - Elemento al que pertenece
 */
function DevolverBodegaModal({
  isOpen,
  onClose,
  onSuccess,
  lote,
  ubicacionOrigen,
  elemento
}) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { moverCantidad } = useMoverCantidad()
  const queryClient = useQueryClient()

  // ============================================
  // OBTENER UBICACIÓN PRINCIPAL
  // ============================================
  const { ubicacion: ubicacionPrincipal, isLoading: isLoadingUbicacion } = useGetUbicacionPrincipal()

  // ============================================
  // HANDLERS
  // ============================================

  const handleDevolver = async (estadoDestino) => {
    if (!lote || !elemento) {
      toast.error(t('inventory.incompleteData'))
      return
    }

    if (!ubicacionPrincipal) {
      toast.error(t('inventory.noMainLocationError'))
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        lote_origen_id: lote.id,
        cantidad: lote.cantidad, // Toda la cantidad
        ubicacion_destino: ubicacionPrincipal.nombre,
        estado_destino: estadoDestino,
        descripcion: `Devolución completa desde ${ubicacionOrigen || 'ubicación desconocida'}`
      }

      await moverCantidad.mutateAsync(payload)

      // Invalidar cache manualmente para asegurar actualización
      queryClient.invalidateQueries({
        queryKey: ['lotes', 'elemento', elemento.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos', elemento.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['elementos', 'subcategoria']
      })

      toast.success(
        t('inventory.unitsReturned', {
          qty: lote.cantidad,
          unitText: lote.cantidad === 1 ? t('inventory.unitReturned') : t('inventory.unitsReturnedPlural'),
          name: ubicacionPrincipal.nombre,
          state: estadoDestino
        })
      )

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al devolver a bodega:', error)
      const mensaje = error.response?.data?.mensaje || error.message || t('inventory.errorReturning')
      toast.error(mensaje)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  if (!lote) return null

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
            INFORMACIÓN DEL LOTE
            ============================================ */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-3">
            {t('inventory.allUnitsWillBeReturned')}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">{t('inventory.elementLabel')}</span>
              <span className="font-semibold text-slate-900">{elemento?.nombre || 'Sin nombre'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">{t('common.location')}:</span>
              <UbicacionBadge ubicacion={ubicacionOrigen || t('inventory.noLocation')} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">{t('common.status')}:</span>
              <EstadoBadge estado={lote.estado} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">{t('common.quantity')}:</span>
              <span className="text-2xl font-bold text-slate-900">
                {lote.cantidad}
              </span>
              <span className="text-sm text-slate-600">
                {lote.cantidad === 1 ? t('common.unit') : t('common.units')}
              </span>
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
              <span dangerouslySetInnerHTML={{ __html: t('inventory.returnBatchInfo', { qty: lote.cantidad, name: nombreUbicacionPrincipal }) }} />
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

export default DevolverBodegaModal
