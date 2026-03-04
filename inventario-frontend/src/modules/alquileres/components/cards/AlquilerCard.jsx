// ============================================
// COMPONENTE: AlquilerCard
// Tarjeta moderna de alquiler con click directo
// ============================================

import {
  Calendar,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Truck
} from 'lucide-react'

const estadoConfig = {
  programado: {
    label: 'Programado',
    icon: Clock,
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    accent: 'border-l-amber-400'
  },
  activo: {
    label: 'Activo',
    icon: Truck,
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accent: 'border-l-emerald-400'
  },
  finalizado: {
    label: 'Finalizado',
    icon: CheckCircle,
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    accent: 'border-l-slate-300'
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    dot: 'bg-red-400',
    badge: 'bg-red-50 text-red-600 border-red-200',
    accent: 'border-l-red-300'
  }
}

const AlquilerCard = ({ alquiler, onVerDetalle }) => {

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short'
    })
  }

  const formatMoneda = (valor) => {
    if (!valor && valor !== 0) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(valor)
  }

  const isRetornoVencido = () => {
    if (alquiler.estado !== 'activo') return false
    if (!alquiler.fecha_retorno_esperado) return false
    return new Date() > new Date(alquiler.fecha_retorno_esperado)
  }

  const config = estadoConfig[alquiler.estado] || estadoConfig.programado
  const Icon = config.icon
  const vencido = isRetornoVencido()
  const esFinalOCancelado = alquiler.estado === 'finalizado' || alquiler.estado === 'cancelado'

  return (
    <button
      onClick={() => onVerDetalle?.(alquiler.id)}
      className={`
        w-full text-left bg-white rounded-xl border border-slate-200 border-l-4
        ${vencido ? 'border-l-red-500 ring-1 ring-red-200' : config.accent}
        hover:shadow-md hover:border-slate-300 transition-all duration-200 group
        ${esFinalOCancelado ? 'opacity-75' : ''}
      `}
    >
      {/* Top row: estado + ID */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${config.badge}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          {vencido && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Vencido
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-mono">#{alquiler.id}</span>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        {/* Evento name */}
        <h3 className="font-semibold text-slate-900 text-[15px] leading-tight truncate mb-1 group-hover:text-orange-600 transition-colors">
          {alquiler.evento_nombre || 'Sin nombre'}
        </h3>

        {/* Cliente */}
        <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-3">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{alquiler.cliente_nombre || '-'}</span>
        </p>

        {/* Dates row */}
        <div className="flex items-center gap-3 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatFecha(alquiler.fecha_salida)}</span>
          </div>
          <span className="text-slate-300 text-xs">→</span>
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
            vencido ? 'bg-red-50 text-red-700 font-medium' : 'bg-slate-50 text-slate-600'
          }`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatFecha(alquiler.fecha_retorno_esperado)}</span>
          </div>
        </div>

        {/* Products */}
        {alquiler.productos_resumen && (
          <p className="text-xs text-slate-500 line-clamp-1 mb-2.5">
            <Package className="w-3.5 h-3.5 inline mr-1 text-slate-400 -mt-0.5" />
            {alquiler.productos_resumen}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-xl">
        <span className="text-sm font-bold text-slate-900">
          {formatMoneda(alquiler.total)}
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-orange-500 transition-colors">
          Ver detalle
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </button>
  )
}

export default AlquilerCard
