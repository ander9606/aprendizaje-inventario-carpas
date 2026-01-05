// ============================================
// COMPONENTE: CotizacionDetalleModal
// Vista previa de cotización estilo PDF para cliente
// ============================================

import { Calendar, User, MapPin, Phone, Mail, Truck, FileText, Edit, Printer, CheckCircle, Trash2, XCircle } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'

const CotizacionDetalleModal = ({
  isOpen,
  onClose,
  cotizacion,
  onEditar,
  onAprobar,
  onEliminar,
  onRechazar,
  isAprobando = false,
  isEliminando = false
}) => {

  if (!cotizacion) return null

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

  const handleImprimir = () => {
    window.print()
  }

  const handleEditar = () => {
    if (onEditar) onEditar(cotizacion)
    onClose()
  }

  const handleAprobar = () => {
    if (onAprobar) onAprobar(cotizacion)
  }

  const handleEliminar = () => {
    if (confirm('¿Está seguro de eliminar esta cotización? Esta acción no se puede deshacer.')) {
      if (onEliminar) onEliminar(cotizacion)
    }
  }

  const handleRechazar = () => {
    if (confirm('¿Está seguro de rechazar esta cotización?')) {
      if (onRechazar) onRechazar(cotizacion)
    }
  }

  // Calcular totales simplificados para el cliente
  const subtotalProductos = cotizacion.productos?.reduce((total, p) => {
    const precioUnitario = parseFloat(p.precio_base || 0) + parseFloat(p.precio_adicionales || 0)
    return total + (precioUnitario * parseInt(p.cantidad || 1))
  }, 0) || 0

  const subtotalTransporte = cotizacion.transporte?.reduce((total, t) => {
    const precio = parseFloat(t.precio_unitario || t.precio || 0)
    return total + (precio * parseInt(t.cantidad || 1))
  }, 0) || 0

  const descuento = parseFloat(cotizacion.descuento || 0)
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
            <p className="text-slate-600 text-sm mt-1">
              {formatearFecha(cotizacion.fecha_evento)}
              {cotizacion.fecha_fin_evento && cotizacion.fecha_fin_evento !== cotizacion.fecha_evento && (
                <> al {formatearFecha(cotizacion.fecha_fin_evento)}</>
              )}
            </p>
            {cotizacion.evento_ciudad && (
              <p className="text-slate-600 text-sm flex items-center gap-2 mt-1">
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

                {/* Transporte como una línea más del servicio */}
                {cotizacion.transporte?.length > 0 && cotizacion.transporte.map((trans, index) => {
                  const precio = parseFloat(trans.precio_unitario || trans.precio || 0)
                  const subtotal = precio * parseInt(trans.cantidad || 1)
                  return (
                    <tr key={`trans-${index}`} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate-500" />
                          Transporte - {trans.tipo_camion}
                        </p>
                      </td>
                      <td className="text-center px-4 py-3 text-slate-600">{trans.cantidad}</td>
                      <td className="text-right px-4 py-3 font-medium text-slate-900">{formatearMoneda(subtotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOTALES - Simplificado */}
        <div className="border-t-2 border-slate-200 pt-4">
          <div className="flex justify-end">
            <div className="w-72">
              {descuento > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium">{formatearMoneda(subtotalProductos + subtotalTransporte)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Descuento:</span>
                    <span className="font-medium">-{formatearMoneda(descuento)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-3 border-t-2 border-slate-900 mt-2">
                <span className="text-xl font-bold text-slate-900">TOTAL:</span>
                <span className="text-xl font-bold text-slate-900">{formatearMoneda(total)}</span>
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
          <p className="mt-1">Precios sujetos a cambios sin previo aviso.</p>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t print:hidden">
        {/* Acciones principales para cotizaciones pendientes */}
        {cotizacion.estado === 'pendiente' && (
          <>
            <Button
              variant="success"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={handleAprobar}
              loading={isAprobando}
              disabled={isAprobando || isEliminando}
            >
              Aprobar
            </Button>

            <Button
              variant="secondary"
              icon={<Edit className="w-4 h-4" />}
              onClick={handleEditar}
              disabled={isAprobando || isEliminando}
            >
              Editar
            </Button>

            <Button
              variant="ghost"
              icon={<XCircle className="w-4 h-4" />}
              onClick={handleRechazar}
              disabled={isAprobando || isEliminando}
              className="text-orange-600 hover:bg-orange-50"
            >
              Rechazar
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          icon={<Printer className="w-4 h-4" />}
          onClick={handleImprimir}
        >
          Imprimir
        </Button>

        <div className="flex-1" />

        {/* Eliminar solo para pendientes y rechazadas */}
        {(cotizacion.estado === 'pendiente' || cotizacion.estado === 'rechazada') && (
          <Button
            variant="ghost"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleEliminar}
            loading={isEliminando}
            disabled={isAprobando || isEliminando}
            className="text-red-600 hover:bg-red-50"
          >
            Eliminar
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}

export default CotizacionDetalleModal
