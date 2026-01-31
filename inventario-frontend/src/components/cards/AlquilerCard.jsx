// ============================================
// COMPONENTE: AlquilerCard
// Muestra una tarjeta de alquiler con acciones
// ============================================

import {
  Calendar,
  User,
  Package,
  DollarSign,
  Eye,
  LogOut,
  LogIn,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'

/**
 * AlquilerCard
 *
 * Tarjeta que muestra un alquiler con:
 * - Información del evento y cliente
 * - Fechas de salida y retorno
 * - Cantidad de elementos asignados
 * - Total y estado
 * - Acciones según estado
 *
 * @param {Object} alquiler - Datos del alquiler
 * @param {Function} onVerDetalle - Callback para ver detalle
 * @param {Function} onMarcarSalida - Callback para marcar salida
 * @param {Function} onMarcarRetorno - Callback para marcar retorno
 */
const AlquilerCard = ({
  alquiler,
  onVerDetalle,
  onMarcarSalida,
  onMarcarRetorno
}) => {

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Formatear fecha a formato legible
   */
  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Formatear moneda
   */
  const formatMoneda = (valor) => {
    if (!valor && valor !== 0) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor)
  }

  /**
   * Obtener configuración de estado
   */
  const getEstadoConfig = (estado) => {
    const configs = {
      programado: {
        label: 'Programado',
        icon: Clock,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
      },
      activo: {
        label: 'Activo',
        icon: CheckCircle,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      },
      finalizado: {
        label: 'Finalizado',
        icon: CheckCircle,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      },
      cancelado: {
        label: 'Cancelado',
        icon: XCircle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      }
    }
    return configs[estado] || configs.programado
  }

  /**
   * Verificar si el retorno está vencido
   */
  const isRetornoVencido = () => {
    if (alquiler.estado !== 'activo') return false
    if (!alquiler.fecha_retorno_esperado) return false

    const hoy = new Date()
    const retorno = new Date(alquiler.fecha_retorno_esperado)
    return hoy > retorno
  }

  const estadoConfig = getEstadoConfig(alquiler.estado)
  const EstadoIcon = estadoConfig.icon
  const retornoVencido = isRetornoVencido()

  // ============================================
  // HANDLERS
  // ============================================

  const handleVerDetalle = (e) => {
    e.stopPropagation()
    if (onVerDetalle) {
      onVerDetalle(alquiler.id)
    }
  }

  const handleMarcarSalida = (e) => {
    e.stopPropagation()
    if (onMarcarSalida) {
      onMarcarSalida(alquiler)
    }
  }

  const handleMarcarRetorno = (e) => {
    e.stopPropagation()
    if (onMarcarRetorno) {
      onMarcarRetorno(alquiler)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card
      variant="outlined"
      className={`
        hover:shadow-lg transition-all duration-200
        ${retornoVencido ? 'border-red-300 bg-red-50/30' : ''}
      `}
    >
      {/* HEADER */}
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badge de estado */}
            <div className="mb-2 flex flex-wrap gap-2">
              <span className={`
                inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
                ${estadoConfig.bgColor} ${estadoConfig.textColor}
              `}>
                <EstadoIcon className="w-3 h-3" />
                {estadoConfig.label}
              </span>

              {/* Badge de retorno vencido */}
              {retornoVencido && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  Retorno vencido
                </span>
              )}
            </div>

            {/* Nombre del evento */}
            <Card.Title className="truncate">
              {alquiler.evento_nombre || 'Sin nombre de evento'}
            </Card.Title>

            {/* Cliente */}
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <User className="w-3 h-3" />
              {alquiler.cliente_nombre || 'Cliente no especificado'}
            </p>
          </div>

          {/* ID del alquiler */}
          <div className="text-right">
            <span className="text-xs text-slate-400">
              #{alquiler.id}
            </span>
          </div>
        </div>
      </Card.Header>

      {/* CONTENT */}
      <Card.Content>
        <div className="space-y-3">
          {/* Fechas */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600">
              {formatFecha(alquiler.fecha_salida)}
            </span>
            <span className="text-slate-400">→</span>
            <span className={`${retornoVencido ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
              {formatFecha(alquiler.fecha_retorno_esperado)}
            </span>
          </div>

          {/* Elementos asignados */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {alquiler.total_elementos > 0 ? (
              <span className="text-slate-600">
                {alquiler.total_elementos} elemento{alquiler.total_elementos !== 1 ? 's' : ''} asignado{alquiler.total_elementos !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-amber-600">
                Pendiente de asignar elementos
              </span>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-medium">
              {formatMoneda(alquiler.total)}
            </span>
          </div>

          {/* Depósito y daños (si aplica) */}
          {(alquiler.deposito_cobrado > 0 || alquiler.costo_danos > 0) && (
            <div className="pt-2 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
              {alquiler.deposito_cobrado > 0 && (
                <span>Depósito: {formatMoneda(alquiler.deposito_cobrado)}</span>
              )}
              {alquiler.costo_danos > 0 && (
                <span className="text-red-600">Daños: {formatMoneda(alquiler.costo_danos)}</span>
              )}
            </div>
          )}
        </div>
      </Card.Content>

      {/* FOOTER */}
      <Card.Footer>
        <div className="flex gap-2 justify-between">
          {/* Botón ver detalle - siempre visible */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={handleVerDetalle}
            className="flex-1"
          >
            Ver Detalle
          </Button>

          {/* Botón de acción según estado */}
          {alquiler.estado === 'programado' && (
            <Button
              variant="primary"
              size="sm"
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleMarcarSalida}
              className="flex-1"
            >
              Marcar Salida
            </Button>
          )}

          {alquiler.estado === 'activo' && (
            <Button
              variant={retornoVencido ? 'danger' : 'primary'}
              size="sm"
              icon={<LogIn className="w-4 h-4" />}
              onClick={handleMarcarRetorno}
              className="flex-1"
            >
              Marcar Retorno
            </Button>
          )}
        </div>
      </Card.Footer>
    </Card>
  )
}

export default AlquilerCard
