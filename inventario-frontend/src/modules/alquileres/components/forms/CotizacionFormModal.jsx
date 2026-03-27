// ============================================
// COMPONENTE: CotizacionFormModal
// Modal para crear/editar cotizaciones
// ============================================

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Package, Truck, MapPin, CalendarDays, Calendar, Clock, Percent, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle, User, AlertCircle, FileEdit, ClipboardList, Save, X } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import ProductoSelector from '@shared/components/ProductoSelector'
import ProductoConfiguracion from '@productos/components/forms/ProductoConfiguracion'
import DisponibilidadModal from '../disponibilidad/DisponibilidadModal'
import RecargoModal from '../modals/RecargoModal'
import { ProductoSelectorTarjetas, DescuentosSelectorLocal } from '../cotizaciones'
import { useCreateCotizacion, useUpdateCotizacion, useGetCotizacionCompleta, useGetUbicacionesCliente } from '../../hooks/cotizaciones'
import { useGetClientesActivos } from '@clientes/hooks/useClientes'
import { useGetProductosAlquiler } from '@productos/hooks/useProductosAlquiler'
import { useGetTarifasTransporte } from '../../hooks/useTarifasTransporte'
import { useGetCiudadesActivas } from '@clientes/hooks/useCiudades'
import { useGetUbicacionesPorCiudad, useCreateUbicacion } from '@inventario/hooks/useUbicaciones'
import { useGetEventosPorCliente } from '../../hooks/useEventos'
import { useGetConfiguracionCompleta } from '@configuracion/hooks/useConfiguracion'

/**
 * CotizacionFormModal
 */
const CotizacionFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  cotizacion = null,
  eventoPreseleccionado = null,
  fechasPorConfirmarInicial = false
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
    ubicacion_id: '',
    evento_ciudad: '',
    evento_ciudad_id: '',
    descuento: 0,
    vigencia_dias: 15,
    notas: ''
  })

  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [transporteSeleccionado, setTransporteSeleccionado] = useState([])
  const [descuentosAplicados, setDescuentosAplicados] = useState([])
  const [errors, setErrors] = useState({})
  const [mostrarSelectorProductos, setMostrarSelectorProductos] = useState(true)
  const [fechasPorConfirmar, setFechasPorConfirmar] = useState(fechasPorConfirmarInicial)

  // Estado para el modal de recargos
  const [recargoModal, setRecargoModal] = useState({
    isOpen: false,
    productoIndex: null,
    recargoIndex: null
  })

  // Estado para el modal de disponibilidad
  const [showDisponibilidadModal, setShowDisponibilidadModal] = useState(false)

  // Estado para sugerir guardar dirección nueva como ubicación
  const [guardarUbicacion, setGuardarUbicacion] = useState({
    mostrar: false,
    nombre: '',
    tipo: 'evento',
    direccion: '',
    ciudad_id: null
  })

  // Estado del wizard
  const [pasoActual, setPasoActual] = useState(1)
  const [direccionAnimacion, setDireccionAnimacion] = useState('right')

  const PASOS = [
    { numero: 1, titulo: 'Evento', icono: Calendar },
    { numero: 2, titulo: 'Productos', icono: Package },
    { numero: 3, titulo: 'Transporte', icono: Truck },
    { numero: 4, titulo: 'Resumen', icono: ClipboardList }
  ]

  // ============================================
  // HOOKS
  // ============================================

  const { clientes, isLoading: loadingClientes } = useGetClientesActivos()
  const { productos, isLoading: loadingProductos } = useGetProductosAlquiler()
  const { tarifas, isLoading: loadingTarifas } = useGetTarifasTransporte()
  const { ciudades, isLoading: loadingCiudades } = useGetCiudadesActivas()
  const { ubicaciones: ubicacionesCiudad, isLoading: loadingUbicaciones } = useGetUbicacionesPorCiudad(
    formData.evento_ciudad_id ? parseInt(formData.evento_ciudad_id) : null
  )
  const { ubicacionesCliente } = useGetUbicacionesCliente(formData.cliente_id || null)
  const { data: configuracion } = useGetConfiguracionCompleta()

  const { mutateAsync: createCotizacion, isLoading: isCreating } = useCreateCotizacion()
  const { mutateAsync: updateCotizacion, isLoading: isUpdating } = useUpdateCotizacion()
  const { mutateAsync: crearUbicacion, isLoading: isCreatingUbicacion } = useCreateUbicacion()

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
      const esBorrador = datosACopiar.estado === 'borrador' || datosACopiar.fechas_confirmadas === 0
      setFechasPorConfirmar(esBorrador)
      // Resolver ciudad_id a partir del nombre de ciudad
      const ciudadMatch = ciudades.find(c => c.nombre === datosACopiar.evento_ciudad)
      setFormData({
        cliente_id: datosACopiar.cliente_id || '',
        evento_id: datosACopiar.evento_id || '',
        fecha_montaje: datosACopiar.fecha_montaje?.split('T')[0] || '',
        fecha_evento: datosACopiar.fecha_evento?.split('T')[0] || '',
        fecha_desmontaje: datosACopiar.fecha_desmontaje?.split('T')[0] || '',
        evento_nombre: datosACopiar.evento_nombre || '',
        evento_direccion: datosACopiar.evento_direccion || '',
        ubicacion_id: datosACopiar.ubicacion_id || '',
        evento_ciudad: datosACopiar.evento_ciudad || '',
        evento_ciudad_id: ciudadMatch?.id?.toString() || '',
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
          descuento_porcentaje: p.descuento_porcentaje || 0,
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

        // Mapear descuentos para el formato del formulario
        const descuentosFormateados = (cotizacionCompleta.descuentos_aplicados || []).map(d => ({
          id: d.id,
          descuento_id: d.descuento_id || null,
          nombre: d.descuento_nombre || d.descripcion || 'Descuento',
          tipo: d.tipo,
          valor: parseFloat(d.valor),
          descripcion: d.descripcion
        }))
        setDescuentosAplicados(descuentosFormateados)
      }
    } else if (mode === 'crear') {
      // Si hay un evento preseleccionado, pre-llenar los campos
      if (eventoPreseleccionado) {
        const ciudadMatch = ciudades.find(c => c.nombre === eventoPreseleccionado.ciudad_nombre)
        setFormData({
          cliente_id: eventoPreseleccionado.cliente_id?.toString() || '',
          evento_id: eventoPreseleccionado.id?.toString() || '',
          fecha_montaje: eventoPreseleccionado.fecha_inicio?.split('T')[0] || '',
          fecha_evento: eventoPreseleccionado.fecha_inicio?.split('T')[0] || '',
          fecha_desmontaje: eventoPreseleccionado.fecha_fin?.split('T')[0] || '',
          evento_nombre: eventoPreseleccionado.nombre || '',
          evento_direccion: eventoPreseleccionado.direccion || '',
          ubicacion_id: '',
          evento_ciudad: eventoPreseleccionado.ciudad_nombre || '',
          evento_ciudad_id: ciudadMatch?.id?.toString() || '',
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
          ubicacion_id: '',
          evento_ciudad_id: '',
          evento_ciudad: '',
          descuento: 0,
          vigencia_dias: 15,
          notas: ''
        })
      }
      setProductosSeleccionados([])
      setTransporteSeleccionado([])
      setDescuentosAplicados([])
      setFechasPorConfirmar(false)
    }
    setErrors({})
  }, [mode, cotizacion, cotizacionCompleta, isOpen, eventoPreseleccionado, ciudades])

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Si escribe manualmente la dirección, limpiar ubicacion_id vinculada
      ...(name === 'evento_direccion' ? { ubicacion_id: '' } : {})
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    // Si cambia la ciudad, limpiar transporte seleccionado y direccion
    if (name === 'evento_ciudad_id') {
      const ciudadSeleccionada = ciudades.find(c => c.id === parseInt(value))
      setTransporteSeleccionado([])
      setFormData(prev => ({
        ...prev,
        evento_ciudad_id: value,
        evento_ciudad: ciudadSeleccionada?.nombre || '',
        evento_direccion: '',
        ubicacion_id: ''
      }))
      return
    }
  }

  const agregarProducto = () => {
    setProductosSeleccionados(prev => [...prev, {
      compuesto_id: '',
      cantidad: 1,
      precio_base: 0,
      deposito: 0,
      precio_adicionales: 0,
      descuento_porcentaje: 0,
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
      descuento_porcentaje: 0,
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

  // Calcular descuento de un producto individual
  const calcularDescuentoProducto = (p) => {
    const bruto = (parseFloat(p.precio_base) + parseFloat(p.precio_adicionales || 0)) * parseInt(p.cantidad || 1)
    const descPct = parseFloat(p.descuento_porcentaje) || 0
    return descPct > 0 ? bruto * (descPct / 100) : 0
  }

  const calcularSubtotalProductos = () => {
    return productosSeleccionados.reduce((total, p) => {
      const bruto = (parseFloat(p.precio_base) + parseFloat(p.precio_adicionales || 0)) * parseInt(p.cantidad || 1)
      const descuento = calcularDescuentoProducto(p)
      const recargos = calcularTotalRecargosProducto(p)
      return total + bruto - descuento + recargos
    }, 0)
  }

  // Calcular subtotal de productos sin recargos ni descuentos (para mostrar)
  const calcularSubtotalProductosSinRecargos = () => {
    return productosSeleccionados.reduce((total, p) => {
      const bruto = (parseFloat(p.precio_base) + parseFloat(p.precio_adicionales || 0)) * parseInt(p.cantidad || 1)
      return total + bruto
    }, 0)
  }

  // Calcular total de descuentos de productos
  const calcularTotalDescuentosProductos = () => {
    return productosSeleccionados.reduce((total, p) => {
      return total + calcularDescuentoProducto(p)
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

  // Calcular total de descuentos aplicados
  const calcularTotalDescuentos = (baseCalculo = 0) => {
    return descuentosAplicados.reduce((total, d) => {
      if (d.tipo === 'porcentaje') {
        return total + (baseCalculo * (parseFloat(d.valor) / 100))
      }
      return total + parseFloat(d.valor)
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

    const subtotalBruto = subtotalProductos + subtotalTransporte + cobroDiasExtra
    // Calcular descuentos sobre el subtotal bruto
    const descuento = calcularTotalDescuentos(subtotalBruto)
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
      descuentosDetalle: descuentosAplicados,
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
    // Fecha solo obligatoria si NO es borrador
    if (!fechasPorConfirmar && !formData.fecha_evento) {
      newErrors.fecha_evento = 'La fecha del evento es obligatoria (o marque "Fechas por confirmar")'
    }
    // Ciudad solo es requerida si no viene de evento preseleccionado
    if (!eventoPreseleccionado && !formData.evento_ciudad_id) {
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

    // Calcular el total de descuento para el campo legacy
    const subtotalBruto = calcularSubtotalProductos() + calcularSubtotalTransporte() + calcularDiasAdicionales().cobroDiasExtra
    const totalDescuentoCalculado = calcularTotalDescuentos(subtotalBruto)

    const dataToSend = {
      cliente_id: parseInt(formData.cliente_id),
      evento_id: formData.evento_id ? parseInt(formData.evento_id) : null,
      fecha_montaje: formData.fecha_montaje || formData.fecha_evento || null,
      fecha_evento: formData.fecha_evento || null,
      fecha_desmontaje: formData.fecha_desmontaje || formData.fecha_evento || null,
      fechas_confirmadas: !fechasPorConfirmar,
      evento_nombre: formData.evento_nombre.trim() || null,
      evento_direccion: formData.evento_direccion.trim() || null,
      ubicacion_id: formData.ubicacion_id ? parseInt(formData.ubicacion_id) : null,
      evento_ciudad: formData.evento_ciudad.trim() || null,
      descuento: totalDescuentoCalculado,
      vigencia_dias: parseInt(formData.vigencia_dias) || 15,
      notas: formData.notas.trim() || null,
      descuentos: descuentosAplicados.map(d => ({
        descuento_id: d.descuento_id || null,
        tipo: d.tipo,
        valor: parseFloat(d.valor),
        descripcion: d.descripcion || d.nombre || null
      })),
      productos: productosSeleccionados.map(p => ({
        compuesto_id: parseInt(p.compuesto_id),
        cantidad: parseInt(p.cantidad) || 1,
        precio_base: parseFloat(p.precio_base) || 0,
        deposito: parseFloat(p.deposito) || 0,
        precio_adicionales: parseFloat(p.precio_adicionales) || 0,
        descuento_porcentaje: parseFloat(p.descuento_porcentaje) || 0,
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
      let cotizacionId = cotizacion?.id
      if (mode === 'crear') {
        const result = await createCotizacion(dataToSend)
        cotizacionId = result?.data?.id
      } else {
        await updateCotizacion({ id: cotizacion.id, data: dataToSend })
      }

      // Si escribió una dirección manual (sin chip), preguntar si quiere guardarla
      const direccion = formData.evento_direccion.trim()
      if (direccion && !formData.ubicacion_id && formData.evento_ciudad_id) {
        setGuardarUbicacion({
          mostrar: true,
          nombre: '',
          tipo: 'evento',
          direccion,
          ciudad_id: parseInt(formData.evento_ciudad_id),
          cotizacion_id: cotizacionId
        })
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error al guardar cotizacion:', error)
      const mensajeError = error.response?.data?.message || 'Error al guardar la cotizacion'
      setErrors({ submit: mensajeError })
    }
  }

  const handleGuardarUbicacion = async () => {
    if (!guardarUbicacion.nombre.trim()) return
    try {
      const resultado = await crearUbicacion({
        nombre: guardarUbicacion.nombre.trim(),
        tipo: guardarUbicacion.tipo,
        direccion: guardarUbicacion.direccion,
        ciudad_id: guardarUbicacion.ciudad_id,
        activo: true,
        es_principal: false
      })

      // Vincular la ubicación recién creada a la cotización
      const ubicacionId = resultado?.data?.id
      if (ubicacionId && guardarUbicacion.cotizacion_id) {
        await updateCotizacion({
          id: guardarUbicacion.cotizacion_id,
          data: { ubicacion_id: ubicacionId }
        })
      }

      setGuardarUbicacion(prev => ({ ...prev, mostrar: false }))
      onClose()
    } catch (error) {
      console.error('Error al guardar ubicación:', error)
    }
  }

  const handleSkipGuardarUbicacion = () => {
    setGuardarUbicacion(prev => ({ ...prev, mostrar: false }))
    onClose()
  }

  const handleClose = () => {
    if (!isLoading) onClose()
  }

  // ============================================
  // WIZARD: Validación y navegación por pasos
  // ============================================

  const validarPaso = (paso) => {
    const newErrors = {}
    if (paso === 1) {
      if (!eventoPreseleccionado && !formData.cliente_id) {
        newErrors.cliente_id = 'Seleccione un cliente'
      }
      if (!fechasPorConfirmar && !formData.fecha_evento) {
        newErrors.fecha_evento = 'La fecha del evento es obligatoria'
      }
    } else if (paso === 2) {
      if (productosSeleccionados.length === 0) {
        newErrors.productos = 'Debe agregar al menos un producto'
      }
      if (productosSeleccionados.some(p => !p.compuesto_id)) {
        newErrors.productos = 'Seleccione un producto para cada linea'
      }
    } else if (paso === 3) {
      if (!eventoPreseleccionado && !formData.evento_ciudad_id) {
        newErrors.evento_ciudad = 'Seleccione una ciudad'
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      return false
    }
    return true
  }

  const irAPaso = (paso) => {
    if (paso === pasoActual) return
    // En modo editar, permitir navegación libre
    if (mode === 'editar') {
      setDireccionAnimacion(paso > pasoActual ? 'right' : 'left')
      setPasoActual(paso)
      return
    }
    // Ir hacia atrás siempre permitido
    if (paso < pasoActual) {
      setDireccionAnimacion('left')
      setPasoActual(paso)
      return
    }
    // Ir hacia adelante: validar todos los pasos intermedios
    for (let i = pasoActual; i < paso; i++) {
      if (!validarPaso(i)) return
    }
    setDireccionAnimacion('right')
    setPasoActual(paso)
  }

  const siguiente = () => {
    if (validarPaso(pasoActual)) {
      setDireccionAnimacion('right')
      setPasoActual(prev => Math.min(prev + 1, 4))
    }
  }

  const anterior = () => {
    setDireccionAnimacion('left')
    setPasoActual(prev => Math.max(prev - 1, 1))
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // Ubicaciones de la ciudad seleccionada (ya vienen filtradas del backend)
  const ubicacionesFiltradas = ubicacionesCiudad

  // Filtrar tarifas por ciudad seleccionada (usando ciudad_id)
  const tarifasFiltradas = formData.evento_ciudad_id
    ? tarifas.filter(t => t.ciudad_id === parseInt(formData.evento_ciudad_id))
    : tarifas

  // Agrupar ciudades por departamento para el selector
  const ciudadesPorDepartamento = useMemo(() => {
    const grupos = {}
    ciudades.forEach(ciudad => {
      const depto = ciudad.departamento || 'Sin departamento'
      if (!grupos[depto]) grupos[depto] = []
      grupos[depto].push(ciudad)
    })
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b))
  }, [ciudades])

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'crear' ? 'Nueva Cotizacion' : 'Editar Cotizacion'}
      size={pasoActual === 2 ? 'full' : 'xl'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">

        {/* STEPPER */}
        <div className="flex items-center justify-between px-2 pb-4 mb-4 border-b border-slate-200">
          {PASOS.map((paso, idx) => {
            const Icono = paso.icono
            const esActivo = paso.numero === pasoActual
            const esCompletado = paso.numero < pasoActual
            const esPendiente = paso.numero > pasoActual
            return (
              <div key={paso.numero} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => irAPaso(paso.numero)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium
                    ${esActivo ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
                    ${esCompletado ? 'text-blue-600 hover:bg-blue-50' : ''}
                    ${esPendiente ? 'text-slate-400' : ''}
                    ${!esPendiente ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <Icono className={`w-4 h-4 ${esActivo ? 'text-blue-600' : esCompletado ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="hidden sm:inline">{paso.titulo}</span>
                </button>
                {idx < PASOS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${esCompletado ? 'bg-blue-300' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* ERROR GENERAL */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-medium">{errors.submit}</p>
          </div>
        )}

        {/* CONTENIDO ANIMADO POR PASO */}
        <div key={pasoActual} className={`space-y-6 flex-1 ${direccionAnimacion === 'right' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>

        {/* ============================================
            PASO 1: DATOS DEL EVENTO
            ============================================ */}
        {pasoActual === 1 && (<>

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

        {/* BANNER: Borrador sin fechas */}
        {fechasPorConfirmar && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileEdit className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800">Cotizacion en borrador</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Se guardara como borrador con precio estimado (sin dias extra).
                  Cuando el cliente confirme las fechas, podra completar la cotizacion.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FECHAS: Montaje, Evento, Desmontaje */}
        {!fechasPorConfirmar && (
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
        )}

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

          </div>
        )}

        </>)}

        {/* ============================================
            PASO 2: PRODUCTOS
            ============================================ */}
        {pasoActual === 2 && (<>

        {/* PRODUCTOS - Layout dos paneles */}
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
            {/* Toggle solo visible en mobile */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              icon={mostrarSelectorProductos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              onClick={() => setMostrarSelectorProductos(!mostrarSelectorProductos)}
            >
              {mostrarSelectorProductos ? 'Ocultar selector' : 'Mostrar selector'}
            </Button>
          </div>

          {errors.productos && (
            <p className="text-sm text-red-600">{errors.productos}</p>
          )}

          {/* LAYOUT DOS PANELES (desktop) / APILADO (mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* PANEL IZQUIERDO: Selector de productos */}
            <div className={`border border-slate-200 rounded-lg p-4 bg-slate-50 lg:max-h-[60vh] lg:overflow-y-auto custom-scrollbar ${!mostrarSelectorProductos ? 'hidden lg:block' : ''}`}>
              <ProductoSelectorTarjetas
                onProductoAgregado={agregarProductoDesdeTarjetas}
                disabled={isLoading}
                fechaMontaje={formData.fecha_montaje || formData.fecha_evento}
                fechaDesmontaje={formData.fecha_desmontaje || formData.fecha_evento}
              />
            </div>

            {/* PANEL DERECHO: Productos seleccionados */}
            <div className="lg:max-h-[60vh] lg:overflow-y-auto custom-scrollbar space-y-3">

          {/* LISTA DE PRODUCTOS SELECCIONADOS */}
          {productosSeleccionados.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No hay productos agregados</p>
              <p className="text-xs text-slate-400 mt-1">Seleccione productos de las categorías a la izquierda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header de la lista */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {productosSeleccionados.length} producto{productosSeleccionados.length !== 1 ? 's' : ''} seleccionado{productosSeleccionados.length !== 1 ? 's' : ''}
                </span>
              </div>

              {productosSeleccionados.map((prod, index) => {
                const productoInfo = productos.find(p => p.id === parseInt(prod.compuesto_id))
                const subtotalProducto = (parseFloat(prod.precio_base) || 0) * (parseInt(prod.cantidad) || 1) + (parseFloat(prod.precio_adicionales) || 0)

                return (
                <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                  {/* Header del producto - nombre y eliminar */}
                  <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {productoInfo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl flex-shrink-0">{productoInfo.categoria_emoji || '📦'}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{productoInfo.nombre}</p>
                            <p className="text-xs text-slate-400">{productoInfo.categoria_nombre}</p>
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
                    <button
                      type="button"
                      onClick={() => eliminarProducto(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      disabled={isLoading}
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Inputs con labels - fila separada */}
                  <div className="px-3 pb-3 flex flex-wrap items-end gap-2">
                    {/* Cantidad */}
                    <div className="flex-shrink-0">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Cantidad</label>
                      <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => actualizarProducto(index, 'cantidad', Math.max(1, (parseInt(prod.cantidad) || 1) - 1).toString())}
                          disabled={isLoading || parseInt(prod.cantidad) <= 1}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded disabled:opacity-40"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={prod.cantidad}
                          onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                          disabled={isLoading}
                          className="w-10 text-center text-sm font-medium bg-transparent border-none focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => actualizarProducto(index, 'cantidad', ((parseInt(prod.cantidad) || 1) + 1).toString())}
                          disabled={isLoading}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Precio unitario */}
                    <div className="w-28">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Precio unit.</label>
                      <input
                        type="number"
                        min="0"
                        value={prod.precio_base}
                        onChange={(e) => actualizarProducto(index, 'precio_base', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-right font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    </div>

                    {/* Descuento % */}
                    <div className="w-20">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Desc. %</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={prod.descuento_porcentaje || ''}
                          onChange={(e) => actualizarProducto(index, 'descuento_porcentaje', e.target.value)}
                          disabled={isLoading}
                          placeholder="0"
                          className="w-full px-2 py-1.5 pr-6 border border-slate-200 rounded-lg text-sm text-right font-medium focus:border-green-400 focus:ring-1 focus:ring-green-400"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="flex-1 text-right">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Subtotal</label>
                      <p className="text-sm font-semibold text-slate-800 py-1.5">{formatearMoneda(subtotalProducto - calcularDescuentoProducto(prod))}</p>
                      {calcularDescuentoProducto(prod) > 0 && (
                        <p className="text-[10px] text-green-600 -mt-1">-{formatearMoneda(calcularDescuentoProducto(prod))}</p>
                      )}
                      {prod.precio_adicionales > 0 && (
                        <p className="text-[10px] text-blue-600 -mt-0.5">+{formatearMoneda(prod.precio_adicionales)} config.</p>
                      )}
                    </div>
                  </div>

                  {/* Configuracion de componentes - colapsable */}
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

                  {/* SECCIÓN DE RECARGOS - solo visible si hay recargos o como botón para agregar */}
                  {prod.compuesto_id && (
                    <div className="px-3 pb-2">
                      {(prod.recargos || []).length > 0 ? (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Recargos ({prod.recargos.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => abrirModalRecargo(index)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              disabled={isLoading}
                            >
                              <Plus className="w-3 h-3" />
                              Agregar
                            </button>
                          </div>

                          {/* Lista de recargos del producto */}
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
                      </div>
                      ) : (
                        /* Sin recargos: solo mostrar botón discreto para agregar */
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => abrirModalRecargo(index)}
                            className="text-xs text-slate-400 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
                            disabled={isLoading}
                          >
                            <Plus className="w-3 h-3" />
                            Agregar recargo
                          </button>
                        </div>
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
            {calcularTotalDescuentosProductos() > 0 && (
              <div>
                <span className="text-slate-600">Descuentos productos: </span>
                <span className="font-medium text-green-600">-{formatearMoneda(calcularTotalDescuentosProductos())}</span>
              </div>
            )}
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

            </div>{/* Fin panel derecho */}
          </div>{/* Fin grid dos paneles */}
        </div>

        </>)}

        {/* ============================================
            PASO 3: TRANSPORTE Y EXTRAS
            ============================================ */}
        {pasoActual === 3 && (<>

        {/* DESTINO DEL EVENTO */}
        {!eventoPreseleccionado && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Destino del Evento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ciudad *
                </label>
                <select
                  name="evento_ciudad_id"
                  value={formData.evento_ciudad_id}
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
                  {ciudadesPorDepartamento.map(([departamento, ciudadesDepto]) => (
                    <optgroup key={departamento} label={departamento}>
                      {ciudadesDepto.map(ciudad => (
                        <option key={ciudad.id} value={ciudad.id}>{ciudad.nombre}</option>
                      ))}
                    </optgroup>
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

              {formData.evento_ciudad_id && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Direccion del Evento
                  </label>
                  <input
                    type="text"
                    name="evento_direccion"
                    value={formData.evento_direccion}
                    onChange={handleChange}
                    placeholder="Ej: Calle 80 #45-20, Finca La Esperanza..."
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  />
                </div>
              )}
            </div>

            {/* Ubicaciones conocidas como sugerencias rapidas */}
            {formData.evento_ciudad_id && ubicacionesFiltradas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Ubicaciones frecuentes en {formData.evento_ciudad}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ubicacionesFiltradas.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        evento_direccion: u.direccion || u.nombre,
                        ubicacion_id: u.id
                      }))}
                      className={`
                        px-2.5 py-1 text-xs rounded-full border transition-colors
                        ${formData.evento_direccion === (u.direccion || u.nombre)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }
                      `}
                    >
                      {u.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Direcciones anteriores del cliente */}
            {ubicacionesCliente.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Direcciones anteriores de este cliente:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ubicacionesCliente.map((uc, idx) => {
                    const ciudadMatch = uc.evento_ciudad ? ciudades.find(c => c.nombre === uc.evento_ciudad) : null
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const updates = {
                            evento_direccion: uc.evento_direccion,
                            ubicacion_id: uc.ubicacion_id || ''
                          }
                          if (ciudadMatch) {
                            updates.evento_ciudad_id = ciudadMatch.id.toString()
                            updates.evento_ciudad = ciudadMatch.nombre
                          }
                          setTransporteSeleccionado([])
                          setFormData(prev => ({ ...prev, ...updates }))
                        }}
                        className={`
                          px-2.5 py-1 text-xs rounded-full border transition-colors
                          ${formData.evento_direccion === uc.evento_direccion
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }
                        `}
                      >
                        {uc.evento_direccion}{uc.evento_ciudad ? ` (${uc.evento_ciudad})` : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
              disabled={isLoading || loadingTarifas || !formData.evento_ciudad_id}
            >
              Agregar viaje
            </Button>
          </div>

          {!formData.evento_ciudad_id ? (
            <div className="py-6 text-center border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/50">
              <MapPin className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="text-sm font-medium text-amber-700">Seleccione una ciudad primero</p>
              <p className="text-xs text-amber-600 mt-1">Use el selector de ciudad de arriba para ver las tarifas disponibles</p>
            </div>
          ) : tarifasFiltradas.length === 0 ? (
            <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No hay tarifas para {formData.evento_ciudad}</p>
              <p className="text-xs text-slate-500 mt-1">Configure tarifas de transporte en la seccion de Ciudades</p>
            </div>
          ) : transporteSeleccionado.length === 0 ? (
            <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Sin transporte agregado</p>
              <p className="text-xs text-slate-400 mt-1">{tarifasFiltradas.length} tarifa{tarifasFiltradas.length !== 1 ? 's' : ''} disponible{tarifasFiltradas.length !== 1 ? 's' : ''} para {formData.evento_ciudad}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transporteSeleccionado.map((trans, index) => {
                const tarifaInfo = tarifas.find(t => t.id === parseInt(trans.tarifa_id))
                const subtotalLinea = tarifaInfo ? tarifaInfo.precio * (parseInt(trans.cantidad) || 1) : 0

                return (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                    <div className="p-3 space-y-3">
                      {/* Fila principal: tarifa + cantidad + eliminar */}
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">Tipo de camion</label>
                          <select
                            value={trans.tarifa_id}
                            onChange={(e) => actualizarTransporte(index, 'tarifa_id', e.target.value)}
                            disabled={isLoading || !formData.evento_ciudad_id}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Seleccionar tarifa...</option>
                            {tarifasFiltradas.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.tipo_camion} - {formatearMoneda(t.precio)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24 flex-shrink-0">
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">Cantidad</label>
                          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => actualizarTransporte(index, 'cantidad', Math.max(1, (parseInt(trans.cantidad) || 1) - 1).toString())}
                              disabled={isLoading || parseInt(trans.cantidad) <= 1}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded disabled:opacity-40"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={trans.cantidad}
                              onChange={(e) => actualizarTransporte(index, 'cantidad', e.target.value)}
                              disabled={isLoading}
                              className="w-10 text-center text-sm font-medium bg-transparent border-none focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => actualizarTransporte(index, 'cantidad', ((parseInt(trans.cantidad) || 1) + 1).toString())}
                              disabled={isLoading}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex-shrink-0 pt-5">
                          <button
                            type="button"
                            onClick={() => eliminarTransporte(index)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isLoading}
                            title="Eliminar transporte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal por linea */}
                      {tarifaInfo && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            {tarifaInfo.tipo_camion} x{trans.cantidad} viaje{parseInt(trans.cantidad) !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            {formatearMoneda(subtotalLinea)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Subtotal total de transporte */}
          {transporteSeleccionado.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">
                Subtotal transporte ({transporteSeleccionado.length} item{transporteSeleccionado.length !== 1 ? 's' : ''})
              </span>
              <span className="text-base font-bold text-blue-700">{formatearMoneda(calcularSubtotalTransporte())}</span>
            </div>
          )}
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
            placeholder="Instrucciones especiales de entrega, horarios, acceso al lugar..."
            rows={3}
            disabled={isLoading}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 resize-none"
          />
        </div>

        </>)}

        {/* ============================================
            PASO 4: RESUMEN Y TOTALES
            ============================================ */}
        {pasoActual === 4 && (<>

        {/* RESUMEN COMPACTO */}
        <div className="space-y-4">
          {/* Datos del evento */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Evento
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {formData.evento_nombre && (
                <div><span className="text-slate-500">Nombre:</span> <span className="font-medium">{formData.evento_nombre}</span></div>
              )}
              <div><span className="text-slate-500">Ciudad:</span> <span className="font-medium">{formData.evento_ciudad || '-'}</span></div>
              {fechasPorConfirmar ? (
                <div className="col-span-2 text-amber-600 italic">Fechas por confirmar (borrador)</div>
              ) : (
                <>
                  <div><span className="text-slate-500">Evento:</span> <span className="font-medium">{formData.fecha_evento || '-'}</span></div>
                  {formData.fecha_montaje && formData.fecha_montaje !== formData.fecha_evento && (
                    <div><span className="text-slate-500">Montaje:</span> <span className="font-medium">{formData.fecha_montaje}</span></div>
                  )}
                  {formData.fecha_desmontaje && formData.fecha_desmontaje !== formData.fecha_evento && (
                    <div><span className="text-slate-500">Desmontaje:</span> <span className="font-medium">{formData.fecha_desmontaje}</span></div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Productos resumen */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Productos ({productosSeleccionados.length})
            </h4>
            <div className="space-y-1">
              {productosSeleccionados.map((prod, idx) => {
                const info = productos.find(p => p.id === parseInt(prod.compuesto_id))
                const subtotal = ((parseFloat(prod.precio_base) || 0) + (parseFloat(prod.precio_adicionales) || 0)) * (parseInt(prod.cantidad) || 1)
                const desc = calcularDescuentoProducto(prod)
                return (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {info?.categoria_emoji || ''} {info?.nombre || 'Producto'} x{prod.cantidad}
                      {desc > 0 && <span className="text-green-600 ml-1">(-{prod.descuento_porcentaje}%)</span>}
                    </span>
                    <span className="font-medium">{formatearMoneda(subtotal - desc)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Transporte resumen */}
          {transporteSeleccionado.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Transporte
              </h4>
              <div className="space-y-1">
                {transporteSeleccionado.map((trans, idx) => {
                  const tarifa = tarifas.find(t => t.id === parseInt(trans.tarifa_id))
                  if (!tarifa) return null
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">{tarifa.tipo_camion} x{trans.cantidad}</span>
                      <span className="font-medium">{formatearMoneda(tarifa.precio * (parseInt(trans.cantidad) || 1))}</span>
                    </div>
                  )
                })}
              </div>
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

              {/* Selector de Descuentos */}
              <div className="border-t border-slate-200 pt-3 mt-2">
                <DescuentosSelectorLocal
                  descuentosAplicados={descuentosAplicados}
                  onDescuentosChange={setDescuentosAplicados}
                  baseCalculo={totales.subtotalBruto}
                  disabled={isLoading}
                />
              </div>

              {/* Mostrar total descuento si hay */}
              {totales.descuento > 0 && (
                <div className="flex justify-between items-center text-sm text-red-600">
                  <span>Total descuentos:</span>
                  <span className="font-medium">-{formatearMoneda(totales.descuento)}</span>
                </div>
              )}

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

        </>)}

        </div>{/* Fin contenido animado */}

        {/* FOOTER FIJO: Navegación del wizard */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
          <div>
            {pasoActual > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
                onClick={anterior}
              >
                Anterior
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            {pasoActual < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={siguiente}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={isLoading}
              >
                {mode === 'crear'
                  ? (fechasPorConfirmar ? 'Crear Borrador' : 'Crear Cotizacion')
                  : 'Guardar Cambios'
                }
              </Button>
            )}
          </div>
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

      {/* Mini-dialog: Guardar dirección como ubicación frecuente */}
      {guardarUbicacion.mostrar && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Guardar dirección</h3>
                <p className="text-sm text-slate-500">¿Quieres guardar esta dirección para usarla después?</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-600">{guardarUbicacion.direccion}</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la ubicación *</label>
                <input
                  type="text"
                  value={guardarUbicacion.nombre}
                  onChange={(e) => setGuardarUbicacion(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder='Ej: "Finca Villa María", "Club El Lago"'
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de lugar</label>
                <select
                  value={guardarUbicacion.tipo}
                  onChange={(e) => setGuardarUbicacion(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="finca">Finca</option>
                  <option value="hacienda">Hacienda</option>
                  <option value="club">Club</option>
                  <option value="hotel">Hotel</option>
                  <option value="jardin">Jardín</option>
                  <option value="playa">Playa</option>
                  <option value="parque">Parque</option>
                  <option value="residencia">Residencia</option>
                  <option value="evento">Lugar de evento</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkipGuardarUbicacion}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                No, gracias
              </button>
              <button
                type="button"
                onClick={handleGuardarUbicacion}
                disabled={!guardarUbicacion.nombre.trim() || isCreatingUbicacion}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isCreatingUbicacion ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default CotizacionFormModal
