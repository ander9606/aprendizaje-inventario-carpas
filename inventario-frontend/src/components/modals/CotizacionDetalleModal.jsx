// ============================================
// COMPONENTE: CotizacionDetalleModal
// Vista previa de cotización estilo PDF
// ============================================

import { X, Calendar, User, MapPin, Phone, Mail, Package, Truck, FileText, Edit, Printer } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'

const CotizacionDetalleModal = ({
  isOpen,
  onClose,
  cotizacion,
  onEditar
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

  // Calcular subtotales
  const subtotalProductos = cotizacion.productos?.reduce((total, p) => {
    const precioUnitario = parseFloat(p.precio_base || 0) + parseFloat(p.precio_adicionales || 0)
    return total + (precioUnitario * parseInt(p.cantidad || 1))
  }, 0) || 0

  const subtotalTransporte = cotizacion.transporte?.reduce((total, t) => {
    return total + (parseFloat(t.precio || 0) * parseInt(t.cantidad || 1))
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
      {/* Contenido estilo documento */}
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

        {/* PRODUCTOS */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Productos
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Producto</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-20">Cant.</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-32">P. Unit.</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-32">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cotizacion.productos?.length > 0 ? (
                  cotizacion.productos.map((producto, index) => {
                    const precioUnitario = parseFloat(producto.precio_base || 0) + parseFloat(producto.precio_adicionales || 0)
                    const subtotal = precioUnitario * parseInt(producto.cantidad || 1)
                    return (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{producto.producto_nombre}</p>
                          {producto.precio_adicionales > 0 && (
                            <p className="text-xs text-blue-600">+ Adicionales incluidos</p>
                          )}
                        </td>
                        <td className="text-center px-4 py-3 text-slate-600">{producto.cantidad}</td>
                        <td className="text-right px-4 py-3 text-slate-600">{formatearMoneda(precioUnitario)}</td>
                        <td className="text-right px-4 py-3 font-medium text-slate-900">{formatearMoneda(subtotal)}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-6 text-center text-slate-500 italic">
                      Sin productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRANSPORTE */}
        {cotizacion.transporte?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-lg">
              <Truck className="w-5 h-5" />
              Transporte
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Tipo</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-20">Viajes</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-32">Precio</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.transporte.map((trans, index) => {
                    const subtotal = parseFloat(trans.precio || 0) * parseInt(trans.cantidad || 1)
                    return (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          Camión {trans.tipo_camion}
                        </td>
                        <td className="text-center px-4 py-3 text-slate-600">{trans.cantidad}</td>
                        <td className="text-right px-4 py-3 text-slate-600">{formatearMoneda(trans.precio)}</td>
                        <td className="text-right px-4 py-3 font-medium text-slate-900">{formatearMoneda(subtotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TOTALES */}
        <div className="border-t-2 border-slate-200 pt-4">
          <div className="flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Subtotal Productos:</span>
                <span className="font-medium">{formatearMoneda(subtotalProductos)}</span>
              </div>
              {subtotalTransporte > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Subtotal Transporte:</span>
                  <span className="font-medium">{formatearMoneda(subtotalTransporte)}</span>
                </div>
              )}
              {descuento > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Descuento:</span>
                  <span className="font-medium">-{formatearMoneda(descuento)}</span>
                </div>
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
      <div className="flex gap-3 mt-6 pt-4 border-t print:hidden">
        <Button
          variant="secondary"
          icon={<Printer className="w-4 h-4" />}
          onClick={handleImprimir}
        >
          Imprimir
        </Button>

        {cotizacion.estado === 'pendiente' && (
          <Button
            variant="primary"
            icon={<Edit className="w-4 h-4" />}
            onClick={handleEditar}
          >
            Editar Cotización
          </Button>
        )}

        <div className="flex-1" />

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
