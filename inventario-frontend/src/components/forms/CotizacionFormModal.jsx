// ============================================
// COMPONENTE: CotizacionFormModal
// Modal para crear/editar cotizaciones
// ============================================

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Package, Truck, MapPin, CalendarDays, Calendar, Clock, Percent, ChevronDown, ChevronUp, CheckCircle, User } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import ProductoSelector from '../common/ProductoSelector'
import ProductoConfiguracion from './ProductoConfiguracion'
import DisponibilidadModal from '../disponibilidad/DisponibilidadModal'
import RecargoModal from '../modals/RecargoModal'
import { ProductoSelectorTarjetas } from '../cotizaciones'
import { useCreateCotizacion, useUpdateCotizacion, useGetCotizacionCompleta } from '../../hooks/cotizaciones'
import { useGetClientesActivos } from '../../hooks/UseClientes'
import { useGetProductosAlquiler } from '../../hooks/UseProductosAlquiler'
import { useGetTarifasTransporte } from '../../hooks/UseTarifasTransporte'
import { useGetCiudadesActivas } from '../../hooks/UseCiudades'
import { useGetUbicacionesActivas } from '../../hooks/Useubicaciones'
import { useGetEventosPorCliente } from '../../hooks/useEventos'
import { useGetConfiguracionCompleta } from '../../hooks/useConfiguracion'

/**
 * CotizacionFormModal
 */
const CotizacionFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  cotizacion = null,
  eventoPreseleccionado = null
}) => {

  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [formData, setFormData] = useState({
    cliente_id: '',
    evento_id: '',
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
  const [mostrarSelectorProductos, setMostrarSelectorProductos] = useState(true)

  // Estado para el modal de recargos
  const [recargoModal, setRecargoModal] = useState({
    isOpen: false,
    productoIndex: null,
    recargoIndex: null
  })

  // Estado para el modal de disponibilidad
  const [showDisponibilidadModal, setShowDisponibilidadModal] = useState(false)

  // ============================================
  // HOOKS
  // ============================================

  const { clientes, isLoading: loadingClientes } = useGetClientesActivos()
  const { productos, isLoading: loadingProductos } = useGetProductosAlquiler()
  const { tarifas, isLoading: loadingTarifas } = useGetTarifasTransporte()
  const { ciudades, isLoading: loadingCiudades } = useGetCiudadesActivas()
  const { ubicaciones, isLoading: loadingUbicaciones } = useGetUbicacionesActivas()
  const { data: configuracion } = useGetConfiguracionCompleta()

  const { mutateAsync: createCotizacion, isLoading: isCreating } = useCreateCotizacion()
  const { mutateAsync: updateCotizacion, isLoading: isUpdating } = useUpdateCotizacion()

  // Cargar cotización completa con productos cuando se edita
  const { cotizacion: cotizacionCompleta, isLoading: loadingCotizacion } = useGetCotizacionCompleta(
    mode === 'editar' && cotizacion?.id && isOpen ? cotizacion.id : null
  )

  // Cargar eventos del cliente seleccionado
  const { eventos: eventosCliente, isLoading: loadingEventos } = useGetEventosPorCliente(
    formData.cliente_id ? parseInt(formData.cliente_id) : null
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
        evento_id: datosACopiar.evento_id || '',
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
        // Mapear productos para el formato del formulario (incluir recargos)
        const productosFormateados = (cotizacionCompleta.productos || []).map(p => ({
          id: p.id || null,
          compuesto_id: p.compuesto_id?.toString() || '',
          cantidad: p.cantidad || 1,
          precio_base: p.precio_base || 0,
          deposito: p.deposito || 0,
          precio_adicionales: p.precio_adicionales || 0,
          configuracion: p.configuracion || null,
          recargos: (p.recargos || []).map(r => ({
            id: r.id,
            tipo: r.tipo,
            dias: r.dias,
            porcentaje: r.porcentaje,
            monto_recargo: r.monto_recargo,
            fecha_original: r.fecha_original,
            fecha_modificada: r.fecha_modificada,
            notas: r.notas
          }))
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
      // Si hay un evento preseleccionado, pre-llenar los campos
      if (eventoPreseleccionado) {
        setFormData({
          cliente_id: eventoPreseleccionado.cliente_id?.toString() || '',
          evento_id: eventoPreseleccionado.id?.toString() || '',
          fecha_montaje: eventoPreseleccionado.fecha_inicio?.split('T')[0] || '',
          fecha_evento: eventoPreseleccionado.fecha_inicio?.split('T')[0] || '',
          fecha_desmontaje: eventoPreseleccionado.fecha_fin?.split('T')[0] || '',
          evento_nombre: eventoPreseleccionado.nombre || '',
          evento_direccion: eventoPreseleccionado.direccion || '',
          evento_ciudad: eventoPreseleccionado.ciudad_nombre || '',
          descuento: 0,
          vigencia_dias: 15,
          notas: ''
        })
      } else {
        setFormData({
          cliente_id: '',
          evento_id: '',
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
      }
      setProductosSeleccionados([])
      setTransporteSeleccionado([])
    }
    setErrors({})
  }, [mode, cotizacion, cotizacionCompleta, isOpen, eventoPreseleccionado])

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
      configuracion: null,
      recargos: []
    }])
  }

  // Handler para agregar producto desde el selector de tarjetas
  const agregarProductoDesdeTarjetas = (producto, cantidad) => {
    setProductosSeleccionados(prev => [...prev, {
      compuesto_id: producto.id.toString(),
      cantidad: cantidad,
      precio_base: producto.precio_base || 0,
      deposito: producto.deposito || 0,
      precio_adicionales: 0,
      configuracion: null,
      recargos: []
    }])
  }

  const actualizarProducto = (index, campo, valor) => {
    setProductosSeleccionados(prev => {
      const nuevos = [...prev]

      // Si cambio el producto, actualizar precios y resetear configuración y recargos
      if (campo === 'compuesto_id' && valor) {
        const producto = productos.find(p => p.id === parseInt(valor))
        if (producto) {
          nuevos[index] = {
            ...nuevos[index],
            [campo]: valor,
            precio_base: producto.precio_base || 0,
            deposito: producto.deposito || 0,
            configuracion: null,
            precio_adicionales: 0,
            recargos: []
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

  // ============================================
  // FUNCIONES DE RECARGOS
  // ============================================

  const abrirModalRecargo = (productoIndex, recargoIndex = null) => {
    setRecargoModal({
      isOpen: true,
      productoIndex,
      recargoIndex
    })
  }

  const cerrarModalRecargo = () => {
    setRecargoModal({
      isOpen: false,
      productoIndex: null,
      recargoIndex: null
    })
  }

  const agregarRecargo = (productoIndex, recargo) => {
    setProductosSeleccionados(prev => {
      const nuevos = [...prev]
      const producto = nuevos[productoIndex]
      const precioBase = parseFloat(producto.precio_base) || 0

      // Calcular monto del recargo
      const montoRecargo = Math.round((precioBase * (recargo.porcentaje / 100) * recargo.dias) * 100) / 100

      const nuevoRecargo = {
        ...recargo,
        monto_recargo: montoRecargo
      }

      nuevos[productoIndex] = {
        ...producto,
        recargos: [...(producto.recargos || []), nuevoRecargo]
      }
      return nuevos
    })
    cerrarModalRecargo()
  }

  const actualizarRecargo = (productoIndex, recargoIndex, recargo) => {
    setProductosSeleccionados(prev => {
      const nuevos = [...prev]
      const producto = nuevos[productoIndex]
      const precioBase = parseFloat(producto.precio_base) || 0

      // Calcular monto del recargo
      const montoRecargo = Math.round((precioBase * (recargo.porcentaje / 100) * recargo.dias) * 100) / 100

      const recargosActualizados = [...(producto.recargos || [])]
      recargosActualizados[recargoIndex] = {
        ...recargo,
        monto_recargo: montoRecargo
      }

      nuevos[productoIndex] = {
        ...producto,
        recargos: recargosActualizados
      }
      return nuevos
    })
    cerrarModalRecargo()
  }

  const eliminarRecargo = (productoIndex, recargoIndex) => {
    setProductosSeleccionados(prev => {
      const nuevos = [...prev]
      const producto = nuevos[productoIndex]
      const recargosActualizados = (producto.recargos || []).filter((_, i) => i !== recargoIndex)
      nuevos[productoIndex] = {
        ...producto,
        recargos: recargosActualizados
      }
      return nuevos
    })
  }

  // Calcular total de recargos de un producto
  const calcularTotalRecargosProducto = (producto) => {
    if (!producto.recargos || producto.recargos.length === 0) return 0
    return producto.recargos.reduce((total, r) => total + (parseFloat(r.monto_recargo) || 0), 0)
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
      const recargos = calcularTotalRecargosProducto(p)
      return total + subtotal + recargos
    }, 0)
  }

  // Calcular subtotal de productos sin recargos (para mostrar)
  const calcularSubtotalProductosSinRecargos = () => {
    return productosSeleccionados.reduce((total, p) => {
      const subtotal = (parseFloat(p.precio_base) + parseFloat(p.precio_adicionales || 0)) * parseInt(p.cantidad || 1)
      return total + subtotal
    }, 0)
  }

  // Calcular total de todos los recargos
  const calcularTotalRecargos = () => {
    return productosSeleccionados.reduce((total, p) => {
      return total + calcularTotalRecargosProducto(p)
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

  // ============================================
  // CÁLCULO DE DÍAS ADICIONALES
  // Valores desde configuración del sistema
  // ============================================
  const DIAS_GRATIS_MONTAJE = configuracion?.dias_gratis_montaje ?? 2
  const DIAS_GRATIS_DESMONTAJE = configuracion?.dias_gratis_desmontaje ?? 1
  const PORCENTAJE_DIA_EXTRA = configuracion?.porcentaje_dias_extra ?? 15
  const PORCENTAJE_IVA = configuracion?.porcentaje_iva ?? 19

  const calcularDiasAdicionales = () => {
    if (!formData.fecha_evento) {
      return { diasMontajeExtra: 0, diasDesmontrajeExtra: 0, totalDiasExtra: 0, cobroDiasExtra: 0 }
    }

    const fechaEvento = new Date(formData.fecha_evento + 'T12:00:00')
    const fechaMontaje = formData.fecha_montaje ? new Date(formData.fecha_montaje + 'T12:00:00') : fechaEvento
    const fechaDesmontaje = formData.fecha_desmontaje ? new Date(formData.fecha_desmontaje + 'T12:00:00') : fechaEvento

    // Calcular días de diferencia
    const diasMontaje = Math.max(0, Math.floor((fechaEvento - fechaMontaje) / (1000 * 60 * 60 * 24)))
    const diasDesmontaje = Math.max(0, Math.floor((fechaDesmontaje - fechaEvento) / (1000 * 60 * 60 * 24)))

    // Días adicionales (descontando los gratis)
    const diasMontajeExtra = Math.max(0, diasMontaje - DIAS_GRATIS_MONTAJE)
    const diasDesmontrajeExtra = Math.max(0, diasDesmontaje - DIAS_GRATIS_DESMONTAJE)
    const totalDiasExtra = diasMontajeExtra + diasDesmontrajeExtra

    // Cobro por días adicionales (% sobre subtotal de productos)
    const subtotalProductos = calcularSubtotalProductos()
    const cobroDiasExtra = totalDiasExtra > 0
      ? (subtotalProductos * (PORCENTAJE_DIA_EXTRA / 100) * totalDiasExtra)
      : 0

    return {
      diasMontaje,
      diasDesmontaje,
      diasMontajeExtra,
      diasDesmontrajeExtra,
      totalDiasExtra,
      cobroDiasExtra,
      porcentaje: PORCENTAJE_DIA_EXTRA
    }
  }

  // ============================================
  // CÁLCULO DE TOTALES CON IVA
  // ============================================
  const calcularTotalesConIVA = () => {
    const subtotalProductos = calcularSubtotalProductos()
    const subtotalTransporte = calcularSubtotalTransporte()
    const { cobroDiasExtra, totalDiasExtra } = calcularDiasAdicionales()
    const descuento = parseFloat(formData.descuento || 0)

    const subtotalBruto = subtotalProductos + subtotalTransporte + cobroDiasExtra
    const baseGravable = Math.max(0, subtotalBruto - descuento)
    const valorIVA = baseGravable * (PORCENTAJE_IVA / 100)
    const totalFinal = baseGravable + valorIVA

    return {
      subtotalProductos,
      subtotalTransporte,
      cobroDiasExtra,
      totalDiasExtra,
      subtotalBruto,
      descuento,
      baseGravable,
      porcentajeIVA: PORCENTAJE_IVA,
      valorIVA,
      totalFinal
    }
  }

  const calcularTotal = () => {
    const { totalFinal } = calcularTotalesConIVA()
    return totalFinal
  }

  const validate = () => {
    const newErrors = {}

    // Cliente solo es requerido si no viene de evento preseleccionado
    if (!eventoPreseleccionado && !formData.cliente_id) {
      newErrors.cliente_id = 'Seleccione un cliente'
    }
    if (!formData.fecha_evento) {
      newErrors.fecha_evento = 'La fecha del evento es obligatoria'
    }
    // Ciudad solo es requerida si no viene de evento preseleccionado
    if (!eventoPreseleccionado && !formData.evento_ciudad) {
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
      evento_id: formData.evento_id ? parseInt(formData.evento_id) : null,
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
        configuracion: p.configuracion || null,
        recargos: (p.recargos || []).map(r => ({
          tipo: r.tipo,
          dias: r.dias,
          porcentaje: parseFloat(r.porcentaje),
          fecha_original: r.fecha_original || null,
          fecha_modificada: r.fecha_modificada || null,
          notas: r.notas || null
        }))
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

        {/* RESUMEN DEL EVENTO - Cuando viene de un evento preseleccionado */}
        {eventoPreseleccionado && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-lg">
                  {eventoPreseleccionado.nombre}
                </h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{eventoPreseleccionado.cliente_nombre || 'Cliente'}</span>
                  </div>
                  {eventoPreseleccionado.ciudad_nombre && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{eventoPreseleccionado.ciudad_nombre}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {eventoPreseleccionado.fecha_inicio?.split('T')[0]}
                      {eventoPreseleccionado.fecha_fin !== eventoPreseleccionado.fecha_inicio &&
                        ` → ${eventoPreseleccionado.fecha_fin?.split('T')[0]}`}
                    </span>
                  </div>
                </div>
                {eventoPreseleccionado.direccion && (
                  <p className="mt-2 text-sm text-slate-500 truncate">
                    📍 {eventoPreseleccionado.direccion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CLIENTE Y EVENTO - Solo si NO viene de un evento preseleccionado */}
        {!eventoPreseleccionado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CLIENTE */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cliente *
              </label>
              <select
                name="cliente_id"
                value={formData.cliente_id}
                onChange={(e) => {
                  handleChange(e)
                  // Limpiar evento si cambia el cliente
                  setFormData(prev => ({ ...prev, cliente_id: e.target.value, evento_id: '' }))
                }}
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

            {/* EVENTO (opcional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <CalendarDays className="w-4 h-4 inline mr-1" />
                Evento (opcional)
              </label>
              <select
                name="evento_id"
                value={formData.evento_id}
                onChange={handleChange}
                disabled={isLoading || loadingEventos || !formData.cliente_id}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                <option value="">Sin evento asociado</option>
                {(eventosCliente || []).filter(e => e.estado === 'activo').map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              {!formData.cliente_id && (
                <p className="mt-1 text-xs text-slate-500">Seleccione un cliente primero</p>
              )}
              {formData.cliente_id && (eventosCliente || []).length === 0 && !loadingEventos && (
                <p className="mt-1 text-xs text-slate-500">Este cliente no tiene eventos activos</p>
              )}
            </div>
          </div>
        )}

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

        {/* INDICADOR DE DÍAS ADICIONALES */}
        {formData.fecha_evento && (formData.fecha_montaje || formData.fecha_desmontaje) && (() => {
          const { diasMontajeExtra, diasDesmontrajeExtra, totalDiasExtra, cobroDiasExtra, porcentaje } = calcularDiasAdicionales()
          if (totalDiasExtra > 0) {
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-800">Días adicionales detectados</h4>
                    <div className="mt-2 text-sm text-amber-700 space-y-1">
                      {diasMontajeExtra > 0 && (
                        <p>• Montaje: {diasMontajeExtra} día{diasMontajeExtra > 1 ? 's' : ''} extra (gratis: {DIAS_GRATIS_MONTAJE} días antes)</p>
                      )}
                      {diasDesmontrajeExtra > 0 && (
                        <p>• Desmontaje: {diasDesmontrajeExtra} día{diasDesmontrajeExtra > 1 ? 's' : ''} extra (gratis: {DIAS_GRATIS_DESMONTAJE} día después)</p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-200 flex justify-between items-center">
                      <span className="text-sm text-amber-800">
                        Recargo: {totalDiasExtra} día{totalDiasExtra > 1 ? 's' : ''} × {porcentaje}%
                      </span>
                      <span className="font-semibold text-amber-900">
                        +{formatearMoneda(cobroDiasExtra)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}

        {/* INFORMACION DEL EVENTO - Solo si NO viene de un evento preseleccionado */}
        {!eventoPreseleccionado && (
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
        )}

        {/* PRODUCTOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos *
              {productosSeleccionados.length > 0 && (
                <span className="text-sm font-normal text-slate-500">
                  ({productosSeleccionados.length} agregado{productosSeleccionados.length !== 1 ? 's' : ''})
                </span>
              )}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={mostrarSelectorProductos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              onClick={() => setMostrarSelectorProductos(!mostrarSelectorProductos)}
            >
              {mostrarSelectorProductos ? 'Ocultar selector' : 'Mostrar selector'}
            </Button>
          </div>

          {errors.productos && (
            <p className="text-sm text-red-600">{errors.productos}</p>
          )}

          {/* SELECTOR DE PRODUCTOS CON TARJETAS */}
          {mostrarSelectorProductos && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <ProductoSelectorTarjetas
                onProductoAgregado={agregarProductoDesdeTarjetas}
                disabled={isLoading}
                fechaMontaje={formData.fecha_montaje || formData.fecha_evento}
                fechaDesmontaje={formData.fecha_desmontaje || formData.fecha_evento}
              />
            </div>
          )}

          {/* LISTA DE PRODUCTOS SELECCIONADOS */}
          {productosSeleccionados.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center border border-dashed rounded-lg">
              No hay productos agregados. Seleccione productos arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {productosSeleccionados.map((prod, index) => {
                const productoInfo = productos.find(p => p.id === parseInt(prod.compuesto_id))
                return (
                <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex gap-3 items-start">
                    {/* Nombre del producto */}
                    <div className="flex-1">
                      {productoInfo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{productoInfo.categoria_emoji || '📦'}</span>
                          <div>
                            <p className="font-medium text-slate-800">{productoInfo.nombre}</p>
                            <p className="text-xs text-slate-500">{productoInfo.categoria_nombre}</p>
                          </div>
                        </div>
                      ) : (
                        <ProductoSelector
                          value={prod.compuesto_id}
                          onChange={(producto) => {
                            if (producto) {
                              actualizarProducto(index, 'compuesto_id', producto.id.toString())
                            } else {
                              actualizarProducto(index, 'compuesto_id', '')
                            }
                          }}
                          disabled={isLoading}
                          placeholder="Buscar producto..."
                        />
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="w-20">
                      <label className="block text-xs text-slate-500 mb-1">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        value={prod.cantidad}
                        onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center"
                      />
                    </div>

                    {/* Precio */}
                    <div className="w-28">
                      <label className="block text-xs text-slate-500 mb-1">Precio</label>
                      <input
                        type="number"
                        min="0"
                        value={prod.precio_base}
                        onChange={(e) => actualizarProducto(index, 'precio_base', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-right"
                      />
                    </div>

                    {/* Boton eliminar */}
                    <button
                      type="button"
                      onClick={() => eliminarProducto(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-5"
                      disabled={isLoading}
                      title="Eliminar producto"
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

                  {/* SECCIÓN DE RECARGOS */}
                  {prod.compuesto_id && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Recargos (adelanto/extensión)
                        </span>
                        <button
                          type="button"
                          onClick={() => abrirModalRecargo(index)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          disabled={isLoading}
                        >
                          <Plus className="w-3 h-3" />
                          Agregar recargo
                        </button>
                      </div>

                      {/* Lista de recargos del producto */}
                      {(prod.recargos || []).length > 0 ? (
                        <div className="space-y-1">
                          {prod.recargos.map((recargo, recargoIndex) => (
                            <div
                              key={recargoIndex}
                              className={`flex items-center justify-between p-2 rounded text-xs ${
                                recargo.tipo === 'adelanto'
                                  ? 'bg-blue-50 border border-blue-100'
                                  : 'bg-orange-50 border border-orange-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  recargo.tipo === 'adelanto'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {recargo.tipo === 'adelanto' ? 'Adelanto' : 'Extensión'}
                                </span>
                                <span className="text-slate-600">
                                  {recargo.dias} día{recargo.dias > 1 ? 's' : ''} @ {recargo.porcentaje}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${
                                  recargo.tipo === 'adelanto' ? 'text-blue-700' : 'text-orange-700'
                                }`}>
                                  +{formatearMoneda(recargo.monto_recargo)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => abrirModalRecargo(index, recargoIndex)}
                                  className="p-1 hover:bg-white rounded"
                                  title="Editar recargo"
                                >
                                  <Percent className="w-3 h-3 text-slate-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => eliminarRecargo(index, recargoIndex)}
                                  className="p-1 hover:bg-white rounded text-red-400 hover:text-red-600"
                                  title="Eliminar recargo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {/* Total recargos del producto */}
                          <div className="text-right text-xs pt-1">
                            <span className="text-slate-500">Total recargos: </span>
                            <span className="font-medium text-slate-700">
                              +{formatearMoneda(calcularTotalRecargosProducto(prod))}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin recargos</p>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}

          <div className="text-right text-sm space-y-1">
            <div>
              <span className="text-slate-600">Subtotal productos: </span>
              <span className="font-medium">{formatearMoneda(calcularSubtotalProductosSinRecargos())}</span>
            </div>
            {calcularTotalRecargos() > 0 && (
              <div>
                <span className="text-slate-600">Total recargos: </span>
                <span className="font-medium text-orange-600">+{formatearMoneda(calcularTotalRecargos())}</span>
              </div>
            )}
            <div className="pt-1 border-t border-slate-200">
              <span className="text-slate-700 font-medium">Total productos: </span>
              <span className="font-semibold">{formatearMoneda(calcularSubtotalProductos())}</span>
            </div>
          </div>

          {/* BOTÓN VERIFICAR DISPONIBILIDAD */}
          {productosSeleccionados.some(p => p.compuesto_id) && (formData.fecha_montaje || formData.fecha_evento) && (
            <div className="pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowDisponibilidadModal(true)}
                icon={<CheckCircle className="w-4 h-4" />}
                className="w-full"
              >
                Verificar Disponibilidad
              </Button>
            </div>
          )}
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

        {/* TOTALES CON DESGLOSE IVA */}
        {(() => {
          const totales = calcularTotalesConIVA()
          return (
            <div className="bg-slate-100 rounded-lg p-4 space-y-2">
              {/* Subtotal Productos */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Subtotal productos:</span>
                <span className="font-medium">{formatearMoneda(totales.subtotalProductos)}</span>
              </div>

              {/* Subtotal Transporte */}
              {totales.subtotalTransporte > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Subtotal transporte:</span>
                  <span className="font-medium">{formatearMoneda(totales.subtotalTransporte)}</span>
                </div>
              )}

              {/* Días Adicionales */}
              {totales.cobroDiasExtra > 0 && (
                <div className="flex justify-between items-center text-sm text-amber-700">
                  <span>Días adicionales ({totales.totalDiasExtra} días):</span>
                  <span className="font-medium">+{formatearMoneda(totales.cobroDiasExtra)}</span>
                </div>
              )}

              {/* Línea separadora */}
              <div className="border-t border-slate-300 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">{formatearMoneda(totales.subtotalBruto)}</span>
                </div>
              </div>

              {/* Descuento */}
              <div className="flex justify-between items-center">
                <label className="text-slate-600 text-sm">Descuento:</label>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-sm">-</span>
                  <input
                    type="number"
                    name="descuento"
                    min="0"
                    value={formData.descuento}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-28 px-3 py-1 border border-slate-300 rounded-lg text-sm text-right"
                  />
                </div>
              </div>

              {/* Base Gravable */}
              <div className="flex justify-between items-center text-sm border-t border-slate-300 pt-2">
                <span className="text-slate-700 font-medium">Base gravable:</span>
                <span className="font-medium">{formatearMoneda(totales.baseGravable)}</span>
              </div>

              {/* IVA */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">IVA ({totales.porcentajeIVA}%):</span>
                <span className="font-medium">+{formatearMoneda(totales.valorIVA)}</span>
              </div>

              {/* TOTAL FINAL */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-400">
                <span className="text-lg font-bold text-slate-900">TOTAL:</span>
                <span className="text-lg font-bold text-blue-600">{formatearMoneda(totales.totalFinal)}</span>
              </div>
            </div>
          )
        })()}

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

      {/* MODAL DE RECARGOS */}
      {recargoModal.isOpen && recargoModal.productoIndex !== null && (
        <RecargoModal
          isOpen={recargoModal.isOpen}
          onClose={cerrarModalRecargo}
          onSave={(recargo) => {
            if (recargoModal.recargoIndex !== null) {
              actualizarRecargo(recargoModal.productoIndex, recargoModal.recargoIndex, recargo)
            } else {
              agregarRecargo(recargoModal.productoIndex, recargo)
            }
          }}
          producto={(() => {
            const prod = productosSeleccionados[recargoModal.productoIndex]
            const productoInfo = productos.find(p => p.id === parseInt(prod?.compuesto_id))
            return {
              ...prod,
              producto_nombre: productoInfo?.nombre || 'Producto'
            }
          })()}
          fechasCotizacion={{
            fecha_montaje: formData.fecha_montaje || formData.fecha_evento,
            fecha_desmontaje: formData.fecha_desmontaje || formData.fecha_evento
          }}
          recargoEditar={
            recargoModal.recargoIndex !== null
              ? productosSeleccionados[recargoModal.productoIndex]?.recargos?.[recargoModal.recargoIndex]
              : null
          }
        />
      )}

      {/* MODAL DE DISPONIBILIDAD */}
      <DisponibilidadModal
        isOpen={showDisponibilidadModal}
        onClose={() => setShowDisponibilidadModal(false)}
        productos={productosSeleccionados.map(p => ({
          compuesto_id: parseInt(p.compuesto_id) || null,
          cantidad: parseInt(p.cantidad) || 1,
          configuracion: p.configuracion || null
        })).filter(p => p.compuesto_id)}
        fechaMontaje={formData.fecha_montaje || formData.fecha_evento}
        fechaDesmontaje={formData.fecha_desmontaje || formData.fecha_evento}
        productosInfo={productos}
      />
    </Modal>
  )
}

export default CotizacionFormModal
