// ============================================
// COMPONENTE: DescuentosSelector
// Selector de descuentos para cotizaciones
// ============================================

import { useState } from 'react'
import { Tag, Plus, Trash2, Percent, DollarSign } from 'lucide-react'
import Button from '../common/Button'
import { useGetDescuentos, useAplicarDescuento, useEliminarDescuentoCotizacion } from '../../hooks'

const DescuentosSelector = ({
  cotizacionId,
  descuentosAplicados = [],
  baseCalculo = 0,
  onDescuentoAplicado,
  onDescuentoEliminado,
  disabled = false
}) => {
  const [mostrarManual, setMostrarManual] = useState(false)
  const [descuentoManual, setDescuentoManual] = useState({ monto: '', esPorcentaje: false, notas: '' })

  // Obtener catálogo de descuentos
  const { data: catalogoDescuentos, isLoading: cargandoCatalogo } = useGetDescuentos()

  // Mutations
  const aplicarMutation = useAplicarDescuento()
  const eliminarMutation = useEliminarDescuentoCotizacion()

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // Aplicar descuento predefinido
  const handleAplicarPredefinido = async (descuento) => {
    try {
      await aplicarMutation.mutateAsync({
        cotizacionId,
        datos: { descuento_id: descuento.id }
      })
      if (onDescuentoAplicado) onDescuentoAplicado()
    } catch (error) {
      console.error('Error aplicando descuento:', error)
    }
  }

  // Aplicar descuento manual
  const handleAplicarManual = async () => {
    if (!descuentoManual.monto || parseFloat(descuentoManual.monto) <= 0) return

    try {
      await aplicarMutation.mutateAsync({
        cotizacionId,
        datos: {
          monto: parseFloat(descuentoManual.monto),
          es_porcentaje: descuentoManual.esPorcentaje,
          notas: descuentoManual.notas || 'Descuento manual'
        }
      })
      setDescuentoManual({ monto: '', esPorcentaje: false, notas: '' })
      setMostrarManual(false)
      if (onDescuentoAplicado) onDescuentoAplicado()
    } catch (error) {
      console.error('Error aplicando descuento manual:', error)
    }
  }

  // Eliminar descuento aplicado
  const handleEliminar = async (descuentoAplicadoId) => {
    try {
      await eliminarMutation.mutateAsync({
        cotizacionId,
        descuentoAplicadoId
      })
      if (onDescuentoEliminado) onDescuentoEliminado()
    } catch (error) {
      console.error('Error eliminando descuento:', error)
    }
  }

  // Calcular valor del descuento según tipo
  const calcularValorDescuento = (descuento) => {
    if (descuento.tipo === 'porcentaje') {
      return baseCalculo * (parseFloat(descuento.valor) / 100)
    }
    return parseFloat(descuento.valor)
  }

  return (
    <div className="space-y-4">
      {/* DESCUENTOS APLICADOS */}
      {descuentosAplicados.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Descuentos aplicados</h4>
          <div className="space-y-2">
            {descuentosAplicados.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {d.descuento_nombre || d.notas || 'Descuento manual'}
                    </p>
                    {d.es_porcentaje && (
                      <p className="text-xs text-green-600">Porcentaje aplicado</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-green-700">
                    -{formatearMoneda(d.monto)}
                  </span>
                  {!disabled && (
                    <button
                      onClick={() => handleEliminar(d.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={eliminarMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AGREGAR DESCUENTOS */}
      {!disabled && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Agregar descuento</h4>

          {/* Catálogo de descuentos predefinidos */}
          {!cargandoCatalogo && catalogoDescuentos?.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {catalogoDescuentos.map((descuento) => (
                <button
                  key={descuento.id}
                  onClick={() => handleAplicarPredefinido(descuento)}
                  disabled={aplicarMutation.isPending}
                  className="flex items-center justify-between p-2 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{descuento.nombre}</p>
                    <p className="text-xs text-slate-500">{descuento.descripcion}</p>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {descuento.tipo === 'porcentaje'
                      ? `${descuento.valor}%`
                      : formatearMoneda(descuento.valor)
                    }
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Toggle descuento manual */}
          {!mostrarManual ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setMostrarManual(true)}
              className="text-slate-600"
            >
              Agregar descuento manual
            </Button>
          ) : (
            <div className="bg-slate-100 rounded-lg p-3 space-y-3">
              <div className="flex gap-2">
                {/* Tipo de descuento */}
                <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDescuentoManual(prev => ({ ...prev, esPorcentaje: false }))}
                    className={`px-3 py-2 text-sm flex items-center gap-1 ${
                      !descuentoManual.esPorcentaje
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    Fijo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescuentoManual(prev => ({ ...prev, esPorcentaje: true }))}
                    className={`px-3 py-2 text-sm flex items-center gap-1 ${
                      descuentoManual.esPorcentaje
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Percent className="w-3 h-3" />
                    %
                  </button>
                </div>

                {/* Monto */}
                <input
                  type="number"
                  value={descuentoManual.monto}
                  onChange={(e) => setDescuentoManual(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder={descuentoManual.esPorcentaje ? '10' : '50000'}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  min="0"
                  step={descuentoManual.esPorcentaje ? '1' : '1000'}
                />
              </div>

              {/* Notas */}
              <input
                type="text"
                value={descuentoManual.notas}
                onChange={(e) => setDescuentoManual(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Motivo del descuento (opcional)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />

              {/* Vista previa */}
              {descuentoManual.monto && (
                <p className="text-xs text-slate-600">
                  Descuento: {' '}
                  <span className="font-medium text-green-600">
                    -{descuentoManual.esPorcentaje
                      ? formatearMoneda(baseCalculo * (parseFloat(descuentoManual.monto) / 100))
                      : formatearMoneda(parseFloat(descuentoManual.monto))
                    }
                  </span>
                </p>
              )}

              {/* Botones */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAplicarManual}
                  loading={aplicarMutation.isPending}
                  disabled={!descuentoManual.monto || parseFloat(descuentoManual.monto) <= 0}
                >
                  Aplicar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMostrarManual(false)
                    setDescuentoManual({ monto: '', esPorcentaje: false, notas: '' })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DescuentosSelector
