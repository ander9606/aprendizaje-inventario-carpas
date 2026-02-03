// ============================================
// COMPONENTE: AlertaItem
// Muestra una alerta individual con acciones
// ============================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  X,
  ExternalLink,
  Phone,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Button from '../common/Button'

/**
 * Componente que muestra una alerta individual
 * 
 * @param {Object} alerta - Datos de la alerta
 * @param {Function} onIgnorar - Callback al ignorar la alerta
 * @param {boolean} isIgnorando - Si se está procesando el ignorar
 */
const AlertaItem = ({ alerta, onIgnorar, isIgnorando }) => {
  const [expandido, setExpandido] = useState(false)
  const [diasIgnorar, setDiasIgnorar] = useState(1)

  // Configuración de estilos por severidad
  const estilos = {
    critico: {
      icon: AlertTriangle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    },
    advertencia: {
      icon: AlertCircle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-800',
      textColor: 'text-amber-700'
    },
    info: {
      icon: Clock,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    }
  }

  const estilo = estilos[alerta.severidad] || estilos.info
  const Icono = estilo.icon

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Manejar ignorar
  const handleIgnorar = () => {
    if (onIgnorar) {
      onIgnorar({
        tipo: alerta.tipo,
        referencia_id: alerta.referencia_id,
        dias: diasIgnorar
      })
    }
  }

  return (
    <div className={`${estilo.bg} ${estilo.border} border rounded-lg p-3 mb-2`}>
      {/* Header de la alerta */}
      <div className="flex items-start gap-3">
        <Icono className={`w-5 h-5 ${estilo.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          {/* Título y mensaje */}
          <h4 className={`font-medium ${estilo.titleColor} text-sm`}>
            {alerta.titulo}
          </h4>
          <p className={`text-sm ${estilo.textColor} mt-0.5`}>
            {alerta.mensaje}
          </p>
          
          {/* Fecha */}
          <p className="text-xs text-slate-500 mt-1">
            Fecha: {formatFecha(alerta.fecha)}
          </p>
        </div>

        {/* Botón expandir/colapsar */}
        <button
          onClick={() => setExpandido(!expandido)}
          className="p-1 hover:bg-white/50 rounded"
        >
          {expandido ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Contenido expandido */}
      {expandido && (
        <div className="mt-3 pt-3 border-t border-slate-200/50">
          {/* Datos adicionales */}
          {alerta.datos && (
            <div className="text-xs text-slate-600 mb-3 space-y-1">
              {alerta.datos.cliente_nombre && (
                <p>Cliente: <span className="font-medium">{alerta.datos.cliente_nombre}</span></p>
              )}
              {alerta.datos.evento_nombre && (
                <p>Evento: <span className="font-medium">{alerta.datos.evento_nombre}</span></p>
              )}
              {alerta.datos.dias_vencido > 0 && (
                <p className="text-red-600">Vencido hace: <span className="font-medium">{alerta.datos.dias_vencido} día(s)</span></p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 mb-3">
            {alerta.acciones?.map((accion, idx) => (
              accion.url ? (
                <Link key={idx} to={accion.url}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink className="w-3 h-3" />}
                  >
                    {accion.label}
                  </Button>
                </Link>
              ) : accion.telefono ? (
                <a key={idx} href={`tel:${accion.telefono}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Phone className="w-3 h-3" />}
                  >
                    {accion.label}
                  </Button>
                </a>
              ) : null
            ))}
          </div>

          {/* Ignorar alerta */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
            <span className="text-xs text-slate-500">Recordarme en:</span>
            <select
              value={diasIgnorar}
              onChange={(e) => setDiasIgnorar(parseInt(e.target.value))}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value={1}>1 día</option>
              <option value={2}>2 días</option>
              <option value={3}>3 días</option>
              <option value={7}>1 semana</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleIgnorar}
              disabled={isIgnorando}
              icon={<X className="w-3 h-3" />}
            >
              Ignorar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertaItem
