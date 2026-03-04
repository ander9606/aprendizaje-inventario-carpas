// ============================================
// COMPONENTE: AlquilerTimeline
// Muestra el historial visual de un alquiler
// ============================================

import {
  FileText,
  CheckCircle,
  Calendar,
  Package,
  LogOut,
  LogIn,
  Clock,
  XCircle
} from 'lucide-react'

/**
 * AlquilerTimeline
 *
 * Muestra una línea de tiempo visual con los eventos del alquiler:
 * - Cotización creada
 * - Cotización aprobada
 * - Alquiler programado
 * - Elementos asignados
 * - Salida marcada
 * - Retorno registrado
 *
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Object} alquiler - Datos del alquiler
 * @param {Array} elementos - Lista de elementos asignados
 */
const AlquilerTimeline = ({
  cotizacion,
  alquiler,
  elementos = []
}) => {

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Formatear fecha y hora
   */
  const formatFechaHora = (fecha) => {
    if (!fecha) return null
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Formatear solo fecha
   */
  const formatFecha = (fecha) => {
    if (!fecha) return null
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Calcular elementos asignados con fechas
   */
  const getElementosAsignados = () => {
    if (!elementos || elementos.length === 0) return null

    const fechaAsignacion = elementos[0]?.fecha_asignacion
    return {
      cantidad: elementos.length,
      fecha: fechaAsignacion
    }
  }

  /**
   * Calcular elementos retornados
   */
  const getElementosRetornados = () => {
    if (!elementos || elementos.length === 0) return null

    const retornados = elementos.filter(e => e.estado_retorno)
    if (retornados.length === 0) return null

    const fechaRetorno = retornados[0]?.fecha_retorno
    return {
      cantidad: retornados.length,
      total: elementos.length,
      fecha: fechaRetorno
    }
  }

  const elementosAsignados = getElementosAsignados()
  const elementosRetornados = getElementosRetornados()

  // ============================================
  // CONSTRUCCIÓN DE EVENTOS
  // ============================================

  const eventos = []

  // 1. Cotización creada
  if (cotizacion?.created_at) {
    eventos.push({
      id: 'cotizacion_creada',
      icono: FileText,
      titulo: 'Cotización creada',
      fecha: formatFechaHora(cotizacion.created_at),
      completado: true,
      color: 'blue'
    })
  }

  // 2. Cotización aprobada
  if (cotizacion?.estado === 'aprobada' || alquiler) {
    const fechaAprobacion = cotizacion?.fecha_aprobacion || alquiler?.created_at
    eventos.push({
      id: 'cotizacion_aprobada',
      icono: CheckCircle,
      titulo: 'Cotización aprobada',
      fecha: formatFechaHora(fechaAprobacion),
      completado: true,
      color: 'green'
    })
  }

  // 3. Alquiler programado
  if (alquiler) {
    eventos.push({
      id: 'alquiler_programado',
      icono: Calendar,
      titulo: 'Alquiler programado',
      fecha: formatFechaHora(alquiler.created_at),
      detalle: `Retorno esperado: ${formatFecha(alquiler.fecha_retorno_esperado)}`,
      completado: true,
      color: 'purple'
    })
  }

  // 4. Elementos asignados
  if (elementosAsignados) {
    eventos.push({
      id: 'elementos_asignados',
      icono: Package,
      titulo: 'Elementos asignados',
      fecha: formatFechaHora(elementosAsignados.fecha),
      detalle: `${elementosAsignados.cantidad} elemento${elementosAsignados.cantidad !== 1 ? 's' : ''}`,
      completado: true,
      color: 'indigo'
    })
  } else if (alquiler && alquiler.estado !== 'cancelado') {
    eventos.push({
      id: 'elementos_pendientes',
      icono: Package,
      titulo: 'Asignación de elementos',
      fecha: null,
      detalle: 'Pendiente',
      completado: false,
      color: 'gray'
    })
  }

  // 5. Salida marcada
  if (alquiler?.fecha_salida && alquiler.estado !== 'programado') {
    eventos.push({
      id: 'salida_marcada',
      icono: LogOut,
      titulo: 'Salida marcada',
      fecha: formatFechaHora(alquiler.fecha_salida),
      completado: true,
      color: 'orange'
    })
  } else if (alquiler && alquiler.estado === 'programado') {
    eventos.push({
      id: 'salida_pendiente',
      icono: LogOut,
      titulo: 'Marcar salida',
      fecha: `Programado: ${formatFecha(alquiler.fecha_salida)}`,
      detalle: 'Pendiente',
      completado: false,
      color: 'gray'
    })
  }

  // 6. Retorno registrado
  if (alquiler?.estado === 'finalizado') {
    eventos.push({
      id: 'retorno_registrado',
      icono: LogIn,
      titulo: 'Retorno registrado',
      fecha: formatFechaHora(alquiler.fecha_retorno_real),
      detalle: elementosRetornados
        ? `${elementosRetornados.cantidad} de ${elementosRetornados.total} elementos`
        : null,
      completado: true,
      color: 'teal'
    })
  } else if (alquiler?.estado === 'activo') {
    const hoy = new Date()
    const retornoEsperado = new Date(alquiler.fecha_retorno_esperado)
    const vencido = hoy > retornoEsperado

    eventos.push({
      id: 'retorno_pendiente',
      icono: LogIn,
      titulo: 'Marcar retorno',
      fecha: `Esperado: ${formatFecha(alquiler.fecha_retorno_esperado)}`,
      detalle: vencido ? 'Vencido' : 'Pendiente',
      completado: false,
      color: vencido ? 'red' : 'gray'
    })
  }

  // 7. Cancelado (si aplica)
  if (alquiler?.estado === 'cancelado') {
    eventos.push({
      id: 'cancelado',
      icono: XCircle,
      titulo: 'Alquiler cancelado',
      fecha: null,
      completado: true,
      color: 'red'
    })
  }

  // ============================================
  // ESTILOS POR COLOR
  // ============================================

  const getColorClasses = (color, completado) => {
    if (!completado) {
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-400',
        line: 'bg-gray-200'
      }
    }

    const colors = {
      blue: {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-600',
        line: 'bg-blue-200'
      },
      green: {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-600',
        line: 'bg-green-200'
      },
      purple: {
        bg: 'bg-purple-100',
        border: 'border-purple-500',
        text: 'text-purple-600',
        line: 'bg-purple-200'
      },
      indigo: {
        bg: 'bg-indigo-100',
        border: 'border-indigo-500',
        text: 'text-indigo-600',
        line: 'bg-indigo-200'
      },
      orange: {
        bg: 'bg-orange-100',
        border: 'border-orange-500',
        text: 'text-orange-600',
        line: 'bg-orange-200'
      },
      teal: {
        bg: 'bg-teal-100',
        border: 'border-teal-500',
        text: 'text-teal-600',
        line: 'bg-teal-200'
      },
      red: {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-600',
        line: 'bg-red-200'
      },
      gray: {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-400',
        line: 'bg-gray-200'
      }
    }

    return colors[color] || colors.gray
  }

  // ============================================
  // RENDER
  // ============================================

  if (eventos.length === 0) {
    return (
      <div className="text-center text-slate-500 py-4">
        No hay eventos registrados
      </div>
    )
  }

  return (
    <div className="relative">
      {eventos.map((evento, index) => {
        const Icono = evento.icono
        const colorClasses = getColorClasses(evento.color, evento.completado)
        const isLast = index === eventos.length - 1

        return (
          <div key={evento.id} className="relative flex gap-4 pb-6">
            {/* Línea vertical conectora */}
            {!isLast && (
              <div
                className={`
                  absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-16px)]
                  ${colorClasses.line}
                `}
              />
            )}

            {/* Círculo con icono */}
            <div className={`
              relative z-10 flex-shrink-0 w-8 h-8 rounded-full
              flex items-center justify-center
              border-2 ${colorClasses.border} ${colorClasses.bg}
            `}>
              <Icono className={`w-4 h-4 ${colorClasses.text}`} />
            </div>

            {/* Contenido del evento */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className={`
                    text-sm font-medium
                    ${evento.completado ? 'text-slate-900' : 'text-slate-400'}
                  `}>
                    {evento.titulo}
                  </h4>

                  {evento.detalle && (
                    <p className={`
                      text-xs mt-0.5
                      ${evento.completado ? 'text-slate-500' : 'text-slate-400'}
                      ${evento.detalle === 'Vencido' ? 'text-red-500 font-medium' : ''}
                    `}>
                      {evento.detalle}
                    </p>
                  )}
                </div>

                {evento.fecha && (
                  <span className={`
                    text-xs whitespace-nowrap
                    ${evento.completado ? 'text-slate-400' : 'text-slate-300'}
                  `}>
                    {evento.fecha}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AlquilerTimeline
