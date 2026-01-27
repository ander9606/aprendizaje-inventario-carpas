// ============================================
// COMPONENTE: CotizacionDetalleModal
// Vista previa de cotización estilo PDF para cliente
// ============================================

import { useState } from 'react'
import { Calendar, User, MapPin, Phone, Mail, Truck, FileText, Edit, CheckCircle, XCircle, Ban } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Spinner from '../common/Spinner'
import { useGetCotizacionCompleta } from '../../hooks/cotizaciones'
import { useCancelarAlquiler } from '../../hooks/useAlquileres'

const CotizacionDetalleModal = ({
  isOpen,
  onClose,
  cotizacionId,
  onEditar,
  onAprobar,
  onRechazar,
  onCancelarAlquiler,
  isAprobando = false
}) => {
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  const [notasCancelacion, setNotasCancelacion] = useState('')

  const cancelarMutation = useCancelarAlquiler()

  // Cargar cotización completa con productos y transporte
  const { cotizacion, isLoading } = useGetCotizacionCompleta(isOpen ? cotizacionId : null)

  // ============================================
  // HELPERS
  // ============================================

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const getEstadoStyle = (estado) => {
    const estilos = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      aprobada: 'bg-green-100 text-green-800 border-green-300',
      rechazada: 'bg-red-100 text-red-800 border-red-300',
      vencida: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return estilos[estado] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const handleEditar = () => {
    if (onEditar && cotizacion) onEditar(cotizacion)
    onClose()
  }

  const handleAprobar = () => {
    if (onAprobar && cotizacion) onAprobar(cotizacion)
  }

  const handleRechazar = () => {
    if (confirm('¿Está seguro de rechazar esta cotización?')) {
      if (onRechazar && cotizacion) onRechazar(cotizacion)
    }
  }

  const handleCancelarAlquiler = async () => {
    if (!cotizacion?.alquiler_id) return

    try {
      await cancelarMutation.mutateAsync({
        id: cotizacion.alquiler_id,
        notas: notasCancelacion || 'Cancelado por el cliente'
      })
      setShowCancelarModal(false)
      setNotasCancelacion('')
      if (onCancelarAlquiler) onCancelarAlquiler()
      onClose()
    } catch (error) {
      alert('Error al cancelar el alquiler: ' + error.message)
    }
  }

  // Calcular totales simplificados para el cliente
  const subtotalProductos = cotizacion?.productos?.reduce((total, p) => {
    const precioUnitario = parseFloat(p.precio_base || 0) + parseFloat(p.precio_adicionales || 0)
    return total + (precioUnitario * parseInt(p.cantidad || 1))
  }, 0) || 0

  // Calcular subtotal de transporte (suma de todos los viajes)
  const subtotalTransporte = cotizacion?.transporte?.reduce((total, t) => {
    const precio = parseFloat(t.precio_unitario || t.subtotal || 0)
    return total + (t.subtotal ? parseFloat(t.subtotal) : precio * parseInt(t.cantidad || 1))
  }, 0) || 0

  const descuento = parseFloat(cotizacion?.descuento || 0)
  const total = subtotalProductos + subtotalTransporte - descuento

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      {isLoading ? (
        <div className="py-12">
          <Spinner size="lg" text="Cargando cotización..." />
        </div>
      ) : !cotizacion ? (
        <div className="py-12 text-center text-slate-500">
          No se pudo cargar la cotización
        </div>
      ) : (
        <>
          {/* Contenido estilo documento para cliente */}
          <div className="bg-white print:shadow-none" id="cotizacion-print">

            {/* ENCABEZADO */}
            <div className="border-b-2 border-slate-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                {/* Logo/Empresa */}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">COTIZACIÓN</h1>
                  <p className="text-slate-500 text-sm mt-1">Alquiler de Carpas y Eventos</p>
                </div>

                {/* Numero y Estado */}
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">#{cotizacion.id}</p>
                  <span className={`
                    inline-block px-3 py-1 text-sm font-medium rounded-full border mt-2
                    ${getEstadoStyle(cotizacion.estado)}
                  `}>
                    {cotizacion.estado?.charAt(0).toUpperCase() + cotizacion.estado?.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* INFO CLIENTE Y EVENTO */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Cliente */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente
                </h3>
                <p className="font-medium text-slate-900 text-lg">{cotizacion.cliente_nombre}</p>
                {cotizacion.cliente_telefono && (
                  <p className="text-slate-600 text-sm flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3" />
                    {cotizacion.cliente_telefono}
                  </p>
                )}
                {cotizacion.cliente_email && (
                  <p className="text-slate-600 text-sm flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3" />
                    {cotizacion.cliente_email}
                  </p>
                )}
              </div>

              {/* Evento */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Evento
                </h3>
                <p className="font-medium text-slate-900 text-lg">
                  {cotizacion.evento_nombre || 'Sin nombre'}
                </p>

                {/* Fechas: Montaje, Evento, Desmontaje */}
                <div className="mt-2 space-y-1 text-sm">
                  {cotizacion.fecha_montaje && (
                    <p className="text-slate-600">
                      <span className="font-medium">Montaje:</span> {formatearFecha(cotizacion.fecha_montaje)}
                    </p>
                  )}
                  <p className="text-slate-600">
                    <span className="font-medium">Evento:</span> {formatearFecha(cotizacion.fecha_evento)}
                  </p>
                  {cotizacion.fecha_desmontaje && (
                    <p className="text-slate-600">
                      <span className="font-medium">Desmontaje:</span> {formatearFecha(cotizacion.fecha_desmontaje)}
                    </p>
                  )}
                </div>

                {cotizacion.evento_ciudad && (
                  <p className="text-slate-600 text-sm flex items-center gap-2 mt-2">
                    <MapPin className="w-3 h-3" />
                    {cotizacion.evento_ciudad}
                    {cotizacion.evento_direccion && ` - ${cotizacion.evento_direccion}`}
                  </p>
                )}
              </div>
            </div>

            {/* PRODUCTOS - Vista simplificada para cliente */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">
                Detalle del Servicio
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Descripción</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-20">Cant.</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-32">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Productos */}
                    {cotizacion.productos?.length > 0 ? (
                      cotizacion.productos.map((producto, index) => {
                        const precioTotal = (parseFloat(producto.precio_base || 0) + parseFloat(producto.precio_adicionales || 0)) * parseInt(producto.cantidad || 1)
                        return (
                          <tr key={`prod-${index}`} className="border-t border-slate-100">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{producto.producto_nombre}</p>
                            </td>
                            <td className="text-center px-4 py-3 text-slate-600">{producto.cantidad}</td>
                            <td className="text-right px-4 py-3 font-medium text-slate-900">{formatearMoneda(precioTotal)}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-6 text-center text-slate-500 italic">
                          Sin productos
                        </td>
                      </tr>
                    )}

                    {/* Transporte - Una sola línea consolidada */}
                    {subtotalTransporte > 0 && (
                      <tr className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-500" />
                            Transporte
                          </p>
                        </td>
                        <td className="text-center px-4 py-3 text-slate-600">1</td>
                        <td className="text-right px-4 py-3 font-medium text-slate-900">{formatearMoneda(subtotalTransporte)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOTALES CON DESGLOSE COMPLETO */}
            <div className="border-t-2 border-slate-200 pt-4">
              <div className="flex justify-end">
                <div className="w-80">
                  {/* Subtotal Productos */}
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-slate-600">Subtotal productos:</span>
                    <span className="font-medium">{formatearMoneda(subtotalProductos)}</span>
                  </div>

                  {/* Subtotal Transporte */}
                  {subtotalTransporte > 0 && (
                    <div className="flex justify-between py-1.5 text-sm">
                      <span className="text-slate-600">Subtotal transporte:</span>
                      <span className="font-medium">{formatearMoneda(subtotalTransporte)}</span>
                    </div>
                  )}

                  {/* Días Adicionales */}
                  {cotizacion.cobro_dias_extra > 0 && (
                    <div className="flex justify-between py-1.5 text-sm text-amber-700">
                      <span>Días adicionales ({(cotizacion.dias_montaje_extra || 0) + (cotizacion.dias_desmontaje_extra || 0)} días):</span>
                      <span className="font-medium">+{formatearMoneda(cotizacion.cobro_dias_extra)}</span>
                    </div>
                  )}

                  {/* Línea separadora */}
                  <div className="border-t border-slate-200 my-2"></div>

                  {/* Subtotal */}
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium">{formatearMoneda(subtotalProductos + subtotalTransporte + (cotizacion.cobro_dias_extra || 0))}</span>
                  </div>

                  {/* Descuento */}
                  {descuento > 0 && (
                    <div className="flex justify-between py-1.5 text-sm text-green-600">
                      <span>Descuento:</span>
                      <span className="font-medium">-{formatearMoneda(descuento)}</span>
                    </div>
                  )}

                  {/* Base Gravable */}
                  <div className="flex justify-between py-1.5 text-sm border-t border-slate-200 mt-2 pt-2">
                    <span className="text-slate-700 font-medium">Base gravable:</span>
                    <span className="font-medium">{formatearMoneda(cotizacion.base_gravable || (subtotalProductos + subtotalTransporte - descuento))}</span>
                  </div>

                  {/* IVA */}
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-slate-600">IVA ({cotizacion.porcentaje_iva || 19}%):</span>
                    <span className="font-medium">+{formatearMoneda(cotizacion.valor_iva || 0)}</span>
                  </div>

                  {/* TOTAL FINAL */}
                  <div className="flex justify-between py-3 border-t-2 border-slate-900 mt-2">
                    <span className="text-xl font-bold text-slate-900">TOTAL:</span>
                    <span className="text-xl font-bold text-blue-700">{formatearMoneda(cotizacion.total || total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTAS */}
            {cotizacion.notas && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notas
                </h4>
                <p className="text-amber-700 text-sm whitespace-pre-wrap">{cotizacion.notas}</p>
              </div>
            )}

            {/* VIGENCIA */}
            <div className="mt-6 text-center text-sm text-slate-500">
              <p>Esta cotización tiene una vigencia de {cotizacion.vigencia_dias || 15} días.</p>
              <p className="mt-1">Cotización sujeta a disponibilidad. Solo se reserva con anticipo.</p>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN - Solo para cotizaciones pendientes */}
          {cotizacion.estado === 'pendiente' && (
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t print:hidden">
              <Button
                variant="success"
                size="lg"
                icon={<CheckCircle className="w-5 h-5" />}
                onClick={handleAprobar}
                loading={isAprobando}
                disabled={isAprobando}
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                Aprobar
              </Button>

              <Button
                variant="secondary"
                size="lg"
                icon={<Edit className="w-5 h-5" />}
                onClick={handleEditar}
                disabled={isAprobando}
                className="px-8"
              >
                Editar
              </Button>

              <Button
                variant="danger"
                size="lg"
                icon={<XCircle className="w-5 h-5" />}
                onClick={handleRechazar}
                disabled={isAprobando}
                className="px-8 bg-red-600 hover:bg-red-700"
              >
                Rechazar
              </Button>
            </div>
          )}

          {/* BOTÓN CANCELAR ALQUILER - Solo para cotizaciones aprobadas */}
          {cotizacion.estado === 'aprobada' && cotizacion.alquiler_id && (
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t print:hidden">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Cotización Aprobada - Alquiler #{cotizacion.alquiler_id}</span>
              </div>

              <Button
                variant="danger"
                size="lg"
                icon={<Ban className="w-5 h-5" />}
                onClick={() => setShowCancelarModal(true)}
                className="px-6 bg-red-600 hover:bg-red-700"
              >
                Cancelar Alquiler
              </Button>
            </div>
          )}

          {/* Modal de confirmación para cancelar alquiler */}
          {showCancelarModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-600" />
                  Cancelar Alquiler
                </h3>
                <p className="text-slate-600 mb-4">
                  ¿Está seguro de cancelar este alquiler? Esta acción liberará el inventario reservado.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motivo de cancelación (opcional)
                  </label>
                  <textarea
                    value={notasCancelacion}
                    onChange={(e) => setNotasCancelacion(e.target.value)}
                    rows={3}
                    placeholder="Ej: Cliente canceló por cambio de planes..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCancelarModal(false)
                      setNotasCancelacion('')
                    }}
                    disabled={cancelarMutation.isPending}
                  >
                    Volver
                  </Button>
                  <Button
                    variant="danger"
                    icon={<Ban className="w-4 h-4" />}
                    onClick={handleCancelarAlquiler}
                    loading={cancelarMutation.isPending}
                    disabled={cancelarMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirmar Cancelación
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

export default CotizacionDetalleModal
