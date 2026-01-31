// ============================================
// MODAL: Componentes de Producto
// Muestra los componentes de un producto con
// información de disponibilidad por fechas
// ============================================

import { useState, useEffect } from 'react'
import { X, Package, CheckCircle, AlertTriangle, XCircle, Loader2, Box } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiProductosAlquiler from '../../api/apiProductosAlquiler'
import apiDisponibilidad from '../../api/apiDisponibilidad'

const ComponentesProductoModal = ({
  isOpen,
  onClose,
  producto,
  fechaMontaje,
  fechaDesmontaje,
  cantidadSolicitada = 1
}) => {
  // ============================================
  // QUERIES
  // ============================================

  // Obtener componentes del producto
  const { data: componentesData, isLoading: loadingComponentes } = useQuery({
    queryKey: ['producto-componentes', producto?.id],
    queryFn: () => apiProductosAlquiler.obtenerComponentes(producto?.id),
    enabled: isOpen && !!producto?.id
  })

  // Verificar disponibilidad si hay fechas
  const { data: disponibilidadData, isLoading: loadingDisponibilidad } = useQuery({
    queryKey: ['disponibilidad-producto', producto?.id, fechaMontaje, fechaDesmontaje, cantidadSolicitada],
    queryFn: () => apiDisponibilidad.verificarProductos(
      [{ compuesto_id: producto?.id, cantidad: cantidadSolicitada }],
      fechaMontaje,
      fechaDesmontaje
    ),
    enabled: isOpen && !!producto?.id && !!fechaMontaje
  })

  const componentes = componentesData?.data || componentesData || []
  const disponibilidad = disponibilidadData?.data || disponibilidadData || null

  // Crear mapa de disponibilidad por elemento_id
  const disponibilidadMap = {}
  if (disponibilidad?.elementos) {
    disponibilidad.elementos.forEach(elem => {
      disponibilidadMap[elem.elemento_id] = elem
    })
  }

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getEstadoIcono = (estado) => {
    if (estado === 'ok') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (estado === 'insuficiente') {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />
  }

  const getEstadoBadge = (estado) => {
    if (estado === 'ok') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Disponible
        </span>
      )
    } else if (estado === 'insuficiente') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Insuficiente
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        Sin verificar
      </span>
    )
  }

  const getTipoBadge = (tipo) => {
    const estilos = {
      fijo: 'bg-slate-100 text-slate-700',
      alternativa: 'bg-blue-100 text-blue-700',
      adicional: 'bg-purple-100 text-purple-700'
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${estilos[tipo] || 'bg-slate-100 text-slate-700'}`}>
        {tipo}
      </span>
    )
  }

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  Componentes: {producto?.nombre}
                </h3>
                {fechaMontaje && (
                  <p className="text-sm text-slate-500">
                    Disponibilidad para {fechaMontaje} - {fechaDesmontaje || fechaMontaje}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {/* Resumen de disponibilidad */}
            {disponibilidad && (
              <div className={`mb-4 p-3 rounded-lg ${
                disponibilidad.hay_problemas
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-2">
                  {disponibilidad.hay_problemas
                    ? <AlertTriangle className="w-5 h-5 text-red-500" />
                    : <CheckCircle className="w-5 h-5 text-green-500" />
                  }
                  <span className={`font-medium ${
                    disponibilidad.hay_problemas ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {disponibilidad.hay_problemas
                      ? `${disponibilidad.resumen.elementos_insuficientes} componente(s) con stock insuficiente`
                      : 'Todos los componentes disponibles'
                    }
                  </span>
                </div>
                {cantidadSolicitada > 1 && (
                  <p className="text-sm text-slate-600 mt-1">
                    Para {cantidadSolicitada} unidades del producto
                  </p>
                )}
              </div>
            )}

            {/* Loading */}
            {(loadingComponentes || loadingDisponibilidad) && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            {/* Lista de componentes */}
            {!loadingComponentes && componentes.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Este producto no tiene componentes definidos
              </div>
            )}

            {!loadingComponentes && componentes.length > 0 && (
              <div className="space-y-3">
                {componentes.map((comp, index) => {
                  const dispInfo = disponibilidadMap[comp.elemento_id]
                  const cantidadRequerida = (comp.cantidad || 1) * cantidadSolicitada

                  return (
                    <div
                      key={`${comp.elemento_id}-${index}`}
                      className={`p-3 rounded-lg border ${
                        dispInfo?.estado === 'insuficiente'
                          ? 'border-red-200 bg-red-50/50'
                          : dispInfo?.estado === 'ok'
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded border border-slate-200">
                            <Box className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">
                                {comp.elemento_nombre || comp.nombre}
                              </span>
                              {getTipoBadge(comp.tipo)}
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              Cantidad por producto: {comp.cantidad || 1}
                              {cantidadSolicitada > 1 && (
                                <span className="text-slate-500">
                                  {' '}(Total: {cantidadRequerida})
                                </span>
                              )}
                            </div>
                            {comp.grupo && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                Grupo: {comp.grupo}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {dispInfo ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 justify-end">
                                {getEstadoIcono(dispInfo.estado)}
                                {getEstadoBadge(dispInfo.estado)}
                              </div>
                              <div className="text-xs text-slate-600 space-y-0.5">
                                <div>Stock: {dispInfo.stock_total}</div>
                                {dispInfo.ocupados_en_fecha > 0 && (
                                  <div className="text-orange-600">
                                    Ocupados: {dispInfo.ocupados_en_fecha}
                                  </div>
                                )}
                                <div className={dispInfo.estado === 'ok' ? 'text-green-600' : 'text-red-600'}>
                                  Disponibles: {dispInfo.disponibles}
                                </div>
                                {dispInfo.faltantes > 0 && (
                                  <div className="text-red-600 font-medium">
                                    Faltan: {dispInfo.faltantes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : !fechaMontaje ? (
                            <div className="text-xs text-slate-500">
                              Seleccione fechas para ver disponibilidad
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComponentesProductoModal
