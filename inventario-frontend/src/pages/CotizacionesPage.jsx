// ============================================
// PÁGINA: ALQUILERES (EVENTOS)
// Vista principal del módulo de alquileres
// Muestra eventos con sus cotizaciones
// ============================================

import { useState } from 'react'
import {
  Plus,
  ArrowLeft,
  Users,
  Calendar,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  MapPin,
  ChevronDown,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../hooks/UseNavigation'
import {
  useGetEventos,
  useCreateEvento,
  useUpdateEvento,
  useDeleteEvento,
  useCambiarEstadoEvento
} from '../hooks/useEventos'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import EventoFormModal from '../components/modals/EventoFormModal'
import EventoDetalleModal from '../components/modals/EventoDetalleModal'
import CotizacionFormModal from '../components/forms/CotizacionFormModal'
import { toast } from 'sonner'

// ============================================
// COMPONENTE: EventoCard
// Tarjeta de evento con info del cliente y fechas
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
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer"
      onClick={() => onVer(evento)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate text-lg">
            {evento.nombre}
          </h3>
          <p className="text-sm text-purple-600 font-medium mt-0.5 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {evento.cliente_nombre}
          </p>
        </div>
        <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
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
                  Ver cotizaciones
                </button>
                <button
                  onClick={() => { onEditar(evento); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar evento
                </button>
                {evento.estado === 'activo' && (
                  <button
                    onClick={() => { onCambiarEstado(evento.id, 'completado'); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar completado
                  </button>
                )}
                {evento.estado !== 'cancelado' && (
                  <button
                    onClick={() => { onCambiarEstado(evento.id, 'cancelado'); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar evento
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

      {/* Fechas */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>{formatFecha(evento.fecha_inicio)} - {formatFecha(evento.fecha_fin)}</span>
      </div>

      {/* Ciudad */}
      {evento.ciudad_nombre && (
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span>{evento.ciudad_nombre}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <FileText className="w-3.5 h-3.5" />
            Cotizaciones
          </div>
          <p className="font-bold text-slate-900 text-lg">
            {evento.total_cotizaciones || 0}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            Valor
          </div>
          <p className="font-bold text-emerald-600 text-sm">
            {formatMoneda(evento.total_valor)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.color}`}>
          <EstadoIcon className="w-3.5 h-3.5" />
          {estadoConfig.label}
        </span>
        <span className="text-xs text-purple-600 font-medium hover:text-purple-700">
          Ver cotizaciones →
        </span>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CotizacionesPage() {

  const navigate = useNavigate()
  const { volverAModulos } = useNavigation()

  // ============================================
  // HOOKS DE EVENTOS
  // ============================================

  const { eventos, isLoading, error, refetch } = useGetEventos()
  const crearEvento = useCreateEvento()
  const actualizarEvento = useUpdateEvento()
  const eliminarEvento = useDeleteEvento()
  const cambiarEstado = useCambiarEstadoEvento()

  // ============================================
  // STATE
  // ============================================

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // Modales
  const [showModalEvento, setShowModalEvento] = useState(false)
  const [eventoEditar, setEventoEditar] = useState(null)
  const [eventoEliminar, setEventoEliminar] = useState(null)
  const [eventoDetalle, setEventoDetalle] = useState(null)
  const [showModalCotizacion, setShowModalCotizacion] = useState(false)
  const [eventoParaCotizacion, setEventoParaCotizacion] = useState(null)

  // ============================================
  // FILTRAR EVENTOS
  // ============================================

  const eventosFiltrados = (eventos || []).filter(e => {
    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      if (!e.nombre?.toLowerCase().includes(termino) &&
          !e.cliente_nombre?.toLowerCase().includes(termino)) {
        return false
      }
    }
    // Filtro por estado
    if (filtroEstado && e.estado !== filtroEstado) {
      return false
    }
    return true
  })

  // ============================================
  // HANDLERS DE EVENTOS
  // ============================================

  const handleCrearEvento = async (datos) => {
    try {
      await crearEvento.mutateAsync(datos)
      toast.success('Evento creado exitosamente')
      setShowModalEvento(false)
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
      setEventoEditar(null)
      refetch()
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
      setEventoEliminar(null)
      refetch()
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
    setEventoDetalle(null)
    setShowModalCotizacion(true)
  }

  const handleCerrarModalCotizacion = () => {
    setShowModalCotizacion(false)
    setEventoParaCotizacion(null)
    refetch()
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================

  const handleIrClientes = () => {
    navigate('/alquileres/clientes')
  }

  const handleIrCalendario = () => {
    navigate('/alquileres/calendario')
  }

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <Spinner
        fullScreen
        size="xl"
        text="Cargando eventos..."
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar eventos
          </h2>
          <p className="text-slate-600 mb-6">
            {error.message || 'Ocurrio un error inesperado'}
          </p>
          <Button onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">

          {/* NAVEGACIÓN SUPERIOR */}
          <button
            onClick={volverAModulos}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Módulos</span>
          </button>

          <div className="flex items-center justify-between">
            {/* TÍTULO */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Alquileres
                </h1>
                <p className="text-sm text-slate-600">
                  Gestiona eventos y cotizaciones
                </p>
              </div>
            </div>

            {/* ACCIONES */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                icon={<Calendar className="w-4 h-4" />}
                onClick={handleIrCalendario}
              >
                Calendario
              </Button>
              <Button
                variant="secondary"
                icon={<Users className="w-4 h-4" />}
                onClick={handleIrClientes}
              >
                Clientes
              </Button>
              <Button
                variant="primary"
                icon={<Plus />}
                onClick={() => setShowModalEvento(true)}
              >
                Nuevo Evento
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container mx-auto px-6 py-8">

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por evento o cliente..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* Filtro de estado */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="completado">Completados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="mb-6">
          <p className="text-slate-600">
            {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''}
            {busqueda || filtroEstado ? ' encontrado' + (eventosFiltrados.length !== 1 ? 's' : '') : ''}
          </p>
        </div>

        {/* GRID DE EVENTOS */}
        {eventosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {eventosFiltrados.map((evento) => (
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
        ) : (
          <EmptyState
            type="no-data"
            title="No hay eventos"
            description={busqueda || filtroEstado
              ? "No se encontraron eventos con los filtros seleccionados"
              : "Crea tu primer evento para comenzar a gestionar cotizaciones"}
            icon={Calendar}
            action={!busqueda && !filtroEstado ? {
              label: "Crear evento",
              icon: <Plus />,
              onClick: () => setShowModalEvento(true)
            } : undefined}
          />
        )}
      </div>

      {/* MODALES */}

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

      {/* Modal detalle de evento (con cotizaciones) */}
      <EventoDetalleModal
        isOpen={!!eventoDetalle}
        onClose={() => setEventoDetalle(null)}
        eventoId={eventoDetalle}
        onCrearCotizacion={handleCrearCotizacionDesdeEvento}
      />

      {/* Modal crear cotización desde evento */}
      {showModalCotizacion && (
        <CotizacionFormModal
          isOpen={showModalCotizacion}
          onClose={handleCerrarModalCotizacion}
          mode="crear"
          cotizacion={null}
          eventoPreseleccionado={eventoParaCotizacion}
        />
      )}

      {/* Modal confirmar eliminar evento */}
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
                disabled={eliminarEvento.isPending || eventoEliminar.total_cotizaciones > 0}
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
