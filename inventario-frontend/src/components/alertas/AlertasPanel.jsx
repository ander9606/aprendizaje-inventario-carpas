// ============================================
// COMPONENTE: AlertasPanel
// Panel que muestra todas las alertas agrupadas
// ============================================

import { useState } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info
} from 'lucide-react'
import AlertaItem from './AlertaItem'
import Button from '../common/Button'

/**
 * Panel de alertas que muestra alertas críticas y advertencias
 *
 * @param {Array} alertas - Lista de alertas
 * @param {Object} resumen - Resumen con conteos
 * @param {boolean} isLoading - Si está cargando
 * @param {Function} onRefresh - Callback para refrescar
 * @param {Function} onIgnorar - Callback al ignorar una alerta
 * @param {boolean} isIgnorando - Si se está procesando el ignorar
 * @param {boolean} colapsable - Si el panel se puede colapsar
 * @param {boolean} inicialmenteColapsado - Si inicia colapsado
 */
const AlertasPanel = ({
  alertas = [],
  resumen,
  isLoading,
  onRefresh,
  onIgnorar,
  isIgnorando,
  colapsable = true,
  inicialmenteColapsado = false
}) => {
  const [colapsado, setColapsado] = useState(inicialmenteColapsado)

  // Separar por severidad
  const criticas = alertas.filter(a => a.severidad === 'critico')
  const advertencias = alertas.filter(a => a.severidad === 'advertencia')
  const informativas = alertas.filter(a => a.severidad === 'info')

  // Si no hay alertas, no mostrar nada
  if (!isLoading && alertas.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Header del panel */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">
            Alertas
            {resumen && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({resumen.total} {resumen.total === 1 ? 'alerta' : 'alertas'})
              </span>
            )}
          </h3>

          {/* Badges de conteo */}
          {resumen && resumen.criticas > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3" />
              {resumen.criticas}
            </span>
          )}
          {resumen && resumen.advertencias > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              <AlertCircle className="w-3 h-3" />
              {resumen.advertencias}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botón refrescar */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              {isLoading ? '' : 'Actualizar'}
            </Button>
          )}

          {/* Botón colapsar */}
          {colapsable && (
            <button
              onClick={() => setColapsado(!colapsado)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              {colapsado ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contenido del panel */}
      {!colapsado && (
        <div className="space-y-4">
          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-4 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              <p className="text-sm">Cargando alertas...</p>
            </div>
          )}

          {/* Alertas críticas */}
          {criticas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Críticas ({criticas.length})
                </span>
              </div>
              <div className="space-y-2">
                {criticas.map((alerta, idx) => (
                  <AlertaItem
                    key={`${alerta.tipo}-${alerta.referencia_id}-${idx}`}
                    alerta={alerta}
                    onIgnorar={onIgnorar}
                    isIgnorando={isIgnorando}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Alertas de advertencia */}
          {advertencias.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  Advertencias ({advertencias.length})
                </span>
              </div>
              <div className="space-y-2">
                {advertencias.map((alerta, idx) => (
                  <AlertaItem
                    key={`${alerta.tipo}-${alerta.referencia_id}-${idx}`}
                    alerta={alerta}
                    onIgnorar={onIgnorar}
                    isIgnorando={isIgnorando}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Alertas informativas (seguimiento) */}
          {informativas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                  Seguimiento ({informativas.length})
                </span>
              </div>
              <div className="space-y-2">
                {informativas.map((alerta, idx) => (
                  <AlertaItem
                    key={`${alerta.tipo}-${alerta.referencia_id}-${idx}`}
                    alerta={alerta}
                    onIgnorar={onIgnorar}
                    isIgnorando={isIgnorando}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sin alertas */}
          {!isLoading && alertas.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No hay alertas pendientes</p>
            </div>
          )}
        </div>
      )}

      {/* Resumen colapsado */}
      {colapsado && resumen && resumen.total > 0 && (
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
          {resumen.criticas > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 font-medium">
                {resumen.criticas} crítica{resumen.criticas !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {resumen.advertencias > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700 font-medium">
                {resumen.advertencias} advertencia{resumen.advertencias !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <button
            onClick={() => setColapsado(false)}
            className="text-sm text-primary-600 hover:underline ml-auto"
          >
            Ver todas
          </button>
        </div>
      )}
    </div>
  )
}

export default AlertasPanel
