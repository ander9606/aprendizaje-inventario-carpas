// ============================================
// COMPONENTE: AprobarCotizacionModal
// Modal para aprobar cotización con verificación de disponibilidad
// ============================================

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Calendar, User, Package, DollarSign } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Spinner from '../common/Spinner'
import { useVerificarDisponibilidadCotizacion } from '../../hooks/useDisponibilidad'
import { useGetCotizacionCompleta } from '../../hooks/cotizaciones'

/**
 * AprobarCotizacionModal
 *
 * Modal que muestra resumen de cotización y verificación de disponibilidad
 * antes de aprobar
 */
const AprobarCotizacionModal = ({
  isOpen,
  onClose,
  cotizacionId,
  onAprobar,
  isAprobando = false
}) => {
  const [depositoCobrado, setDepositoCobrado] = useState('')
  const [notasSalida, setNotasSalida] = useState('')
  const [forzar, setForzar] = useState(false)

  // Cargar cotización completa
  const { cotizacion, isLoading: loadingCotizacion } = useGetCotizacionCompleta(
    isOpen ? cotizacionId : null
  )

  // Verificar disponibilidad
  const { disponibilidad, isLoading: loadingDisponibilidad } = useVerificarDisponibilidadCotizacion(
    isOpen ? cotizacionId : null,
    isOpen && !!cotizacionId
  )

  // Reset form cuando se abre
  useEffect(() => {
    if (isOpen) {
      setDepositoCobrado('')
      setNotasSalida('')
      setForzar(false)
    }
  }, [isOpen])

  // Helpers
  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const handleAprobar = () => {
    onAprobar({
      id: cotizacionId,
      opciones: {
        deposito_cobrado: depositoCobrado ? parseFloat(depositoCobrado) : null,
        notas_salida: notasSalida || null,
        forzar: forzar
      }
    })
  }

  const isLoading = loadingCotizacion || loadingDisponibilidad
  const hayProblemas = disponibilidad?.hay_problemas || false
  const puedeAprobar = !hayProblemas || forzar

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aprobar Cotización"
      size="lg"
    >
      {isLoading ? (
        <div className="py-12">
          <Spinner size="lg" text="Verificando disponibilidad..." />
        </div>
      ) : !cotizacion ? (
        <div className="py-12 text-center text-slate-500">
          No se pudo cargar la cotización
        </div>
      ) : (
        <div className="space-y-6">
          {/* RESUMEN DE COTIZACIÓN */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-lg">
                Cotización #{cotizacion.id}
              </h3>
              <span className="text-xl font-bold text-slate-900">
                {formatearMoneda(cotizacion.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500">Cliente</p>
                  <p className="font-medium">{cotizacion.cliente_nombre}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500">Fechas</p>
                  <p className="font-medium">
                    {formatearFecha(cotizacion.fecha_montaje || cotizacion.fecha_evento)}
                    {' → '}
                    {formatearFecha(cotizacion.fecha_desmontaje || cotizacion.fecha_evento)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 col-span-2">
                <Package className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500">Evento</p>
                  <p className="font-medium">{cotizacion.evento_nombre || 'Sin nombre'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* VERIFICACIÓN DE DISPONIBILIDAD */}
          <div className={`
            rounded-lg p-4 border-2
            ${hayProblemas
              ? 'bg-amber-50 border-amber-300'
              : 'bg-green-50 border-green-300'
            }
          `}>
            <div className="flex items-center gap-2 mb-3">
              {hayProblemas ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <h4 className={`font-semibold ${hayProblemas ? 'text-amber-800' : 'text-green-800'}`}>
                {hayProblemas ? 'Hay elementos faltantes' : 'Todos los elementos disponibles'}
              </h4>
            </div>

            {disponibilidad && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {disponibilidad.elementos.map((elemento) => (
                  <div
                    key={elemento.elemento_id}
                    className={`
                      flex items-center justify-between p-2 rounded text-sm
                      ${elemento.estado === 'ok'
                        ? 'bg-green-100/50'
                        : 'bg-red-100/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {elemento.estado === 'ok' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium">{elemento.elemento_nombre}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span>
                        Necesitas: <strong>{elemento.cantidad_requerida}</strong>
                      </span>
                      <span className={elemento.estado === 'ok' ? 'text-green-600' : 'text-red-500'}>
                        Disponibles: <strong>{elemento.disponibles}</strong>
                      </span>
                      {elemento.faltantes > 0 && (
                        <span className="text-red-600 font-bold">
                          Faltan: {elemento.faltantes}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hayProblemas && (
              <div className="mt-4 pt-3 border-t border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forzar}
                    onChange={(e) => setForzar(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-amber-800">
                    Aprobar de todas formas (forzar aprobación)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* DATOS ADICIONALES */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Depósito Cobrado (opcional)
              </label>
              <input
                type="number"
                value={depositoCobrado}
                onChange={(e) => setDepositoCobrado(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas de Salida (opcional)
              </label>
              <textarea
                value={notasSalida}
                onChange={(e) => setNotasSalida(e.target.value)}
                rows={2}
                placeholder="Notas adicionales para el alquiler..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isAprobando}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              icon={<CheckCircle className="w-5 h-5" />}
              onClick={handleAprobar}
              loading={isAprobando}
              disabled={isAprobando || !puedeAprobar}
              className="bg-green-600 hover:bg-green-700"
            >
              {hayProblemas ? 'Aprobar con Advertencia' : 'Aprobar Cotización'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AprobarCotizacionModal
