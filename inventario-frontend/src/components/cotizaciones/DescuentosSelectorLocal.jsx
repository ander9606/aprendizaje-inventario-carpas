// ============================================
// COMPONENTE: DescuentosSelectorLocal
// Selector de descuentos para formulario de cotización
// Funciona con estado local (sin guardar al backend)
// ============================================

import { useState } from 'react'
import { Tag, Plus, Trash2, Percent, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '../common/Button'
import { useGetDescuentos } from '../../hooks'

const DescuentosSelectorLocal = ({
  descuentosAplicados = [],
  onDescuentosChange,
  baseCalculo = 0,
  disabled = false
}) => {
  const [mostrarSelector, setMostrarSelector] = useState(false)
  const [mostrarManual, setMostrarManual] = useState(false)
  const [descuentoManual, setDescuentoManual] = useState({ valor: '', tipo: 'porcentaje', descripcion: '' })

  // Obtener catálogo de descuentos
  const { data: catalogoDescuentos, isLoading: cargandoCatalogo } = useGetDescuentos()

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // Calcular monto de un descuento
  const calcularMontoDescuento = (descuento) => {
    if (descuento.tipo === 'porcentaje') {
      return baseCalculo * (parseFloat(descuento.valor) / 100)
    }
    return parseFloat(descuento.valor)
  }

  // Calcular total de todos los descuentos
  const calcularTotalDescuentos = () => {
    return descuentosAplicados.reduce((total, d) => total + calcularMontoDescuento(d), 0)
  }

  // Aplicar descuento predefinido
  const handleAplicarPredefinido = (descuento) => {
    // Verificar si ya está aplicado
    const yaAplicado = descuentosAplicados.some(d => d.descuento_id === descuento.id)
    if (yaAplicado) return

    const nuevoDescuento = {
      descuento_id: descuento.id,
      nombre: descuento.nombre,
      tipo: descuento.tipo,
      valor: parseFloat(descuento.valor),
      descripcion: descuento.descripcion
    }

    onDescuentosChange([...descuentosAplicados, nuevoDescuento])
    setMostrarSelector(false)
  }

  // Aplicar descuento manual
  const handleAplicarManual = () => {
    if (!descuentoManual.valor || parseFloat(descuentoManual.valor) <= 0) return

    const nuevoDescuento = {
      descuento_id: null,
      nombre: descuentoManual.descripcion || 'Descuento manual',
      tipo: descuentoManual.tipo,
      valor: parseFloat(descuentoManual.valor),
      descripcion: descuentoManual.descripcion || 'Descuento manual'
    }

    onDescuentosChange([...descuentosAplicados, nuevoDescuento])
    setDescuentoManual({ valor: '', tipo: 'porcentaje', descripcion: '' })
    setMostrarManual(false)
  }

  // Eliminar descuento aplicado
  const handleEliminar = (index) => {
    const nuevosDescuentos = descuentosAplicados.filter((_, i) => i !== index)
    onDescuentosChange(nuevosDescuentos)
  }

  // Filtrar descuentos que no están aplicados
  const descuentosDisponibles = (catalogoDescuentos || []).filter(
    d => d.activo && !descuentosAplicados.some(aplicado => aplicado.descuento_id === d.id)
  )

  return (
    <div className="space-y-3">
      {/* HEADER CON TOTAL */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-slate-700">Descuentos</span>
          {descuentosAplicados.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {descuentosAplicados.length}
            </span>
          )}
        </div>
        {descuentosAplicados.length > 0 && (
          <span className="text-sm font-semibold text-green-600">
            -{formatearMoneda(calcularTotalDescuentos())}
          </span>
        )}
      </div>

      {/* DESCUENTOS APLICADOS */}
      {descuentosAplicados.length > 0 && (
        <div className="space-y-2">
          {descuentosAplicados.map((d, index) => {
            const monto = calcularMontoDescuento(d)
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`p-1 rounded ${d.descuento_id ? 'bg-green-200' : 'bg-slate-200'}`}>
                    {d.tipo === 'porcentaje' ? (
                      <Percent className="w-3 h-3 text-green-700" />
                    ) : (
                      <DollarSign className="w-3 h-3 text-green-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {d.nombre}
                    </p>
                    <p className="text-xs text-green-600">
                      {d.tipo === 'porcentaje' ? `${d.valor}%` : formatearMoneda(d.valor)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-700 text-sm">
                    -{formatearMoneda(monto)}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleEliminar(index)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* BOTÓN AGREGAR DESCUENTO */}
      {!disabled && !mostrarSelector && !mostrarManual && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setMostrarSelector(true)}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          Agregar descuento
        </Button>
      )}

      {/* SELECTOR DE DESCUENTOS PREDEFINIDOS */}
      {mostrarSelector && !disabled && (
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Seleccionar descuento</h4>
            <button
              type="button"
              onClick={() => setMostrarSelector(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Catálogo de descuentos predefinidos */}
          {cargandoCatalogo ? (
            <p className="text-sm text-slate-500 text-center py-4">Cargando descuentos...</p>
          ) : descuentosDisponibles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {descuentosDisponibles.map((descuento) => {
                const montoPreview = calcularMontoDescuento(descuento)
                return (
                  <button
                    key={descuento.id}
                    type="button"
                    onClick={() => handleAplicarPredefinido(descuento)}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{descuento.nombre}</p>
                      <p className="text-xs text-slate-500 truncate">{descuento.descripcion}</p>
                    </div>
                    <div className="text-right ml-2">
                      <span className="text-sm font-semibold text-green-600">
                        {descuento.tipo === 'porcentaje'
                          ? `${descuento.valor}%`
                          : formatearMoneda(descuento.valor)
                        }
                      </span>
                      {baseCalculo > 0 && descuento.tipo === 'porcentaje' && (
                        <p className="text-xs text-slate-400">
                          -{formatearMoneda(montoPreview)}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-2 mb-3">
              {catalogoDescuentos?.length > 0
                ? 'Todos los descuentos ya están aplicados'
                : 'No hay descuentos predefinidos'}
            </p>
          )}

          {/* Toggle descuento manual */}
          {!mostrarManual ? (
            <div className="border-t border-slate-200 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setMostrarManual(true)}
                className="text-slate-600 w-full justify-center"
              >
                Agregar descuento manual
              </Button>
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide">Descuento manual</h5>

              <div className="flex gap-2">
                {/* Tipo de descuento */}
                <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDescuentoManual(prev => ({ ...prev, tipo: 'porcentaje' }))}
                    className={`px-3 py-2 text-sm flex items-center gap-1 ${
                      descuentoManual.tipo === 'porcentaje'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Percent className="w-3 h-3" />
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescuentoManual(prev => ({ ...prev, tipo: 'fijo' }))}
                    className={`px-3 py-2 text-sm flex items-center gap-1 ${
                      descuentoManual.tipo === 'fijo'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    $
                  </button>
                </div>

                {/* Valor */}
                <input
                  type="number"
                  value={descuentoManual.valor}
                  onChange={(e) => setDescuentoManual(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder={descuentoManual.tipo === 'porcentaje' ? 'Ej: 10' : 'Ej: 50000'}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  min="0"
                  step={descuentoManual.tipo === 'porcentaje' ? '1' : '1000'}
                />
              </div>

              {/* Descripción */}
              <input
                type="text"
                value={descuentoManual.descripcion}
                onChange={(e) => setDescuentoManual(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Motivo del descuento (ej: Cliente frecuente)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />

              {/* Vista previa */}
              {descuentoManual.valor && parseFloat(descuentoManual.valor) > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm">
                  <span className="text-slate-600">Descuento: </span>
                  <span className="font-semibold text-green-600">
                    -{descuentoManual.tipo === 'porcentaje'
                      ? formatearMoneda(baseCalculo * (parseFloat(descuentoManual.valor) / 100))
                      : formatearMoneda(parseFloat(descuentoManual.valor))
                    }
                  </span>
                  {descuentoManual.tipo === 'porcentaje' && (
                    <span className="text-slate-500 ml-1">({descuentoManual.valor}%)</span>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAplicarManual}
                  disabled={!descuentoManual.valor || parseFloat(descuentoManual.valor) <= 0}
                  className="flex-1"
                >
                  Aplicar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMostrarManual(false)
                    setDescuentoManual({ valor: '', tipo: 'porcentaje', descripcion: '' })
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

export default DescuentosSelectorLocal
