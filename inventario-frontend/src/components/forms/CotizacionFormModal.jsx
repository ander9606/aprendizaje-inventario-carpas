// ============================================
// COMPONENTE: CotizacionFormModal
// Modal para crear/editar cotizaciones
// ============================================

import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, Truck, MapPin } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import ProductoConfiguracion from './ProductoConfiguracion'
import { useCreateCotizacion, useUpdateCotizacion, useGetCotizacionCompleta } from '../../hooks/cotizaciones'
import { useGetClientesActivos } from '../../hooks/UseClientes'
import { useGetProductosAlquiler } from '../../hooks/UseProductosAlquiler'
import { useGetTarifasTransporte } from '../../hooks/UseTarifasTransporte'
import { useGetCiudadesActivas } from '../../hooks/UseCiudades'
import { useGetUbicacionesActivas } from '../../hooks/Useubicaciones'

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
    fecha_montaje: '',
    fecha_evento: '',
    fecha_desmontaje: '',
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
  const { ciudades, isLoading: loadingCiudades } = useGetCiudadesActivas()
  const { ubicaciones, isLoading: loadingUbicaciones } = useGetUbicacionesActivas()

  const { mutateAsync: createCotizacion, isLoading: isCreating } = useCreateCotizacion()
  const { mutateAsync: updateCotizacion, isLoading: isUpdating } = useUpdateCotizacion()

  // Cargar cotización completa con productos cuando se edita
  const { cotizacion: cotizacionCompleta, isLoading: loadingCotizacion } = useGetCotizacionCompleta(
    mode === 'editar' && cotizacion?.id && isOpen ? cotizacion.id : null
  )

  const isLoading = isCreating || isUpdating || loadingCotizacion

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    // Usar cotizacionCompleta cuando está disponible para modo editar
    const datosACopiar = mode === 'editar' ? (cotizacionCompleta || cotizacion) : null

    if (mode === 'editar' && datosACopiar) {
      setFormData({
        cliente_id: datosACopiar.cliente_id || '',
        fecha_montaje: datosACopiar.fecha_montaje?.split('T')[0] || '',
        fecha_evento: datosACopiar.fecha_evento?.split('T')[0] || '',
        fecha_desmontaje: datosACopiar.fecha_desmontaje?.split('T')[0] || '',
        evento_nombre: datosACopiar.evento_nombre || '',
        evento_direccion: datosACopiar.evento_direccion || '',
        evento_ciudad: datosACopiar.evento_ciudad || '',
        descuento: datosACopiar.descuento || 0,
        vigencia_dias: datosACopiar.vigencia_dias || 15,
        notas: datosACopiar.notas || ''
      })

      // Solo cargar productos/transporte cuando tenemos la cotización completa
      if (cotizacionCompleta) {
        // Mapear productos para el formato del formulario
        const productosFormateados = (cotizacionCompleta.productos || []).map(p => ({
          compuesto_id: p.compuesto_id?.toString() || '',
          cantidad: p.cantidad || 1,
          precio_base: p.precio_base || 0,
          deposito: p.deposito || 0,
          precio_adicionales: p.precio_adicionales || 0,
          configuracion: p.configuracion || null
        }))
        setProductosSeleccionados(productosFormateados)

        // Mapear transporte para el formato del formulario
        const transporteFormateado = (cotizacionCompleta.transporte || []).map(t => ({
          tarifa_id: t.tarifa_id?.toString() || '',
          cantidad: t.cantidad || 1
        }))
        setTransporteSeleccionado(transporteFormateado)
      }
    } else if (mode === 'crear') {
      setFormData({
        cliente_id: '',
        fecha_montaje: '',
        fecha_evento: '',
        fecha_desmontaje: '',
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
  }, [mode, cotizacion, cotizacionCompleta, isOpen])

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
    // Si cambia la ciudad, limpiar transporte seleccionado y direccion
    if (name === 'evento_ciudad') {
      setTransporteSeleccionado([])
      setFormData(prev => ({
        ...prev,
        evento_ciudad: value,
        evento_direccion: ''
      }))
    }
  }

  const agregarProducto = () => {
    setProductosSeleccionados(prev => [...prev, {
      compuesto_id: '',
      cantidad: 1,
      precio_base: 0,
      deposito: 0,
      precio_adicionales: 0,
      configuracion: null
    }])
  }

  const actualizarProducto = (index, campo, valor) => {
    setProductosSeleccionados(prev => {
      const nuevos = [...prev]

      // Si cambio el producto, actualizar precios y resetear configuración
      if (campo === 'compuesto_id' && valor) {
        const producto = productos.find(p => p.id === parseInt(valor))
        if (producto) {
          nuevos[index] = {
            ...nuevos[index],
            [campo]: valor,
            precio_base: producto.precio_base || 0,
            deposito: producto.deposito || 0,
            configuracion: null,
            precio_adicionales: 0
          }
          return nuevos
        }
      }

      nuevos[index] = { ...nuevos[index], [campo]: valor }
      return nuevos
    })
  }

  const eliminarProducto = (index) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index))
  }

  const actualizarConfiguracion = (index, configuracion, precioAdicional) => {
    setProductosSeleccionados(prev => {
      const nuevos = [...prev]
      nuevos[index] = {
        ...nuevos[index],
        configuracion,
        precio_adicionales: precioAdicional
      }
      return nuevos
    })
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
    if (!formData.evento_ciudad) {
      newErrors.evento_ciudad = 'Seleccione una ciudad'
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
      fecha_montaje: formData.fecha_montaje || formData.fecha_evento,
      fecha_evento: formData.fecha_evento,
      fecha_desmontaje: formData.fecha_desmontaje || formData.fecha_evento,
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
        precio_adicionales: parseFloat(p.precio_adicionales) || 0,
        configuracion: p.configuracion || null
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

  // Filtrar ubicaciones por ciudad seleccionada
  const ubicacionesFiltradas = formData.evento_ciudad
    ? ubicaciones.filter(u => u.ciudad === formData.evento_ciudad)
    : []

  // Filtrar tarifas por ciudad seleccionada
  const tarifasFiltradas = formData.evento_ciudad
    ? tarifas.filter(t => t.ciudad === formData.evento_ciudad)
    : tarifas

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

        {/* CLIENTE */}
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

        {/* FECHAS: Montaje, Evento, Desmontaje */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha Montaje */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha Montaje
            </label>
            <input
              type="date"
              name="fecha_montaje"
              value={formData.fecha_montaje}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">Cuando se instala</p>
          </div>

          {/* Fecha Evento */}
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

          {/* Fecha Desmontaje */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha Desmontaje
            </label>
            <input
              type="date"
              name="fecha_desmontaje"
              value={formData.fecha_desmontaje}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">Cuando se recoge</p>
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
                Ciudad *
              </label>
              <select
                name="evento_ciudad"
                value={formData.evento_ciudad}
                onChange={handleChange}
                disabled={isLoading || loadingCiudades}
                className={`
                  w-full px-4 py-2.5 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-slate-100
                  ${errors.evento_ciudad ? 'border-red-300' : 'border-slate-300'}
                `}
              >
                <option value="">Seleccionar ciudad...</option>
                {ciudades.map(ciudad => (
                  <option key={ciudad.id} value={ciudad.nombre}>{ciudad.nombre}</option>
                ))}
              </select>
              {errors.evento_ciudad && (
                <p className="mt-1 text-sm text-red-600">{errors.evento_ciudad}</p>
              )}
              {ciudades.length === 0 && !loadingCiudades && (
                <p className="mt-1 text-xs text-amber-600">
                  No hay ciudades. Cree ciudades en Configuracion primero.
                </p>
              )}
            </div>
          </div>

          {/* Ubicacion del evento */}
          {formData.evento_ciudad && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicacion del Evento
              </label>
              <select
                name="evento_ubicacion_id"
                value={formData.evento_direccion}
                onChange={(e) => {
                  const ubicacion = ubicacionesFiltradas.find(u => u.id === parseInt(e.target.value))
                  setFormData(prev => ({
                    ...prev,
                    evento_direccion: ubicacion ? ubicacion.direccion : ''
                  }))
                }}
                disabled={isLoading || loadingUbicaciones}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                <option value="">Seleccionar ubicacion...</option>
                {ubicacionesFiltradas.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.direccion ? `- ${u.direccion}` : ''}
                  </option>
                ))}
              </select>
              {ubicacionesFiltradas.length === 0 && !loadingUbicaciones && (
                <p className="mt-1 text-xs text-slate-500">
                  No hay ubicaciones para {formData.evento_ciudad}
                </p>
              )}
              {formData.evento_direccion && (
                <p className="mt-2 text-sm text-slate-600">
                  <strong>Direccion:</strong> {formData.evento_direccion}
                </p>
              )}
            </div>
          )}
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
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex gap-3 items-start">
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

                  {/* Configuracion de componentes */}
                  {prod.compuesto_id && (
                    <ProductoConfiguracion
                      productoId={parseInt(prod.compuesto_id)}
                      cantidad={parseInt(prod.cantidad) || 1}
                      configuracion={prod.configuracion}
                      onConfiguracionChange={(config, precioAdicional) =>
                        actualizarConfiguracion(index, config, precioAdicional)
                      }
                      disabled={isLoading}
                    />
                  )}

                  {/* Mostrar precio adicionales si hay */}
                  {prod.precio_adicionales > 0 && (
                    <div className="mt-2 text-right text-xs text-blue-600">
                      Adicionales: +{formatearMoneda(prod.precio_adicionales)}
                    </div>
                  )}
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
              {formData.evento_ciudad && (
                <span className="text-sm font-normal text-slate-500">
                  ({formData.evento_ciudad})
                </span>
              )}
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={agregarTransporte}
              disabled={isLoading || loadingTarifas || !formData.evento_ciudad}
            >
              Agregar
            </Button>
          </div>

          {!formData.evento_ciudad ? (
            <p className="text-sm text-amber-600 italic py-4 text-center border border-dashed border-amber-300 rounded-lg bg-amber-50">
              Seleccione una ciudad para ver las tarifas disponibles
            </p>
          ) : transporteSeleccionado.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center border border-dashed rounded-lg">
              Sin transporte - {tarifasFiltradas.length} tarifa{tarifasFiltradas.length !== 1 ? 's' : ''} disponible{tarifasFiltradas.length !== 1 ? 's' : ''}
            </p>
          ) : (
            <div className="space-y-3">
              {transporteSeleccionado.map((trans, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={trans.tarifa_id}
                      onChange={(e) => actualizarTransporte(index, 'tarifa_id', e.target.value)}
                      disabled={isLoading || !formData.evento_ciudad}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar tarifa...</option>
                      {tarifasFiltradas.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.tipo_camion} - {formatearMoneda(t.precio)}
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
