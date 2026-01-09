// ============================================
// COMPONENTE: VerificacionDisponibilidad
// Muestra el resultado de verificación de disponibilidad
// ============================================

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Package, RefreshCw } from 'lucide-react'
import { useVerificarDisponibilidadProductos } from '../../hooks/useDisponibilidad'

/**
 * VerificacionDisponibilidad
 *
 * Muestra la disponibilidad de elementos para los productos seleccionados
 *
 * @param {Array} productos - [{ compuesto_id, cantidad, configuracion }]
 * @param {string} fechaMontaje - Fecha de montaje
 * @param {string} fechaDesmontaje - Fecha de desmontaje
 * @param {boolean} mostrar - Si debe mostrarse el componente
 */
const VerificacionDisponibilidad = ({
  productos = [],
  fechaMontaje,
  fechaDesmontaje,
  mostrar = true
}) => {
  const { verificar, limpiar, resultado, isLoading } = useVerificarDisponibilidadProductos()

  // Verificar cuando cambien los datos (el debounce está en el hook)
  useEffect(() => {
    if (!mostrar) {
      limpiar()
      return
    }

    // Solo verificar si hay productos y fecha
    const productosValidos = productos.filter(p => p.compuesto_id)
    if (productosValidos.length > 0 && fechaMontaje) {
      verificar(productosValidos, fechaMontaje, fechaDesmontaje || fechaMontaje)
    } else {
      limpiar()
    }
  }, [productos, fechaMontaje, fechaDesmontaje, mostrar]) // verificar y limpiar son estables

  // No mostrar si no hay datos
  if (!mostrar || !fechaMontaje || productos.filter(p => p.compuesto_id).length === 0) {
    return null
  }

  // Loading
  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2 text-slate-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Verificando disponibilidad...</span>
        </div>
      </div>
    )
  }

  // Sin resultado aún
  if (!resultado) {
    return null
  }

  const { hay_problemas, elementos, resumen } = resultado

  return (
    <div className={`
      mt-4 p-4 rounded-lg border
      ${hay_problemas
        ? 'bg-amber-50 border-amber-200'
        : 'bg-green-50 border-green-200'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {hay_problemas ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          <h4 className={`font-semibold ${hay_problemas ? 'text-amber-800' : 'text-green-800'}`}>
            Verificación de Disponibilidad
          </h4>
        </div>
        <span className="text-xs text-slate-500">
          {resumen.elementos_ok}/{resumen.total_elementos} elementos OK
        </span>
      </div>

      {/* Lista de elementos */}
      <div className="space-y-2">
        {elementos.map((elemento) => (
          <div
            key={elemento.elemento_id}
            className={`
              flex items-center justify-between p-2 rounded
              ${elemento.estado === 'ok'
                ? 'bg-green-100/50'
                : 'bg-amber-100/50'
              }
            `}
          >
            <div className="flex items-center gap-2">
              {elemento.estado === 'ok' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-slate-700">
                {elemento.elemento_nombre}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                Necesitas: <strong>{elemento.cantidad_requerida}</strong>
              </span>
              <span className={elemento.estado === 'ok' ? 'text-green-600' : 'text-red-500'}>
                Disponibles: <strong>{elemento.disponibles}</strong>
              </span>
              {elemento.faltantes > 0 && (
                <span className="text-red-600 font-semibold">
                  Faltan: {elemento.faltantes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si hay problemas */}
      {hay_problemas && (
        <p className="mt-3 text-xs text-amber-700">
          <strong>Nota:</strong> Puedes guardar la cotización de todas formas.
          La disponibilidad se verificará nuevamente al aprobar.
        </p>
      )}
    </div>
  )
}

export default VerificacionDisponibilidad
