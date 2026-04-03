// ============================================
// COMPONENTE: ResumenCotizacion
// Resumen de totales con IVA, días extra y descuentos
// ============================================

import { Info, Calendar, Percent, Tag, Shield, ShieldOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ResumenCotizacion = ({
  const { t } = useTranslation()
  resumen,
  mostrarDetalles = true,
  className = '',
  onToggleDeposito
}) => {
  if (!resumen) return null

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const {
    subtotal_productos = 0,
    subtotal_transporte = 0,
    dias_montaje_extra = 0,
    dias_desmontaje_extra = 0,
    total_dias_extra = 0,
    porcentaje_dias_extra = 15,
    cobro_dias_extra = 0,
    descuento_manual = 0,
    total_descuentos_productos = 0,
    total_descuentos_aplicados = 0,
    total_descuentos = 0,
    base_gravable = 0,
    porcentaje_iva = 19,
    valor_iva = 0,
    total = 0,
    total_deposito = 0
  } = resumen

  const subtotal = subtotal_productos + subtotal_transporte
  const tieneDiasExtra = total_dias_extra > 0
  const tieneDescuentos = total_descuentos > 0

  return (
    <div className={`bg-slate-50 rounded-lg p-4 ${className}`}>
      <h4 className="font-semibold text-slate-800 mb-3">Resumen de Valores</h4>

      <div className="space-y-2 text-sm">
        {/* Subtotal productos */}
        <div className="flex justify-between">
          <span className="text-slate-600">Subtotal productos:</span>
          <span className="font-medium">{formatearMoneda(subtotal_productos)}</span>
        </div>

        {/* Descuentos por producto */}
        {total_descuentos_productos > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1 text-xs">
              <Percent className="w-3 h-3" />
              Descuentos en productos:
            </span>
            <span className="font-medium text-xs">(incluidos en subtotal)</span>
          </div>
        )}

        {/* Subtotal transporte */}
        {subtotal_transporte > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal transporte:</span>
            <span className="font-medium">{formatearMoneda(subtotal_transporte)}</span>
          </div>
        )}

        {/* Línea separadora */}
        <div className="border-t border-slate-200 my-2"></div>

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-slate-700 font-medium">Subtotal:</span>
          <span className="font-medium">{formatearMoneda(subtotal)}</span>
        </div>

        {/* Días extra */}
        {tieneDiasExtra && mostrarDetalles && (
          <div className="bg-amber-50 rounded p-2 mt-2">
            <div className="flex items-center gap-1 text-amber-700 mb-1">
              <Calendar className="w-3 h-3" />
              <span className="text-xs font-medium">Días extra ({porcentaje_dias_extra}% por día)</span>
            </div>
            <div className="text-xs text-amber-600 space-y-1">
              {dias_montaje_extra > 0 && (
                <p>Montaje: +{dias_montaje_extra} día{dias_montaje_extra > 1 ? 's' : ''} extra</p>
              )}
              {dias_desmontaje_extra > 0 && (
                <p>Desmontaje: +{dias_desmontaje_extra} día{dias_desmontaje_extra > 1 ? 's' : ''} extra</p>
              )}
            </div>
            <div className="flex justify-between mt-1 text-amber-800">
              <span className="text-xs">Recargo días extra:</span>
              <span className="font-medium text-sm">+{formatearMoneda(cobro_dias_extra)}</span>
            </div>
          </div>
        )}

        {/* Recargo días extra (versión compacta) */}
        {tieneDiasExtra && !mostrarDetalles && (
          <div className="flex justify-between text-amber-700">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Días extra ({total_dias_extra}):
            </span>
            <span className="font-medium">+{formatearMoneda(cobro_dias_extra)}</span>
          </div>
        )}

        {/* Descuentos */}
        {tieneDescuentos && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Descuentos:
            </span>
            <span className="font-medium">-{formatearMoneda(total_descuentos)}</span>
          </div>
        )}

        {/* Línea separadora antes de IVA */}
        <div className="border-t border-slate-200 my-2"></div>

        {/* Base gravable */}
        <div className="flex justify-between">
          <span className="text-slate-600">Base gravable:</span>
          <span className="font-medium">{formatearMoneda(base_gravable)}</span>
        </div>

        {/* IVA */}
        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1">
            <Percent className="w-3 h-3" />
            IVA ({porcentaje_iva}%):
          </span>
          <span className="font-medium">+{formatearMoneda(valor_iva)}</span>
        </div>

        {/* TOTAL */}
        <div className="border-t-2 border-slate-300 mt-3 pt-3">
          <div className="flex justify-between text-lg">
            <span className="font-bold text-slate-900">TOTAL:</span>
            <span className="font-bold text-slate-900">{formatearMoneda(total)}</span>
          </div>
        </div>

        {/* Depósito (si aplica) */}
        {total_deposito > 0 && (
          <div className={`
            mt-3 p-3 rounded-lg border
            ${resumen.cobrar_deposito !== false
              ? 'bg-blue-50 border-blue-200'
              : 'bg-slate-50 border-slate-200'
            }
          `}>
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 text-sm font-medium ${
                resumen.cobrar_deposito !== false ? 'text-blue-700' : 'text-slate-500'
              }`}>
                {resumen.cobrar_deposito !== false ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <ShieldOff className="w-4 h-4" />
                )}
                Depósito de garantía:
              </span>
              <span className={`text-sm font-semibold ${
                resumen.cobrar_deposito !== false ? 'text-blue-800' : 'text-slate-400 line-through'
              }`}>
                {formatearMoneda(total_deposito)}
              </span>
            </div>
            {resumen.cobrar_deposito === false && (
              <p className="text-xs text-slate-400 mt-1">No se cobrará depósito</p>
            )}
            {onToggleDeposito && (
              <button
                type="button"
                onClick={onToggleDeposito}
                className={`
                  mt-2 text-xs font-medium px-3 py-1 rounded-full transition-colors
                  ${resumen.cobrar_deposito !== false
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {resumen.cobrar_deposito !== false ? 'No cobrar depósito' : 'Cobrar depósito'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ResumenCotizacion
