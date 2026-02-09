// ============================================
// PÁGINA: AlquilerDetallePage
// Detalle completo de un alquiler
// ============================================

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  FileText,
  LogOut,
  LogIn,
  Printer,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  ChevronRight
} from 'lucide-react'
import {
  useGetAlquilerCompleto,
  useCancelarAlquiler
} from '../hooks/useAlquileres'
import { AlquilerTimeline } from '../components/alquileres'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { toast } from 'sonner'

// ============================================
// COMPONENTE PRINCIPAL: AlquilerDetallePage
// ============================================
export default function AlquilerDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // ============================================
  // ESTADO
  // ============================================
  const [showMenuAcciones, setShowMenuAcciones] = useState(false)
  const [showModalCancelar, setShowModalCancelar] = useState(false)

  // ============================================
  // QUERIES Y MUTATIONS
  // ============================================
  const { alquiler, isLoading, error, refetch } = useGetAlquilerCompleto(id)
  const cancelarAlquiler = useCancelarAlquiler()

  // ============================================
  // HELPERS
  // ============================================

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatFechaHora = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMoneda = (valor) => {
    if (!valor && valor !== 0) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor)
  }

  const getEstadoConfig = (estado) => {
    const configs = {
      programado: {
        label: 'Programado',
        icon: Clock,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700'
      },
      activo: {
        label: 'Activo',
        icon: Truck,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
      },
      finalizado: {
        label: 'Finalizado',
        icon: CheckCircle,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      },
      cancelado: {
        label: 'Cancelado',
        icon: XCircle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
      }
    }
    return configs[estado] || configs.programado
  }

  const isRetornoVencido = () => {
    if (!alquiler || alquiler.estado !== 'activo') return false
    if (!alquiler.fecha_retorno_esperado) return false
    return new Date() > new Date(alquiler.fecha_retorno_esperado)
  }

  const getOrdenEstadoConfig = (estado) => {
    const configs = {
      pendiente: { label: 'Pendiente', icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      confirmado: { label: 'Confirmado', icon: CheckCircle, bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
      en_preparacion: { label: 'Preparación', icon: Package, bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      en_ruta: { label: 'En ruta', icon: Truck, bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
      en_sitio: { label: 'En sitio', icon: MapPin, bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
      en_proceso: { label: 'En proceso', icon: RefreshCw, bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      completado: { label: 'Completado', icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      cancelado: { label: 'Cancelado', icon: XCircle, bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
    }
    return configs[estado] || configs.pendiente
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleVolver = () => {
    navigate('/alquileres/gestion')
  }

  const handleCancelarAlquiler = async () => {
    try {
      await cancelarAlquiler.mutateAsync({ id: alquiler.id, notas: 'Cancelado desde detalle' })
      toast.success('Alquiler cancelado')
      setShowModalCancelar(false)
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error al cancelar')
    }
  }

  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" text="Cargando alquiler..." />
      </div>
    )
  }

  if (error || !alquiler) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Alquiler no encontrado
          </h2>
          <p className="text-slate-600 mb-6">
            El alquiler que buscas no existe o fue eliminado
          </p>
          <Button onClick={handleVolver}>
            Volver a Alquileres
          </Button>
        </div>
      </div>
    )
  }

  const estadoConfig = getEstadoConfig(alquiler.estado)
  const EstadoIcon = estadoConfig.icon
  const retornoVencido = isRetornoVencido()

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">
                    Alquiler #{alquiler.id}
                  </h1>
                  <span className={`
                    inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
                    ${estadoConfig.bgColor} ${estadoConfig.textColor}
                  `}>
                    <EstadoIcon className="w-3 h-3" />
                    {estadoConfig.label}
                  </span>
                  {retornoVencido && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3" />
                      Retorno vencido
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {alquiler.evento_nombre} - {alquiler.cliente_nombre}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              {/* Menú de más acciones */}
              <div className="relative">
                <Button
                  variant="ghost"
                  icon={<MoreVertical className="w-4 h-4" />}
                  onClick={() => setShowMenuAcciones(!showMenuAcciones)}
                />
                {showMenuAcciones && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenuAcciones(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        onClick={() => {
                          setShowMenuAcciones(false)
                          if (alquiler.cotizacion_id) {
                            navigate('/alquileres/cotizaciones')
                          } else {
                            toast.info('Cotización no disponible')
                          }
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        Ver Cotización
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        onClick={() => {
                          // TODO: Implementar imprimir
                          toast.info('Funcionalidad en desarrollo')
                          setShowMenuAcciones(false)
                        }}
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir
                      </button>
                      {(alquiler.estado === 'programado' || alquiler.estado === 'activo') && (
                        <>
                          <hr className="my-1" />
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            onClick={() => {
                              setShowMenuAcciones(false)
                              setShowModalCancelar(true)
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                            Cancelar Alquiler
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información General */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Información General
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Cliente</p>
                    <p className="font-medium text-slate-900">{alquiler.cliente_nombre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Evento</p>
                    <p className="font-medium text-slate-900">{alquiler.evento_nombre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <LogOut className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Fecha Salida</p>
                    <p className="font-medium text-slate-900">{formatFecha(alquiler.fecha_salida)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <LogIn className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Retorno Esperado</p>
                    <p className={`font-medium ${retornoVencido ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatFecha(alquiler.fecha_retorno_esperado)}
                    </p>
                  </div>
                </div>

                {alquiler.fecha_retorno_real && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Retorno Real</p>
                      <p className="font-medium text-slate-900">{formatFecha(alquiler.fecha_retorno_real)}</p>
                    </div>
                  </div>
                )}

                {alquiler.evento_direccion && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Dirección del Evento</p>
                      <p className="font-medium text-slate-900">{alquiler.evento_direccion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estado de Órdenes de Trabajo */}
            {(alquiler.orden_montaje_id || alquiler.orden_desmontaje_id) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Órdenes de Trabajo
                </h2>
                <div className="space-y-3">
                  {/* Orden de Montaje */}
                  {alquiler.orden_montaje_id && (() => {
                    const cfg = getOrdenEstadoConfig(alquiler.orden_montaje_estado)
                    const Icon = cfg.icon
                    return (
                      <Link
                        to={`/operaciones/ordenes/${alquiler.orden_montaje_id}`}
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2.5 bg-emerald-50 rounded-lg">
                          <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">Montaje</p>
                          <p className="text-sm text-slate-500">Orden #{alquiler.orden_montaje_id}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </Link>
                    )
                  })()}

                  {/* Orden de Desmontaje */}
                  {alquiler.orden_desmontaje_id && (() => {
                    const cfg = getOrdenEstadoConfig(alquiler.orden_desmontaje_estado)
                    const Icon = cfg.icon
                    return (
                      <Link
                        to={`/operaciones/ordenes/${alquiler.orden_desmontaje_id}`}
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2.5 bg-orange-50 rounded-lg">
                          <Truck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">Desmontaje</p>
                          <p className="text-sm text-slate-500">Orden #{alquiler.orden_desmontaje_id}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </Link>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Resumen Financiero */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Resumen Financiero
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <DollarSign className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-xl font-bold text-slate-900">{formatMoneda(alquiler.total)}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Depósito</p>
                  <p className="text-xl font-bold text-green-700">{formatMoneda(alquiler.deposito_cobrado)}</p>
                </div>

                <div className={`rounded-lg p-4 text-center ${alquiler.costo_danos > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${alquiler.costo_danos > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                  <p className="text-sm text-slate-500">Daños</p>
                  <p className={`text-xl font-bold ${alquiler.costo_danos > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                    {formatMoneda(alquiler.costo_danos || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Productos Cotizados */}
            {alquiler.productos && alquiler.productos.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Productos Cotizados
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Producto</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Cantidad</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Precio Unit.</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alquiler.productos.map((producto, index) => (
                        <tr key={index} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">{producto.nombre}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">{producto.cantidad}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatMoneda(producto.precio_base)}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">{formatMoneda(producto.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Elementos Asignados */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Elementos Asignados
              </h2>

              {alquiler.elementos && alquiler.elementos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Elemento</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Serie</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Cantidad</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Estado Salida</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Estado Retorno</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alquiler.elementos.map((elemento, index) => (
                        <tr key={index} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">{elemento.elemento_nombre}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {elemento.serie_codigo || '-'}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">
                            {elemento.cantidad_lote || 1}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`
                              inline-flex px-2 py-1 text-xs font-medium rounded-full
                              ${elemento.estado_salida === 'bueno' ? 'bg-green-100 text-green-700' : ''}
                              ${elemento.estado_salida === 'nuevo' ? 'bg-blue-100 text-blue-700' : ''}
                              ${elemento.estado_salida === 'mantenimiento' ? 'bg-yellow-100 text-yellow-700' : ''}
                            `}>
                              {elemento.estado_salida || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {elemento.estado_retorno ? (
                              <span className={`
                                inline-flex px-2 py-1 text-xs font-medium rounded-full
                                ${elemento.estado_retorno === 'bueno' ? 'bg-green-100 text-green-700' : ''}
                                ${elemento.estado_retorno === 'dañado' ? 'bg-yellow-100 text-yellow-700' : ''}
                                ${elemento.estado_retorno === 'perdido' ? 'bg-red-100 text-red-700' : ''}
                              `}>
                                {elemento.estado_retorno}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No hay elementos asignados</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Los elementos se asignan automáticamente al aprobar la cotización.
                  </p>
                  {alquiler.orden_montaje_id && (
                    <Link to={`/operaciones/ordenes/${alquiler.orden_montaje_id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        icon={<ExternalLink className="w-4 h-4" />}
                      >
                        Ver en Operaciones
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Columna lateral - Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Historial
              </h2>

              <AlquilerTimeline
                cotizacion={alquiler.cotizacion}
                alquiler={alquiler}
                elementos={alquiler.elementos}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Confirmar Cancelación */}
      {showModalCancelar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Cancelar Alquiler
            </h3>
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de cancelar este alquiler? Esta acción liberará todos los elementos asignados.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowModalCancelar(false)}
              >
                No, mantener
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelarAlquiler}
                disabled={cancelarAlquiler.isPending}
              >
                {cancelarAlquiler.isPending ? 'Cancelando...' : 'Sí, cancelar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
