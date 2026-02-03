// ============================================
// MODAL: RetornoElementosModal
// Registrar retorno de elementos y finalizar alquiler
// ============================================

import { useState, useEffect } from 'react'
import {
  X,
  Package,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  LogIn,
  DollarSign
} from 'lucide-react'
import {
  useGetAlquilerCompleto,
  useMarcarRetornoAlquiler
} from '../../hooks/useAlquileres'
import Button from '../common/Button'
import Spinner from '../common/Spinner'

/**
 * RetornoElementosModal
 *
 * Modal para registrar el estado de retorno de cada elemento
 * y finalizar el alquiler.
 *
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {Function} onClose - Callback al cerrar
 * @param {Object} alquiler - Datos del alquiler
 * @param {Function} onSuccess - Callback al completar exitosamente
 */
const RetornoElementosModal = ({
  isOpen,
  onClose,
  alquiler,
  onSuccess
}) => {
  // ============================================
  // ESTADO
  // ============================================
  const [notasRetorno, setNotasRetorno] = useState('')
  const [retornos, setRetornos] = useState({})

  // ============================================
  // QUERIES Y MUTATIONS
  // ============================================
  const { alquiler: alquilerCompleto, isLoading: loadingAlquiler } = useGetAlquilerCompleto(
    alquiler?.id
  )
  const marcarRetorno = useMarcarRetornoAlquiler()

  // ============================================
  // EFECTOS
  // ============================================

  // Inicializar estados de retorno
  useEffect(() => {
    if (alquilerCompleto?.elementos) {
      const estadosIniciales = {}
      alquilerCompleto.elementos.forEach(elem => {
        estadosIniciales[elem.id] = {
          estado_retorno: 'bueno',
          costo_dano: 0,
          notas_retorno: '',
          unidades_perdidas: 0
        }
      })
      setRetornos(estadosIniciales)
    }
  }, [alquilerCompleto])

  // ============================================
  // HELPERS
  // ============================================

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatMoneda = (valor) => {
    if (!valor && valor !== 0) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor)
  }

  /**
   * Calcular total de daños
   */
  const calcularTotalDanos = () => {
    return Object.values(retornos).reduce((total, ret) => {
      return total + (parseFloat(ret.costo_dano) || 0)
    }, 0)
  }

  /**
   * Calcular diferencia con depósito
   */
  const calcularDiferencia = () => {
    const deposito = alquilerCompleto?.deposito_cobrado || 0
    const danos = calcularTotalDanos()
    return deposito - danos
  }

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Actualizar estado de retorno de un elemento
   */
  const handleCambiarEstado = (elementoId, campo, valor) => {
    setRetornos(prev => ({
      ...prev,
      [elementoId]: {
        ...prev[elementoId],
        [campo]: valor
      }
    }))
  }

  /**
   * Confirmar retorno
   */
  const handleConfirmar = async () => {
    try {
      // Construir array de retornos
      const retornosArray = Object.entries(retornos).map(([elementoId, datos]) => ({
        elemento_id: parseInt(elementoId),
        estado_retorno: datos.estado_retorno,
        costo_dano: parseFloat(datos.costo_dano) || 0,
        notas_retorno: datos.notas_retorno
      }))

      await marcarRetorno.mutateAsync({
        id: alquiler.id,
        datos: {
          fecha_retorno_real: new Date().toISOString(),
          notas_retorno: notasRetorno,
          retornos: retornosArray
        }
      })

      onSuccess()
    } catch (error) {
      console.error('Error al marcar retorno:', error)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null

  const totalDanos = calcularTotalDanos()
  const diferencia = calcularDiferencia()
  const elementos = alquilerCompleto?.elementos || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-green-600" />
              Registrar Retorno
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Registra el estado de cada elemento devuelto
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info del alquiler */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{alquiler?.cliente_nombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{alquiler?.evento_nombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Retorno esperado: {formatFecha(alquiler?.fecha_retorno_esperado)}</span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingAlquiler ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" text="Cargando elementos..." />
            </div>
          ) : elementos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay elementos para retornar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {elementos.map((elem) => {
                const retorno = retornos[elem.id] || {}
                const tieneProblema = retorno.estado_retorno !== 'bueno'

                return (
                  <div
                    key={elem.id}
                    className={`
                      border rounded-lg p-4
                      ${tieneProblema ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}
                    `}
                  >
                    {/* Header del elemento */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-slate-400" />
                        <div>
                          <span className="font-medium text-slate-900">
                            {elem.elemento_nombre}
                          </span>
                          <span className="text-slate-500 ml-2">
                            {elem.serie_codigo || elem.lote_codigo}
                            {elem.cantidad_lote > 1 && ` (${elem.cantidad_lote} unidades)`}
                          </span>
                        </div>
                      </div>
                      <span className={`
                        text-xs px-2 py-1 rounded-full
                        ${elem.estado_salida === 'bueno' ? 'bg-green-100 text-green-700' : ''}
                        ${elem.estado_salida === 'nuevo' ? 'bg-blue-100 text-blue-700' : ''}
                      `}>
                        Salió: {elem.estado_salida}
                      </span>
                    </div>

                    {/* Campos de retorno */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Estado */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Estado de retorno
                        </label>
                        <select
                          value={retorno.estado_retorno || 'bueno'}
                          onChange={(e) => handleCambiarEstado(elem.id, 'estado_retorno', e.target.value)}
                          className={`
                            w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                            ${retorno.estado_retorno === 'bueno' ? 'border-green-300 bg-green-50' : ''}
                            ${retorno.estado_retorno === 'dañado' ? 'border-amber-300 bg-amber-50' : ''}
                            ${retorno.estado_retorno === 'perdido' ? 'border-red-300 bg-red-50' : ''}
                          `}
                        >
                          <option value="bueno">Bueno</option>
                          <option value="dañado">Dañado</option>
                          <option value="perdido">Perdido</option>
                        </select>
                      </div>

                      {/* Costo daño */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Costo de daño
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <input
                            type="number"
                            min="0"
                            value={retorno.costo_dano || ''}
                            onChange={(e) => handleCambiarEstado(elem.id, 'costo_dano', e.target.value)}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Notas */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Notas
                        </label>
                        <input
                          type="text"
                          value={retorno.notas_retorno || ''}
                          onChange={(e) => handleCambiarEstado(elem.id, 'notas_retorno', e.target.value)}
                          placeholder="Observaciones..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Notas generales */}
              <div className="border-t border-slate-200 pt-4 mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas generales del retorno (opcional)
                </label>
                <textarea
                  value={notasRetorno}
                  onChange={(e) => setNotasRetorno(e.target.value)}
                  placeholder="Observaciones generales del retorno..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Resumen financiero */}
              <div className="bg-slate-50 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  Resumen Financiero
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total daños:</span>
                    <span className={`font-medium ${totalDanos > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatMoneda(totalDanos)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Depósito cobrado:</span>
                    <span className="font-medium text-slate-900">
                      {formatMoneda(alquilerCompleto?.deposito_cobrado || 0)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">
                      {diferencia >= 0 ? 'Saldo a devolver:' : 'Saldo pendiente:'}
                    </span>
                    <span className={`font-bold text-lg ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoneda(Math.abs(diferencia))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-sm text-slate-500">
            {elementos.length > 0 && (
              <span>
                {elementos.filter(e => retornos[e.id]?.estado_retorno === 'bueno').length} de {elementos.length} en buen estado
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmar}
              disabled={elementos.length === 0 || marcarRetorno.isPending}
              icon={marcarRetorno.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            >
              {marcarRetorno.isPending ? 'Procesando...' : 'Confirmar Retorno'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetornoElementosModal
