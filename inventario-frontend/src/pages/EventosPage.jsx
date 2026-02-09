// ============================================
// PÁGINA: EventosPage
// Lista de eventos con múltiples cotizaciones
// Sección activos + sección realizados colapsable
// ============================================

import { useState, useMemo } from 'react'
import {
    Calendar,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    Eye,
    Edit2,
    Trash2,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    DollarSign,
    History,
    Package
} from 'lucide-react'
import {
    useGetEventos,
    useCreateEvento,
    useUpdateEvento,
    useDeleteEvento,
    useCambiarEstadoEvento
} from '../hooks/useEventos'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EventoFormModal from '../components/modals/EventoFormModal'
import EventoDetalleModal from '../components/modals/EventoDetalleModal'
import CotizacionFormModal from '../components/forms/CotizacionFormModal'
import { toast } from 'sonner'

// ============================================
// HELPER: Verificar si un evento está "finalizado"
// ============================================
const esEventoFinalizado = (evento) => {
    return evento.estado === 'completado' || evento.estado === 'cancelado'
}

// ============================================
// COMPONENTE: EventoCard
// ============================================
const EventoCard = ({ evento, onVer, onEditar, onEliminar, onCambiarEstado }) => {
    const [showMenu, setShowMenu] = useState(false)

    const getEstadoConfig = (estado) => {
        const config = {
            activo: { color: 'bg-green-100 text-green-700', icon: Clock, label: 'Activo' },
            completado: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completado' },
            cancelado: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelado' }
        }
        return config[estado] || config.activo
    }

    const estadoConfig = getEstadoConfig(evento.estado)
    const EstadoIcon = estadoConfig.icon

    const formatFecha = (fecha) => {
        if (!fecha) return '-'
        try {
            let fechaStr = ''
            if (fecha instanceof Date) {
                fechaStr = fecha.toISOString().split('T')[0]
            } else if (typeof fecha === 'string') {
                fechaStr = fecha.split('T')[0]
            } else if (typeof fecha === 'object') {
                const str = String(fecha)
                if (str && str !== '[object Object]' && !str.includes('Invalid')) {
                    fechaStr = str.split('T')[0]
                } else {
                    return '-'
                }
            }
            if (!fechaStr) return '-'
            const fechaObj = new Date(fechaStr + 'T12:00:00')
            if (isNaN(fechaObj.getTime())) return '-'
            return fechaObj.toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        } catch {
            return '-'
        }
    }

    const formatMoneda = (valor) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor || 0)
    }

    // Indicador de progreso de alquileres
    const totalAlquileres = evento.total_alquileres || 0
    const alquileresFinalizados = evento.alquileres_finalizados || 0
    const alquileresActivos = evento.alquileres_activos || 0

    return (
        <div className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
            evento.estado === 'completado'
                ? 'border-green-200 bg-green-50/30'
                : evento.estado === 'cancelado'
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-200'
        }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">
                            {evento.nombre}
                        </h3>
                        {evento.estado === 'completado' && (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {evento.cliente_nombre}
                    </p>
                </div>
                <div className="relative ml-2">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                <button
                                    onClick={() => { onVer(evento); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver detalle
                                </button>
                                {evento.estado === 'activo' && (
                                    <button
                                        onClick={() => { onEditar(evento); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editar
                                    </button>
                                )}
                                {evento.estado === 'activo' && (
                                    <button
                                        onClick={() => { onCambiarEstado(evento.id, 'completado'); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Marcar completado
                                    </button>
                                )}
                                {evento.estado !== 'cancelado' && evento.estado !== 'completado' && (
                                    <button
                                        onClick={() => { onCambiarEstado(evento.id, 'cancelado'); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Cancelar
                                    </button>
                                )}
                                {evento.estado === 'completado' && (
                                    <button
                                        onClick={() => { onCambiarEstado(evento.id, 'activo'); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-blue-600"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Reactivar
                                    </button>
                                )}
                                <hr className="my-1" />
                                <button
                                    onClick={() => { onEliminar(evento); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formatFecha(evento.fecha_inicio)} - {formatFecha(evento.fecha_fin)}</span>
                </div>
                {(evento.ciudad_nombre || evento.direccion) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>
                            {evento.ciudad_nombre}
                            {evento.ciudad_nombre && evento.direccion && ' - '}
                            {evento.direccion}
                        </span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        Cotizaciones
                    </div>
                    <p className="font-semibold text-slate-900">
                        {evento.total_cotizaciones || 0}
                    </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Valor total
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">
                        {formatMoneda(evento.total_valor)}
                    </p>
                </div>
            </div>

            {/* Progreso alquileres (si hay) */}
            {totalAlquileres > 0 && (
                <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Alquileres
                        </span>
                        <span className="font-medium text-slate-700">
                            {alquileresFinalizados}/{totalAlquileres} finalizados
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                alquileresFinalizados === totalAlquileres
                                    ? 'bg-green-500'
                                    : alquileresActivos > 0
                                        ? 'bg-orange-500'
                                        : 'bg-blue-500'
                            }`}
                            style={{ width: `${totalAlquileres > 0 ? (alquileresFinalizados / totalAlquileres) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Estado + Botón */}
            <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.color}`}>
                    <EstadoIcon className="w-3.5 h-3.5" />
                    {estadoConfig.label}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onVer(evento)}
                >
                    Ver cotizaciones
                </Button>
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL: EventosPage
// ============================================
export default function EventosPage() {
    // Estado
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [showFiltros, setShowFiltros] = useState(false)
    const [showModalEvento, setShowModalEvento] = useState(false)
    const [eventoEditar, setEventoEditar] = useState(null)
    const [eventoEliminar, setEventoEliminar] = useState(null)
    const [eventoDetalle, setEventoDetalle] = useState(null)
    const [showModalCotizacion, setShowModalCotizacion] = useState(false)
    const [eventoParaCotizacion, setEventoParaCotizacion] = useState(null)
    const [cotizacionEditar, setCotizacionEditar] = useState(null)
    const [mostrarRealizados, setMostrarRealizados] = useState(false)

    // Queries y mutations
    const { eventos, isLoading, refetch } = useGetEventos({ estado: filtroEstado || undefined })
    const crearEvento = useCreateEvento()
    const actualizarEvento = useUpdateEvento()
    const eliminarEvento = useDeleteEvento()
    const cambiarEstado = useCambiarEstadoEvento()

    // Filtrar por búsqueda
    const eventosFiltrados = useMemo(() => {
        return eventos.filter(e => {
            if (!busqueda) return true
            const termino = busqueda.toLowerCase()
            return (
                e.nombre?.toLowerCase().includes(termino) ||
                e.cliente_nombre?.toLowerCase().includes(termino)
            )
        })
    }, [eventos, busqueda])

    // Separar activos de finalizados
    const eventosActivos = useMemo(
        () => eventosFiltrados.filter(e => !esEventoFinalizado(e)),
        [eventosFiltrados]
    )
    const eventosRealizados = useMemo(
        () => eventosFiltrados.filter(e => esEventoFinalizado(e)),
        [eventosFiltrados]
    )

    // Handlers
    const handleCrearEvento = async (datos) => {
        try {
            await crearEvento.mutateAsync(datos)
            toast.success('Evento creado exitosamente')
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al crear evento')
            throw error
        }
    }

    const handleActualizarEvento = async (datos) => {
        try {
            await actualizarEvento.mutateAsync({ id: eventoEditar.id, data: datos })
            toast.success('Evento actualizado')
            refetch()
            setEventoEditar(null)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al actualizar')
            throw error
        }
    }

    const handleEliminarEvento = async () => {
        if (!eventoEliminar) return
        try {
            await eliminarEvento.mutateAsync(eventoEliminar.id)
            toast.success('Evento eliminado')
            refetch()
            setEventoEliminar(null)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al eliminar')
        }
    }

    const handleCambiarEstado = async (id, estado) => {
        try {
            await cambiarEstado.mutateAsync({ id, estado })
            toast.success(`Evento marcado como ${estado}`)
            refetch()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al cambiar estado')
        }
    }

    const handleVerEvento = (evento) => {
        setEventoDetalle(evento.id)
    }

    const handleCrearCotizacionDesdeEvento = (evento) => {
        setEventoParaCotizacion(evento)
        setCotizacionEditar(null)
        setShowModalCotizacion(true)
    }

    const handleEditarCotizacionDesdeEvento = (cotizacion) => {
        setCotizacionEditar(cotizacion)
        setEventoParaCotizacion(null)
        setShowModalCotizacion(true)
    }

    const handleCerrarModalCotizacion = () => {
        setShowModalCotizacion(false)
        setEventoParaCotizacion(null)
        setCotizacionEditar(null)
        refetch()
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                            Eventos
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Gestiona eventos con múltiples cotizaciones
                        </p>
                    </div>
                    <Button
                        color="blue"
                        icon={Plus}
                        onClick={() => setShowModalEvento(true)}
                    >
                        Nuevo Evento
                    </Button>
                </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre o cliente..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Botón de filtros */}
                    <Button
                        variant="secondary"
                        icon={Filter}
                        onClick={() => setShowFiltros(!showFiltros)}
                    >
                        Filtros
                        {filtroEstado && (
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                1
                            </span>
                        )}
                    </Button>
                </div>

                {/* Panel de filtros */}
                {showFiltros && (
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Estado
                            </label>
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">Todos</option>
                                <option value="activo">Activo</option>
                                <option value="completado">Completado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                        {filtroEstado && (
                            <button
                                onClick={() => setFiltroEstado('')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-6"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Contador */}
            {!isLoading && (
                <div className="mb-4 text-sm text-slate-500">
                    {eventosActivos.length > 0 && (
                        <span>{eventosActivos.length} evento{eventosActivos.length !== 1 ? 's' : ''} activo{eventosActivos.length !== 1 ? 's' : ''}</span>
                    )}
                    {eventosRealizados.length > 0 && (
                        <span className="text-green-600"> · {eventosRealizados.length} realizado{eventosRealizados.length !== 1 ? 's' : ''}</span>
                    )}
                    {eventosActivos.length === 0 && eventosRealizados.length === 0 && (
                        <span>0 eventos</span>
                    )}
                </div>
            )}

            {/* EVENTOS ACTIVOS */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {eventosActivos.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                                Eventos Activos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {eventosActivos.map(evento => (
                                    <EventoCard
                                        key={evento.id}
                                        evento={evento}
                                        onVer={handleVerEvento}
                                        onEditar={(e) => setEventoEditar(e)}
                                        onEliminar={(e) => setEventoEliminar(e)}
                                        onCambiarEstado={handleCambiarEstado}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN REALIZADOS (COLAPSABLE) */}
                    {eventosRealizados.length > 0 && (
                        <div className="mb-8 border-t border-slate-200 pt-6">
                            <button
                                onClick={() => setMostrarRealizados(!mostrarRealizados)}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
                            >
                                {mostrarRealizados ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                                <History className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Eventos realizados
                                </span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    {eventosRealizados.length}
                                </span>
                            </button>

                            {mostrarRealizados && (
                                <div className="opacity-75">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {eventosRealizados.map(evento => (
                                            <EventoCard
                                                key={evento.id}
                                                evento={evento}
                                                onVer={handleVerEvento}
                                                onEditar={(e) => setEventoEditar(e)}
                                                onEliminar={(e) => setEventoEliminar(e)}
                                                onCambiarEstado={handleCambiarEstado}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ESTADO VACÍO */}
                    {eventosActivos.length === 0 && eventosRealizados.length === 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                No hay eventos
                            </h3>
                            <p className="text-slate-500 mb-6">
                                {busqueda || filtroEstado
                                    ? 'No se encontraron eventos con los filtros seleccionados'
                                    : 'Crea tu primer evento para agrupar cotizaciones'}
                            </p>
                            {!busqueda && !filtroEstado && (
                                <Button
                                    color="blue"
                                    icon={Plus}
                                    onClick={() => setShowModalEvento(true)}
                                >
                                    Crear Evento
                                </Button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal crear/editar evento */}
            {(showModalEvento || eventoEditar) && (
                <EventoFormModal
                    isOpen={showModalEvento || !!eventoEditar}
                    onClose={() => {
                        setShowModalEvento(false)
                        setEventoEditar(null)
                    }}
                    onSave={eventoEditar ? handleActualizarEvento : handleCrearEvento}
                    evento={eventoEditar}
                />
            )}

            {/* Modal detalle de evento */}
            <EventoDetalleModal
                isOpen={!!eventoDetalle}
                onClose={() => setEventoDetalle(null)}
                eventoId={eventoDetalle}
                onCrearCotizacion={handleCrearCotizacionDesdeEvento}
                onEditarCotizacion={handleEditarCotizacionDesdeEvento}
            />

            {/* Modal crear/editar cotización desde evento */}
            {showModalCotizacion && (
                <CotizacionFormModal
                    isOpen={showModalCotizacion}
                    onClose={handleCerrarModalCotizacion}
                    mode={cotizacionEditar ? 'editar' : 'crear'}
                    cotizacion={cotizacionEditar}
                    eventoPreseleccionado={eventoParaCotizacion}
                />
            )}

            {/* Modal confirmar eliminar */}
            {eventoEliminar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Eliminar Evento
                        </h3>
                        <p className="text-slate-600 mb-6">
                            ¿Estás seguro de eliminar el evento "{eventoEliminar.nombre}"?
                            {eventoEliminar.total_cotizaciones > 0 && (
                                <span className="block text-red-600 mt-2 text-sm">
                                    Este evento tiene {eventoEliminar.total_cotizaciones} cotización(es) asociada(s).
                                    Primero debes desvincularlas.
                                </span>
                            )}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setEventoEliminar(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="red"
                                onClick={handleEliminarEvento}
                                disabled={eliminarEvento.isPending}
                            >
                                {eliminarEvento.isPending ? 'Eliminando...' : 'Eliminar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
