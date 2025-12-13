// ============================================
// FORMULARIO: DEVOLVER A BODEGA
// Modal rápido para devolver lotes a bodega principal
// ============================================

import { useState } from 'react'
import { toast } from 'sonner'
import { Package, CheckCircle, XCircle } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { EstadoBadge } from '../common/Badge'
import UbicacionBadge from '../common/UbicacionBadge'
import { useMoverCantidad } from '../../hooks/Uselotes'
import { ESTADOS } from '../../utils/constants'

/**
 * ============================================
 * COMPONENTE: DevolverBodegaModal
 * ============================================
 *
 * Modal para devolver rápidamente un lote completo a la bodega principal.
 * Mueve toda la cantidad, dejando el origen en 0 (se elimina automáticamente).
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { moverCantidad } = useMoverCantidad()

  // ============================================
  // HANDLERS
  // ============================================

  const handleDevolver = async (estadoDestino) => {
    if (!lote || !elemento) {
      toast.error('Datos incompletos')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        lote_origen_id: lote.id,
        cantidad: lote.cantidad, // Toda la cantidad
        ubicacion_destino: 'Bodega A',
        estado_destino: estadoDestino,
        descripcion: `Devolución completa desde ${ubicacionOrigen || 'ubicación desconocida'}`
      }

      await moverCantidad.mutateAsync(payload)

      toast.success(
        `${lote.cantidad} ${lote.cantidad === 1 ? 'unidad devuelta' : 'unidades devueltas'} a Bodega A como "${estadoDestino}"`
      )

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al devolver a bodega:', error)
      const mensaje = error.response?.data?.mensaje || error.message || 'Error al devolver'
      toast.error(mensaje)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  if (!lote) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Devolver a Bodega A"
      size="md"
    >
      <div>
        {/* ============================================
            INFORMACIÓN DEL LOTE
            ============================================ */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Se devolverán todas las unidades:
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">Elemento:</span>
              <span className="font-semibold text-slate-900">{elemento?.nombre || 'Sin nombre'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">Ubicación:</span>
              <UbicacionBadge ubicacion={ubicacionOrigen || 'Sin ubicación'} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">Estado:</span>
              <EstadoBadge estado={lote.estado} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">Cantidad:</span>
              <span className="text-2xl font-bold text-slate-900">
                {lote.cantidad}
              </span>
              <span className="text-sm text-slate-600">
                {lote.cantidad === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================
            PREGUNTA: ¿En qué estado?
            ============================================ */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3 text-center">
            ¿En qué estado quieres devolver a Bodega A?
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
              Al devolver, se moverán las <strong>{lote.cantidad} unidades</strong> a Bodega A,
              y el lote actual quedará en 0 (se eliminará automáticamente).
            </span>
          </p>
        </div>

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

export default DevolverBodegaModal
