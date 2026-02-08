// ============================================
// PÁGINA: DETALLE DE ORDEN DE TRABAJO
// Vista completa con acciones de modificación
// ============================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Truck,
    Package,
    Calendar,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Edit3,
    Play,
    AlertTriangle,
    Phone,
    Mail,
    FileText,
    RefreshCw,
    User,
    ChevronDown,
    ChevronUp,
    LogOut,
    RotateCcw,
    Box,
    Bell
} from 'lucide-react'
import {
    useGetOrden,
    useGetElementosOrden,
    useGetOrdenCompleta,
    useGetAlertasOrden,
    usePrepararElementos,
    useCambiarEstadoOrden,
    useAsignarEquipo,
    useUpdateOrden,
    useEjecutarSalida,
    useEjecutarRetorno
} from '../hooks/useOrdenesTrabajo'
import { useAuth } from '../hooks/auth/useAuth'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import {
    ModalRetornoElementos,
    ModalOrdenCargue,
    ModalAsignarResponsable,
    ModalEditarOrden,
    ModalAsignarInventario
} from '../components/operaciones'
import { toast } from 'sonner'

// ============================================
// COMPONENTE PRINCIPAL: OrdenDetallePage
// ============================================
export default function OrdenDetallePage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const canManage = hasRole(['admin', 'gerente', 'operaciones'])

    // ============================================
    // ESTADO LOCAL
    // ============================================
    const [showModalResponsable, setShowModalResponsable] = useState(false)
    const [showModalEditar, setShowModalEditar] = useState(false)
    const [showModalRetorno, setShowModalRetorno] = useState(false)
    const [showModalInventario, setShowModalInventario] = useState(false)
    const [showModalOrdenCargue, setShowModalOrdenCargue] = useState(false)
    const [expandElementos, setExpandElementos] = useState(true)
    const [ejecutandoSalida, setEjecutandoSalida] = useState(false)

    // ============================================
    // HOOKS: Obtener datos
    // ============================================
    const { orden, isLoading, error, refetch } = useGetOrden(id)
    const { elementos, isLoading: loadingElementos } = useGetElementosOrden(id)
    const { alertas: alertasOrden } = useGetAlertasOrden(id)

    // Obtener orden completa: productos, elementos y depósito
    // Se carga siempre para mostrar productos y validar estado de cargue
    const { productos, alquilerElementos, elementosCargue, resumenCotizacion } = useGetOrdenCompleta(id)

    // ============================================
    // HOOKS: Mutaciones
    // ============================================
    const cambiarEstado = useCambiarEstadoOrden()
    const asignarEquipo = useAsignarEquipo()
    const actualizarOrden = useUpdateOrden()
    const prepararElementos = usePrepararElementos()
    const ejecutarSalida = useEjecutarSalida()
    const ejecutarRetorno = useEjecutarRetorno()

    // ============================================
    // HANDLERS
    // ============================================
    const handleCambiarEstado = async (nuevoEstado) => {
        const mensajes = {
            confirmado: 'Orden confirmada',
            en_preparacion: 'Preparación iniciada',
            en_ruta: 'Orden en ruta',
            en_sitio: 'Equipo llegó al sitio',
            en_proceso: 'Trabajo iniciado',
            completado: 'Orden completada exitosamente',
            cancelado: 'Orden cancelada'
        }

        try {
            await cambiarEstado.mutateAsync({
                id: orden.id,
                data: { estado: nuevoEstado }
            })
            toast.success(mensajes[nuevoEstado] || `Estado cambiado a ${nuevoEstado}`)
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al cambiar estado')
        }
    }

    const handleAsignarResponsable = async (data) => {
        await asignarEquipo.mutateAsync({ id: orden.id, data })
        toast.success('Responsable asignado correctamente')
        refetch()
    }

    const handleActualizarOrden = async (data) => {
        await actualizarOrden.mutateAsync({ id: orden.id, data })
        toast.success('Orden actualizada correctamente')
        refetch()
    }

    const handleAsignarInventario = async (elementosSeleccionados) => {
        await prepararElementos.mutateAsync({ ordenId: orden.id, elementos: elementosSeleccionados })
        toast.success('Inventario asignado correctamente')
        setShowModalInventario(false)
        refetch()
    }

    const handleEjecutarSalida = async () => {
        if (!confirm('¿Confirmar ejecución de salida? Esta acción cambiará el estado del alquiler a "activo" y marcará los elementos como despachados.')) {
            return
        }

        setEjecutandoSalida(true)
        try {
            await ejecutarSalida.mutateAsync({ ordenId: orden.id, datos: {} })
            toast.success('Salida ejecutada correctamente. Alquiler ahora activo.')
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al ejecutar salida')
        } finally {
            setEjecutandoSalida(false)
        }
    }

    const handleEjecutarRetorno = async (retornos) => {
        try {
            await ejecutarRetorno.mutateAsync({ ordenId: orden.id, retornos })
            toast.success('Retorno registrado correctamente. Alquiler finalizado.')
            setShowModalRetorno(false)
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al registrar retorno')
            throw error
        }
    }

    // ============================================
    // HELPERS
    // ============================================
    const getEstadoConfig = (estado) => {
        const config = {
            pendiente: {
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: Clock,
                label: 'Pendiente'
            },
            confirmado: {
                color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                icon: CheckCircle,
                label: 'Confirmado'
            },
            en_preparacion: {
                color: 'bg-purple-100 text-purple-700 border-purple-200',
                icon: Package,
                label: 'En Preparación'
            },
            en_ruta: {
                color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                icon: Truck,
                label: 'En Ruta'
            },
            en_sitio: {
                color: 'bg-amber-100 text-amber-700 border-amber-200',
                icon: MapPin,
                label: 'En Sitio'
            },
            en_proceso: {
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: RefreshCw,
                label: 'En Proceso'
            },
            completado: {
                color: 'bg-green-100 text-green-700 border-green-200',
                icon: CheckCircle,
                label: 'Completado'
            },
            cancelado: {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: XCircle,
                label: 'Cancelado'
            }
        }
        return config[estado] || config.pendiente
    }

    const getTipoConfig = (tipo) => {
        return tipo === 'montaje'
            ? { color: 'bg-emerald-100 text-emerald-700', icon: Package, label: 'Montaje' }
            : { color: 'bg-orange-100 text-orange-700', icon: Truck, label: 'Desmontaje' }
    }

    const getPrioridadConfig = (prioridad) => {
        const config = {
            baja: { color: 'bg-slate-100 text-slate-600', label: 'Baja' },
            normal: { color: 'bg-blue-100 text-blue-600', label: 'Normal' },
            alta: { color: 'bg-orange-100 text-orange-600', label: 'Alta' },
            urgente: { color: 'bg-red-100 text-red-600', label: 'Urgente' }
        }
        return config[prioridad] || config.normal
    }

    const formatFecha = (fecha) => {
        if (!fecha) return 'Sin fecha'
        return new Date(fecha).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // ============================================
    // RENDER: Loading / Error
    // ============================================
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" text="Cargando orden..." />
            </div>
        )
    }

    if (error || !orden) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        Error al cargar la orden
                    </h2>
                    <p className="text-slate-600 mb-4">
                        {error?.message || 'No se encontró la orden solicitada'}
                    </p>
                    <Button onClick={() => navigate('/operaciones/ordenes')}>
                        Volver a Órdenes
                    </Button>
                </div>
            </div>
        )
    }

    const estadoConfig = getEstadoConfig(orden.estado)
    const tipoConfig = getTipoConfig(orden.tipo)
    const prioridadConfig = getPrioridadConfig(orden.prioridad)
    const EstadoIcon = estadoConfig.icon
    const TipoIcon = tipoConfig.icon

    // ============================================
    // HELPERS: Progreso del flujo
    // ============================================
    const tieneResponsable = orden.equipo?.length > 0

    const getPasosFlujo = () => {
        if (orden.tipo === 'montaje') {
            return [
                { key: 'pendiente', label: 'Pendiente', short: 'Pend.' },
                { key: 'confirmado', label: 'Confirmado', short: 'Conf.' },
                { key: 'en_preparacion', label: 'Preparación', short: 'Prep.' },
                { key: 'en_ruta', label: 'En Ruta', short: 'Ruta' },
                { key: 'en_sitio', label: 'En Sitio', short: 'Sitio' },
                { key: 'en_proceso', label: 'En Proceso', short: 'Proc.' },
                { key: 'completado', label: 'Completado', short: 'Listo' }
            ]
        }
        return [
            { key: 'pendiente', label: 'Pendiente', short: 'Pend.' },
            { key: 'confirmado', label: 'Confirmado', short: 'Conf.' },
            { key: 'en_preparacion', label: 'Preparación', short: 'Prep.' },
            { key: 'en_ruta', label: 'En Ruta', short: 'Ruta' },
            { key: 'en_sitio', label: 'En Sitio', short: 'Sitio' },
            { key: 'completado', label: 'Completado', short: 'Listo' }
        ]
    }

    const pasos = getPasosFlujo()
    const pasoActualIndex = pasos.findIndex(p => p.key === orden.estado)
    const esCancelado = orden.estado === 'cancelado'
    const esCompletado = orden.estado === 'completado'

    // Detectar elementos sin inventario asignado
    const elementosPendientesInv = (elementos || []).filter(
        e => !e.serie_id && !e.lote_id
    )
    const hayElementosSinInventario = elementosPendientesInv.length > 0

    // Verificar estado de cargue para transiciones estrictas
    const elementosCargados = (elementos || []).filter(e => e.estado === 'cargado')
    const todosElementosCargados = elementos?.length > 0 && elementosCargados.length === elementos.length
    const algunElementoCargado = elementosCargados.length > 0
    const elementosPendientesCargue = (elementos || []).filter(e => e.estado !== 'cargado')

    // Agrupar elementos por producto para vista resumida
    const productosConEstado = (productos || []).map(producto => {
        const elementosDelProducto = (elementosCargue || []).filter(
            e => e.compuesto_id === producto.compuesto_id
        )
        const totalElementos = elementosDelProducto.length
        const cargados = elementosDelProducto.filter(e =>
            e.estado === 'cargado' || e.estado_salida === 'cargado'
        ).length

        return {
            ...producto,
            totalElementos,
            cargados,
            listoParaCargar: totalElementos > 0 && cargados === totalElementos,
            sinAsignar: totalElementos === 0
        }
    })

    // Detectar alertas de stock disponible (notificación de que el inventario volvió)
    const alertaStockDisponible = (alertasOrden || []).find(
        a => a.tipo === 'stock_disponible' && a.estado === 'pendiente'
    )
    // Detectar alertas de insuficiencia pendientes
    const alertaInsuficiencia = (alertasOrden || []).find(
        a => a.tipo === 'conflicto_disponibilidad' && a.estado === 'pendiente'
    )

    const getDescripcionEstado = () => {
        const desc = {
            pendiente: 'Esta orden está pendiente de confirmación. Asigna un responsable y confirma para iniciar.',
            confirmado: 'Orden confirmada. Inicia la preparación de los elementos necesarios.',
            en_preparacion: orden.tipo === 'montaje'
                ? 'Preparando elementos para despacho. Cuando todo esté listo, ejecuta la salida.'
                : 'Preparando para el desmontaje. Cuando esté listo, envía al equipo en ruta.',
            en_ruta: 'El equipo está en camino al sitio del evento.',
            en_sitio: orden.tipo === 'montaje'
                ? 'El equipo llegó al sitio. Inicia el trabajo de montaje.'
                : 'El equipo llegó al sitio. Realiza el desmontaje y registra el retorno.',
            en_proceso: orden.tipo === 'montaje'
                ? 'Montaje en curso. Marca como completado cuando termine.'
                : 'Desmontaje en curso. Registra el retorno de los elementos.',
            completado: 'Esta orden ha sido completada exitosamente.',
            cancelado: 'Esta orden fue cancelada.'
        }
        return desc[orden.estado] || ''
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/operaciones/ordenes')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${tipoConfig.color}`}>
                                <TipoIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoConfig.color}`}>
                                        {tipoConfig.label}
                                    </span>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Orden #{orden.id}
                                    </h1>
                                </div>
                                <p className="text-slate-500 mt-0.5">
                                    {orden.cliente_nombre || 'Cliente'}
                                    {orden.evento_nombre ? ` — ${orden.evento_nombre}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${estadoConfig.color}`}>
                            <EstadoIcon className="w-5 h-5" />
                            <span className="font-medium">{estadoConfig.label}</span>
                        </div>
                        {canManage && !esCompletado && !esCancelado && (
                            <Button
                                icon={Edit3}
                                variant="secondary"
                                onClick={() => setShowModalEditar(true)}
                            >
                                Editar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* NOTIFICACIÓN: Stock disponible */}
            {alertaStockDisponible && !esCompletado && !esCancelado && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg shrink-0">
                        <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-green-800">
                            {alertaStockDisponible.titulo}
                        </h4>
                        <p className="text-sm text-green-700 mt-0.5">
                            {alertaStockDisponible.mensaje}
                        </p>
                        {hayElementosSinInventario && (
                            <button
                                onClick={() => setShowModalInventario(true)}
                                className="mt-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-1.5"
                            >
                                <Box className="w-4 h-4" />
                                Asignar Inventario Ahora
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ALERTA: Insuficiencia de inventario pendiente */}
            {alertaInsuficiencia && !alertaStockDisponible && !esCompletado && !esCancelado && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-amber-800">
                            Insuficiencia de inventario reportada
                        </h4>
                        <p className="text-sm text-amber-700 mt-0.5">
                            {alertaInsuficiencia.mensaje}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                            Se notificará automáticamente cuando el inventario esté disponible.
                        </p>
                    </div>
                </div>
            )}

            {/* BARRA DE PROGRESO */}
            {!esCancelado && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex items-center justify-between">
                        {pasos.map((paso, idx) => {
                            const esActual = paso.key === orden.estado
                            const esCompletadoPaso = idx < pasoActualIndex || esCompletado
                            return (
                                <div key={paso.key} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                            esActual
                                                ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                                                : esCompletadoPaso
                                                ? 'bg-green-500 text-white'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {esCompletadoPaso && !esActual ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                        <span className={`text-[10px] mt-1 text-center leading-tight ${
                                            esActual ? 'font-bold text-orange-600' : esCompletadoPaso ? 'text-green-600' : 'text-slate-400'
                                        }`}>
                                            <span className="hidden sm:inline">{paso.label}</span>
                                            <span className="sm:hidden">{paso.short}</span>
                                        </span>
                                    </div>
                                    {idx < pasos.length - 1 && (
                                        <div className={`h-0.5 flex-1 -mt-4 mx-1 ${
                                            idx < pasoActualIndex ? 'bg-green-400' : 'bg-slate-200'
                                        }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ESTADO CANCELADO */}
            {esCancelado && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-700 font-medium">Esta orden fue cancelada</p>
                </div>
            )}

            {/* CONTENIDO */}
            <div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* COLUMNA PRINCIPAL */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* INFO DEL EVENTO */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Información del Evento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-500">Fecha Programada</p>
                                        <p className="font-medium text-slate-900">
                                            {formatFecha(orden.fecha_programada)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-500">Ubicación</p>
                                        <p className="font-medium text-slate-900">
                                            {orden.direccion_evento || 'Sin dirección'}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {orden.ciudad_evento || 'Sin ciudad'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-500">Prioridad</p>
                                        <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${prioridadConfig.color}`}>
                                            {prioridadConfig.label}
                                        </span>
                                    </div>
                                </div>
                                {orden.alquiler_id && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500">Alquiler</p>
                                            <p className="font-medium text-slate-900">
                                                #{orden.alquiler_id}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {orden.notas && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 mb-1">Notas</p>
                                    <p className="text-slate-700">{orden.notas}</p>
                                </div>
                            )}
                        </div>

                        {/* INFO DEL CLIENTE */}
                        {orden.cliente_nombre && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                    Cliente
                                </h2>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-full">
                                        <User className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">
                                            {orden.cliente_nombre}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                            {orden.cliente_telefono && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-4 h-4" />
                                                    {orden.cliente_telefono}
                                                </span>
                                            )}
                                            {orden.cliente_email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-4 h-4" />
                                                    {orden.cliente_email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PRODUCTOS DE LA ORDEN */}
                        <div className="bg-white rounded-xl border border-slate-200">
                            <button
                                onClick={() => setExpandElementos(!expandElementos)}
                                className="w-full p-6 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            Productos ({productosConEstado?.length || 0})
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {elementos?.length || 0} elementos en total
                                        </p>
                                    </div>
                                </div>
                                {expandElementos ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>
                            {expandElementos && (
                                <div className="px-6 pb-6">
                                    {loadingElementos ? (
                                        <div className="py-4 text-center">
                                            <Spinner size="sm" />
                                        </div>
                                    ) : productosConEstado?.length > 0 ? (
                                        <div className="space-y-3">
                                            {productosConEstado.map((producto) => (
                                                <div
                                                    key={producto.id}
                                                    className={`border rounded-lg p-4 transition-colors ${
                                                        producto.listoParaCargar
                                                            ? 'border-green-200 bg-green-50/50'
                                                            : producto.sinAsignar
                                                            ? 'border-amber-200 bg-amber-50/50'
                                                            : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{producto.categoria_emoji || '📦'}</span>
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {producto.cantidad}x {producto.producto_nombre}
                                                                </p>
                                                                <p className="text-sm text-slate-500">
                                                                    {producto.categoria_nombre}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {producto.listoParaCargar ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Listo - {producto.totalElementos} elem.
                                                                </span>
                                                            ) : producto.sinAsignar ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                                                                    <AlertTriangle className="w-4 h-4" />
                                                                    Sin asignar
                                                                </span>
                                                            ) : producto.cargados > 0 ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                                    <Box className="w-4 h-4" />
                                                                    {producto.cargados}/{producto.totalElementos} cargados
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                                                                    <Clock className="w-4 h-4" />
                                                                    {producto.totalElementos} pendientes
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : elementos?.length > 0 ? (
                                        // Fallback: mostrar resumen simple si no hay productos
                                        <div className="p-4 bg-slate-50 rounded-lg text-center">
                                            <p className="text-slate-600">
                                                <span className="font-medium">{elementos.length}</span> elementos asignados
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {elementosCargados.length} cargados, {elementosPendientesCargue.length} pendientes
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-4">
                                            No hay elementos asignados a esta orden
                                        </p>
                                    )}

                                    {/* Botón Ver Orden de Cargue - Solo en preparación con inventario asignado */}
                                    {orden.estado === 'en_preparacion' && orden.tipo === 'montaje' && !hayElementosSinInventario && elementos?.length > 0 && canManage && (
                                        <div className={`mt-4 p-4 rounded-lg border ${
                                            todosElementosCargados
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-blue-50 border-blue-200'
                                        }`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    {todosElementosCargados ? (
                                                        <>
                                                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-green-800">
                                                                    Cargue confirmado
                                                                </p>
                                                                <p className="text-xs text-green-600">
                                                                    {elementos.length} elemento(s) listos para salida
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-blue-800">
                                                                    Pendiente confirmar cargue
                                                                </p>
                                                                <p className="text-xs text-blue-600">
                                                                    {elementosPendientesCargue.length} de {elementos.length} elemento(s) sin confirmar
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <Button
                                                    color={todosElementosCargados ? 'green' : 'blue'}
                                                    icon={Truck}
                                                    size="sm"
                                                    onClick={() => setShowModalOrdenCargue(true)}
                                                >
                                                    {todosElementosCargados ? 'Ver Detalle' : 'Confirmar Cargue'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botón asignar inventario si hay elementos pendientes */}
                                    {hayElementosSinInventario && canManage && !esCompletado && !esCancelado && (
                                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-800">
                                                            Inventario pendiente
                                                        </p>
                                                        <p className="text-xs text-amber-600">
                                                            {elementosPendientesInv.length} elemento(s) sin asignar del almacen
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    color="orange"
                                                    icon={Box}
                                                    size="sm"
                                                    onClick={() => setShowModalInventario(true)}
                                                >
                                                    Asignar Inventario
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA LATERAL */}
                    <div className="space-y-6">

                        {/* SIGUIENTE PASO + ACCIONES */}
                        {canManage && !esCompletado && !esCancelado && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Descripción del estado actual */}
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <p className="text-sm text-slate-600">
                                        {getDescripcionEstado()}
                                    </p>
                                </div>

                                <div className="p-6 space-y-3">
                                    {/* Advertencia sin responsable */}
                                    {!tieneResponsable && ['pendiente', 'confirmado'].includes(orden.estado) && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm text-amber-700 font-medium">Sin responsable</p>
                                                <button
                                                    onClick={() => setShowModalResponsable(true)}
                                                    className="text-xs text-amber-600 hover:text-amber-700 underline"
                                                >
                                                    Asignar ahora
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* === ACCIÓN PRINCIPAL por estado === */}

                                    {orden.estado === 'pendiente' && (
                                        <Button
                                            color="blue"
                                            icon={CheckCircle}
                                            className="w-full"
                                            onClick={() => {
                                                if (!tieneResponsable) {
                                                    if (!confirm('No hay responsable asignado. ¿Deseas confirmar la orden de todas formas?')) return
                                                }
                                                handleCambiarEstado('confirmado')
                                            }}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Confirmar Orden
                                        </Button>
                                    )}

                                    {orden.estado === 'confirmado' && (
                                        <Button
                                            color="blue"
                                            icon={Package}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_preparacion')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Iniciar Preparación
                                        </Button>
                                    )}

                                    {orden.estado === 'en_preparacion' && orden.tipo === 'montaje' && (
                                        <>
                                            {/* Paso 1: Asignar inventario */}
                                            {hayElementosSinInventario ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-amber-700 font-medium">
                                                                Paso 1: Asignar inventario
                                                            </p>
                                                            <p className="text-xs text-amber-600 mt-0.5">
                                                                {elementosPendientesInv.length} elemento(s) sin inventario del almacen
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        color="orange"
                                                        icon={Box}
                                                        className="w-full"
                                                        onClick={() => setShowModalInventario(true)}
                                                    >
                                                        Asignar Inventario
                                                    </Button>
                                                </div>
                                            ) : !todosElementosCargados ? (
                                                /* Paso 2: Confirmar cargue */
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <Truck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-blue-700 font-medium">
                                                                Paso 2: Confirmar cargue
                                                            </p>
                                                            <p className="text-xs text-blue-600 mt-0.5">
                                                                {elementosPendientesCargue.length} de {elementos?.length} elemento(s) sin confirmar
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        color="blue"
                                                        icon={Truck}
                                                        className="w-full"
                                                        onClick={() => setShowModalOrdenCargue(true)}
                                                    >
                                                        Confirmar Cargue
                                                    </Button>
                                                </div>
                                            ) : (
                                                /* Paso 3: Ejecutar salida */
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-green-700 font-medium">
                                                                Listo para salida
                                                            </p>
                                                            <p className="text-xs text-green-600 mt-0.5">
                                                                {elementos?.length} elemento(s) cargados y verificados
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        color="green"
                                                        icon={LogOut}
                                                        className="w-full"
                                                        onClick={handleEjecutarSalida}
                                                        disabled={ejecutandoSalida}
                                                    >
                                                        {ejecutandoSalida ? 'Ejecutando...' : 'Ejecutar Salida'}
                                                    </Button>
                                                </div>
                                            )}
                                            {!elementos?.length && !hayElementosSinInventario && (
                                                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                                    <p className="text-xs text-amber-700">
                                                        Asigna elementos antes de ejecutar la salida
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {orden.estado === 'en_preparacion' && orden.tipo === 'desmontaje' && (
                                        <Button
                                            color="blue"
                                            icon={Truck}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_ruta')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Enviar en Ruta
                                        </Button>
                                    )}

                                    {orden.estado === 'en_ruta' && (
                                        <Button
                                            color="blue"
                                            icon={MapPin}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_sitio')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Llegó al Sitio
                                        </Button>
                                    )}

                                    {orden.estado === 'en_sitio' && orden.tipo === 'montaje' && (
                                        <Button
                                            color="blue"
                                            icon={Play}
                                            className="w-full"
                                            onClick={() => handleCambiarEstado('en_proceso')}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Iniciar Montaje
                                        </Button>
                                    )}

                                    {orden.estado === 'en_sitio' && orden.tipo === 'desmontaje' && (
                                        <Button
                                            color="orange"
                                            icon={RotateCcw}
                                            className="w-full"
                                            onClick={() => setShowModalRetorno(true)}
                                        >
                                            Registrar Retorno
                                        </Button>
                                    )}

                                    {orden.estado === 'en_proceso' && orden.tipo === 'montaje' && (
                                        <Button
                                            color="green"
                                            icon={CheckCircle}
                                            className="w-full"
                                            onClick={() => {
                                                if (!confirm('¿Marcar esta orden como completada?')) return
                                                handleCambiarEstado('completado')
                                            }}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Marcar Completado
                                        </Button>
                                    )}

                                    {orden.estado === 'en_proceso' && orden.tipo === 'desmontaje' && (
                                        <Button
                                            color="orange"
                                            icon={RotateCcw}
                                            className="w-full"
                                            onClick={() => setShowModalRetorno(true)}
                                        >
                                            Registrar Retorno
                                        </Button>
                                    )}

                                    {/* Separador antes de cancelar */}
                                    <div className="border-t border-slate-200 pt-3">
                                        <Button
                                            color="red"
                                            icon={XCircle}
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                if (!confirm('¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer.')) return
                                                handleCambiarEstado('cancelado')
                                            }}
                                            disabled={cambiarEstado.isPending}
                                        >
                                            Cancelar Orden
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ESTADO COMPLETADO */}
                        {esCompletado && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                <p className="font-semibold text-green-800">Orden Completada</p>
                                <p className="text-sm text-green-600 mt-1">
                                    Esta orden fue completada exitosamente
                                </p>
                            </div>
                        )}

                        {/* RESPONSABLE ASIGNADO */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Responsable
                                </h3>
                                {canManage && !esCompletado && !esCancelado && (
                                    <button
                                        onClick={() => setShowModalResponsable(true)}
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        {tieneResponsable ? 'Cambiar' : 'Asignar'}
                                    </button>
                                )}
                            </div>
                            {tieneResponsable ? (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="p-2 bg-white rounded-full">
                                        <User className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {orden.equipo[0].nombre} {orden.equipo[0].apellido || ''}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {orden.equipo[0].rol_empleado || orden.equipo[0].cargo || 'Empleado'}
                                        </p>
                                        {orden.equipo[0].telefono && (
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                {orden.equipo[0].telefono}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">
                                        Sin responsable asignado
                                    </p>
                                    {canManage && !esCompletado && !esCancelado && (
                                        <button
                                            onClick={() => setShowModalResponsable(true)}
                                            className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            Asignar responsable
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALES */}
            {showModalResponsable && (
                <ModalAsignarResponsable
                    orden={orden}
                    onClose={() => setShowModalResponsable(false)}
                    onSave={handleAsignarResponsable}
                />
            )}
            {showModalEditar && (
                <ModalEditarOrden
                    orden={orden}
                    onClose={() => setShowModalEditar(false)}
                    onSave={handleActualizarOrden}
                />
            )}
            {showModalRetorno && (
                <ModalRetornoElementos
                    isOpen={showModalRetorno}
                    onClose={() => setShowModalRetorno(false)}
                    orden={orden}
                    elementos={alquilerElementos?.length > 0 ? alquilerElementos : elementos}
                    productos={productos}
                    deposito={resumenCotizacion?.total_deposito || 0}
                    onSave={handleEjecutarRetorno}
                />
            )}
            {showModalInventario && (
                <ModalAsignarInventario
                    ordenId={orden.id}
                    elementosPendientes={elementosPendientesInv}
                    onClose={() => setShowModalInventario(false)}
                    onSave={handleAsignarInventario}
                />
            )}
            {showModalOrdenCargue && (
                <ModalOrdenCargue
                    isOpen={showModalOrdenCargue}
                    onClose={() => setShowModalOrdenCargue(false)}
                    ordenId={orden.id}
                    ordenInfo={orden}
                    elementos={elementos}
                    onConfirmado={refetch}
                />
            )}
        </div>
    )
}
