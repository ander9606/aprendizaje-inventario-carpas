// ============================================
// COMPONENTE: ProductoCardSelector
// Tarjeta de producto para selector con cantidad
// Con indicador de disponibilidad y botón Ver componentes
// ============================================

import { useState, useEffect } from 'react'
import { Plus, Minus, Package, DollarSign, Eye, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import Button from '../common/Button'
import ComponentesProductoModal from './ComponentesProductoModal'

const ProductoCardSelector = ({
  producto,
  onAgregar,
  disabled = false,
  maxCantidad = 99,
  fechaMontaje = null,
  fechaDesmontaje = null,
  disponibilidadInfo = null, // { disponibles, estado: 'ok' | 'insuficiente' | 'sin_verificar' }
  loadingDisponibilidad = false
}) => {
  const [cantidad, setCantidad] = useState(1)
  const [showComponentesModal, setShowComponentesModal] = useState(false)

  const { nombre, precio_base, deposito, total_componentes } = producto

  // Calcular máximo basado en disponibilidad
  const maxDisponible = disponibilidadInfo?.disponibles ?? maxCantidad
  const maxReal = Math.min(maxCantidad, maxDisponible > 0 ? maxDisponible : maxCantidad)

  // Resetear cantidad si excede el máximo disponible
  useEffect(() => {
    if (disponibilidadInfo && cantidad > maxReal && maxReal > 0) {
      setCantidad(maxReal)
    }
  }, [disponibilidadInfo, maxReal])

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const incrementar = () => {
    setCantidad(prev => Math.min(prev + 1, maxReal))
  }

  const decrementar = () => {
    setCantidad(prev => Math.max(prev - 1, 1))
  }

  const handleAgregar = () => {
    onAgregar?.(producto, cantidad)
    setCantidad(1)
  }

  // Determinar estado de disponibilidad
  const getEstadoDisponibilidad = () => {
    if (!fechaMontaje || !disponibilidadInfo) return 'sin_verificar'
    if (disponibilidadInfo.disponibles <= 0) return 'no_disponible'
    if (disponibilidadInfo.estado === 'insuficiente') return 'limitado'
    return 'disponible'
  }

  const estadoDisp = getEstadoDisponibilidad()

  const getIndicadorDisponibilidad = () => {
    if (loadingDisponibilidad) {
      return (
        <div className="flex items-center gap-1 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Verificando...</span>
        </div>
      )
    }

    if (!fechaMontaje) {
      return (
        <div className="flex items-center gap-1 text-slate-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Sin fechas</span>
        </div>
      )
    }

    if (!disponibilidadInfo) return null

    switch (estadoDisp) {
      case 'disponible':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{disponibilidadInfo.disponibles} disponibles</span>
          </div>
        )
      case 'limitado':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">{disponibilidadInfo.disponibles} disponibles</span>
          </div>
        )
      case 'no_disponible':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Sin stock</span>
          </div>
        )
      default:
        return null
    }
  }

  const noDisponible = estadoDisp === 'no_disponible'

  return (
    <div className={`
      rounded-xl border-2 bg-white overflow-hidden transition-all duration-200
      ${noDisponible
        ? 'border-red-200 bg-red-50/30 opacity-75'
        : disabled
        ? 'border-slate-200 opacity-50'
        : estadoDisp === 'disponible'
        ? 'border-green-200 hover:border-green-300 hover:shadow-md'
        : estadoDisp === 'limitado'
        ? 'border-yellow-200 hover:border-yellow-300 hover:shadow-md'
        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
      }
    `}>
      {/* Imagen placeholder con indicador de disponibilidad */}
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
        <Package className="w-12 h-12 text-slate-400" />
        {/* Badge de disponibilidad en esquina */}
        {fechaMontaje && disponibilidadInfo && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
            estadoDisp === 'disponible' ? 'bg-green-500 text-white' :
            estadoDisp === 'limitado' ? 'bg-yellow-500 text-white' :
            'bg-red-500 text-white'
          }`}>
            {disponibilidadInfo.disponibles}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Nombre */}
        <h4 className="font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem]">
          {nombre}
        </h4>

        {/* Indicador de disponibilidad */}
        <div className="min-h-[1.25rem]">
          {getIndicadorDisponibilidad()}
        </div>

        {/* Precios */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-bold text-lg text-slate-900">
              {formatearMoneda(precio_base)}
            </span>
          </div>
          {deposito > 0 && (
            <p className="text-xs text-slate-500">
              Deposito: {formatearMoneda(deposito)}
            </p>
          )}
        </div>

        {/* Botón Ver componentes */}
        {total_componentes > 0 && (
          <button
            type="button"
            onClick={() => setShowComponentesModal(true)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver {total_componentes} componente{total_componentes !== 1 ? 's' : ''}
          </button>
        )}

        {/* Selector de cantidad y boton agregar */}
        <div className="flex items-center gap-2 pt-2">
          {/* Cantidad */}
          <div className={`flex items-center border rounded-lg ${
            noDisponible ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}>
            <button
              type="button"
              onClick={decrementar}
              disabled={disabled || noDisponible || cantidad <= 1}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="1"
              max={maxReal}
              value={cantidad}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                setCantidad(Math.max(1, Math.min(val, maxReal)))
              }}
              disabled={disabled || noDisponible}
              className="w-12 text-center border-x border-slate-300 py-1.5 text-sm focus:outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={incrementar}
              disabled={disabled || noDisponible || cantidad >= maxReal}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Boton agregar */}
          <Button
            type="button"
            variant={noDisponible ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleAgregar}
            disabled={disabled || noDisponible}
            className="flex-1"
            icon={<Plus className="w-4 h-4" />}
          >
            {noDisponible ? 'Sin stock' : 'Agregar'}
          </Button>
        </div>
      </div>

      {/* Modal de componentes */}
      <ComponentesProductoModal
        isOpen={showComponentesModal}
        onClose={() => setShowComponentesModal(false)}
        producto={producto}
        fechaMontaje={fechaMontaje}
        fechaDesmontaje={fechaDesmontaje}
        cantidadSolicitada={cantidad}
      />
    </div>
  )
}

export default ProductoCardSelector
