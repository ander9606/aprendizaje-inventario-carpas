// ============================================
// COMPONENTE: CotizacionFormModal
// Modal para crear/editar cotizaciones
// ============================================

import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, Truck } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useCreateCotizacion, useUpdateCotizacion } from '../../hooks/UseCotizaciones'
import { useGetClientesActivos } from '../../hooks/UseClientes'
import { useGetProductosAlquiler } from '../../hooks/UseProductosAlquiler'
import { useGetTarifasTransporte } from '../../hooks/UseTarifasTransporte'

/**
 * CotizacionFormModal
 */
const CotizacionFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  cotizacion = null
}) => {

  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [formData, setFormData] = useState({
    cliente_id: '',
    fecha_evento: '',
    fecha_fin_evento: '',
    evento_nombre: '',
    evento_direccion: '',
    evento_ciudad: '',
    descuento: 0,
    vigencia_dias: 15,
    notas: ''
  })

  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [transporteSeleccionado, setTransporteSeleccionado] = useState([])
  const [errors, setErrors] = useState({})

  // ============================================
  // HOOKS
  // ============================================

  const { clientes, isLoading: loadingClientes } = useGetClientesActivos()
  const { productos, isLoading: loadingProductos } = useGetProductosAlquiler()
  const { tarifas, isLoading: loadingTarifas } = useGetTarifasTransporte()

  const { mutateAsync: createCotizacion, isLoading: isCreating } = useCreateCotizacion()
  const { mutateAsync: updateCotizacion, isLoading: isUpdating } = useUpdateCotizacion()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (mode === 'editar' && cotizacion) {
      setFormData({
        cliente_id: cotizacion.cliente_id || '',
        fecha_evento: cotizacion.fecha_evento?.split('T')[0] || '',
        fecha_fin_evento: cotizacion.fecha_fin_evento?.split('T')[0] || '',
        evento_nombre: cotizacion.evento_nombre || '',
        evento_direccion: cotizacion.evento_direccion || '',
        evento_ciudad: cotizacion.evento_ciudad || '',
        descuento: cotizacion.descuento || 0,
        vigencia_dias: cotizacion.vigencia_dias || 15,
        notas: cotizacion.notas || ''
      })
      setProductosSeleccionados(cotizacion.productos || [])
      setTransporteSeleccionado(cotizacion.transporte || [])
    } else {
      setFormData({
        cliente_id: '',
        fecha_evento: '',
        fecha_fin_evento: '',
        evento_nombre: '',
        evento_direccion: '',
        evento_ciudad: '',
        descuento: 0,
        vigencia_dias: 15,
        notas: ''
      })
      setProductosSeleccionados([])
      setTransporteSeleccionado([])
    }
    setErrors({})
  }, [mode, cotizacion, isOpen])

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const agregarProducto = () => {
    setProductosSeleccionados(prev => [...prev, {
      compuesto_id: '',
      cantidad: 1,
      precio_base: 0,
      deposito: 0,
      precio_adicionales: 0
    }])
  }

  const actualizarProducto = (index, campo, valor) => {
    setProductosSeleccionados(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [campo]: valor }

      // Si cambio el producto, actualizar precios
      if (campo === 'compuesto_id' && valor) {
        const producto = productos.find(p => p.id === parseInt(valor))
        if (producto) {
          nuevos[index].precio_base = producto.precio_base || 0
          nuevos[index].deposito = producto.deposito || 0
        }
      }

      return nuevos
    })
  }

  const eliminarProducto = (index) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index))
  }

  const agregarTransporte = () => {
    setTransporteSeleccionado(prev => [...prev, {
      tarifa_id: '',
      cantidad: 1
    }])
  }

  const actualizarTransporte = (index, campo, valor) => {
    setTransporteSeleccionado(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [campo]: valor }
      return nuevos
    })
  }

  const eliminarTransporte = (index) => {
    setTransporteSeleccionado(prev => prev.filter((_, i) => i !== index))
  }

  const calcularSubtotalProductos = () => {
    return productosSeleccionados.reduce((total, p) => {
      const subtotal = (parseFloat(p.precio_base) + parseFloat(p.precio_adicionales || 0)) * parseInt(p.cantidad || 1)
      return total + subtotal
    }, 0)
  }

  const calcularSubtotalTransporte = () => {
    return transporteSeleccionado.reduce((total, t) => {
      const tarifa = tarifas.find(tar => tar.id === parseInt(t.tarifa_id))
      if (tarifa) {
        return total + (tarifa.precio * parseInt(t.cantidad || 1))
      }
      return total
    }, 0)
  }

  const calcularTotal = () => {
    const subtotal = calcularSubtotalProductos() + calcularSubtotalTransporte()
    return subtotal - parseFloat(formData.descuento || 0)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Seleccione un cliente'
    }
    if (!formData.fecha_evento) {
      newErrors.fecha_evento = 'La fecha del evento es obligatoria'
    }
    if (productosSeleccionados.length === 0) {
      newErrors.productos = 'Debe agregar al menos un producto'
    }
    if (productosSeleccionados.some(p => !p.compuesto_id)) {
      newErrors.productos = 'Seleccione un producto para cada linea'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    const dataToSend = {
      cliente_id: parseInt(formData.cliente_id),
      fecha_evento: formData.fecha_evento,
      fecha_fin_evento: formData.fecha_fin_evento || null,
      evento_nombre: formData.evento_nombre.trim() || null,
      evento_direccion: formData.evento_direccion.trim() || null,
      evento_ciudad: formData.evento_ciudad.trim() || null,
      descuento: parseFloat(formData.descuento) || 0,
      vigencia_dias: parseInt(formData.vigencia_dias) || 15,
      notas: formData.notas.trim() || null,
      productos: productosSeleccionados.map(p => ({
        compuesto_id: parseInt(p.compuesto_id),
        cantidad: parseInt(p.cantidad) || 1,
        precio_base: parseFloat(p.precio_base) || 0,
        deposito: parseFloat(p.deposito) || 0,
        precio_adicionales: parseFloat(p.precio_adicionales) || 0
      })),
      transporte: transporteSeleccionado.filter(t => t.tarifa_id).map(t => ({
        tarifa_id: parseInt(t.tarifa_id),
        cantidad: parseInt(t.cantidad) || 1
      }))
    }

    try {
      if (mode === 'crear') {
        await createCotizacion(dataToSend)
      } else {
        await updateCotizacion({ id: cotizacion.id, data: dataToSend })
      }
      onClose()
    } catch (error) {
      console.error('Error al guardar cotizacion:', error)
      const mensajeError = error.response?.data?.message || 'Error al guardar la cotizacion'
      setErrors({ submit: mensajeError })
    }
  }

  const handleClose = () => {
    if (!isLoading) onClose()
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'crear' ? 'Nueva Cotizacion' : 'Editar Cotizacion'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ERROR GENERAL */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{errors.submit}</p>
          </div>
        )}

        {/* CLIENTE Y FECHAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cliente *
            </label>
            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              disabled={isLoading || loadingClientes}
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100
                ${errors.cliente_id ? 'border-red-300' : 'border-slate-300'}
              `}
            >
              <option value="">Seleccionar...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.cliente_id && (
              <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>
            )}
          </div>

          {/* Fecha evento */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha Evento *
            </label>
            <input
              type="date"
              name="fecha_evento"
              value={formData.fecha_evento}
              onChange={handleChange}
              disabled={isLoading}
              className={`
                w-full px-4 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100
                ${errors.fecha_evento ? 'border-red-300' : 'border-slate-300'}
              `}
            />
            {errors.fecha_evento && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha_evento}</p>
            )}
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              name="fecha_fin_evento"
              value={formData.fecha_fin_evento}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* INFORMACION DEL EVENTO */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Informacion del Evento</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Evento
              </label>
              <input
                type="text"
                name="evento_nombre"
                value={formData.evento_nombre}
                onChange={handleChange}
                placeholder="Ej: Boda Garcia"
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                name="evento_ciudad"
                value={formData.evento_ciudad}
                onChange={handleChange}
                placeholder="Ciudad del evento"
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Direccion
            </label>
            <input
              type="text"
              name="evento_direccion"
              value={formData.evento_direccion}
              onChange={handleChange}
              placeholder="Direccion del evento"
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* PRODUCTOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos *
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={agregarProducto}
              disabled={isLoading || loadingProductos}
            >
              Agregar
            </Button>
          </div>

          {errors.productos && (
            <p className="text-sm text-red-600">{errors.productos}</p>
          )}

          {productosSeleccionados.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center border border-dashed rounded-lg">
              No hay productos agregados
            </p>
          ) : (
            <div className="space-y-3">
              {productosSeleccionados.map((prod, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={prod.compuesto_id}
                      onChange={(e) => actualizarProducto(index, 'compuesto_id', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar producto...</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {formatearMoneda(p.precio_base)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={prod.cantidad}
                      onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center"
                      placeholder="Cant."
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      value={prod.precio_base}
                      onChange={(e) => actualizarProducto(index, 'precio_base', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-right"
                      placeholder="Precio"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarProducto(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-right text-sm">
            <span className="text-slate-600">Subtotal productos: </span>
            <span className="font-semibold">{formatearMoneda(calcularSubtotalProductos())}</span>
          </div>
        </div>

        {/* TRANSPORTE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Transporte
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={agregarTransporte}
              disabled={isLoading || loadingTarifas}
            >
              Agregar
            </Button>
          </div>

          {transporteSeleccionado.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center border border-dashed rounded-lg">
              Sin transporte
            </p>
          ) : (
            <div className="space-y-3">
              {transporteSeleccionado.map((trans, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={trans.tarifa_id}
                      onChange={(e) => actualizarTransporte(index, 'tarifa_id', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar tarifa...</option>
                      {tarifas.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.ciudad_destino} - {t.tipo_camion} - {formatearMoneda(t.precio)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={trans.cantidad}
                      onChange={(e) => actualizarTransporte(index, 'cantidad', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center"
                      placeholder="Cant."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarTransporte(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {transporteSeleccionado.length > 0 && (
            <div className="text-right text-sm">
              <span className="text-slate-600">Subtotal transporte: </span>
              <span className="font-semibold">{formatearMoneda(calcularSubtotalTransporte())}</span>
            </div>
          )}
        </div>

        {/* TOTALES */}
        <div className="bg-slate-100 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-medium">{formatearMoneda(calcularSubtotalProductos() + calcularSubtotalTransporte())}</span>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-slate-600">Descuento:</label>
            <input
              type="number"
              name="descuento"
              min="0"
              value={formData.descuento}
              onChange={handleChange}
              disabled={isLoading}
              className="w-32 px-3 py-1 border border-slate-300 rounded-lg text-sm text-right"
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-300">
            <span className="text-lg font-bold text-slate-900">TOTAL:</span>
            <span className="text-lg font-bold text-slate-900">{formatearMoneda(calcularTotal())}</span>
          </div>
        </div>

        {/* NOTAS */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notas
          </label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            placeholder="Notas adicionales..."
            rows={2}
            disabled={isLoading}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 resize-none"
          />
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            fullWidth
          >
            {mode === 'crear' ? 'Crear Cotizacion' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CotizacionFormModal
