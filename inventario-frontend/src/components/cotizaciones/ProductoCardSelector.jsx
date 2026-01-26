// ============================================
// COMPONENTE: ProductoCardSelector
// Tarjeta de producto para selector con cantidad
// ============================================

import { useState } from 'react'
import { Plus, Minus, Package, DollarSign } from 'lucide-react'
import Button from '../common/Button'

const ProductoCardSelector = ({
  producto,
  onAgregar,
  disabled = false,
  maxCantidad = 99
}) => {
  const [cantidad, setCantidad] = useState(1)

  const { nombre, precio_base, deposito, total_componentes } = producto

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const incrementar = () => {
    setCantidad(prev => Math.min(prev + 1, maxCantidad))
  }

  const decrementar = () => {
    setCantidad(prev => Math.max(prev - 1, 1))
  }

  const handleAgregar = () => {
    onAgregar?.(producto, cantidad)
    setCantidad(1)
  }

  return (
    <div className={`
      rounded-xl border-2 bg-white overflow-hidden transition-all duration-200
      ${disabled
        ? 'border-slate-200 opacity-50'
        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
      }
    `}>
      {/* Imagen placeholder */}
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <Package className="w-12 h-12 text-slate-400" />
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Nombre */}
        <h4 className="font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem]">
          {nombre}
        </h4>

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

        {/* Componentes */}
        {total_componentes > 0 && (
          <p className="text-xs text-slate-500">
            {total_componentes} componente{total_componentes !== 1 ? 's' : ''}
          </p>
        )}

        {/* Selector de cantidad y boton agregar */}
        <div className="flex items-center gap-2 pt-2">
          {/* Cantidad */}
          <div className="flex items-center border border-slate-300 rounded-lg">
            <button
              type="button"
              onClick={decrementar}
              disabled={disabled || cantidad <= 1}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="1"
              max={maxCantidad}
              value={cantidad}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                setCantidad(Math.max(1, Math.min(val, maxCantidad)))
              }}
              disabled={disabled}
              className="w-12 text-center border-x border-slate-300 py-1.5 text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={incrementar}
              disabled={disabled || cantidad >= maxCantidad}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Boton agregar */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAgregar}
            disabled={disabled}
            className="flex-1"
            icon={<Plus className="w-4 h-4" />}
          >
            Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProductoCardSelector
