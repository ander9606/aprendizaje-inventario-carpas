// ============================================
// PÁGINA: ALQUILERES (EVENTOS)
// Vista principal del módulo de alquileres
// Muestra eventos con sus cotizaciones
// ============================================

import { useState } from 'react'
import {
  Plus,
  Users,
  Calendar,
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
  Trash2,
  Archive
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetEventos,
  useCreateEvento,
  useUpdateEvento,
  useDeleteEvento,
  useCambiarEstadoEvento
} from '../hooks/useEventos'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import EventoFormModal from '../components/modals/EventoFormModal'
import EventoDetalleModal from '../components/modals/EventoDetalleModal'
import CotizacionFormModal from '../components/forms/CotizacionFormModal'
import ConfirmModal from '@shared/components/ConfirmModal'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// ============================================
// COMPONENTE: EventoCard
// Tarjeta de evento con info del cliente y fechas
// ============================================
const EventoCard = ({ evento, onVer, onEditar, onEliminar, onCambiarEstado }) => {
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)

  const getEstadoConfig = (estado) => {
    const config = {
      activo: { color: 'bg-green-100 text-green-700', icon: Clock, label: t('clients.statusActive') },
      completado: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: t('clients.statusCompleted') },
      cancelado: { color: 'bg-red-100 text-red-700', icon: XCircle, label: t('clients.statusCancelled') }
    }
    return config[estado] || config.activo
  }

  const estadoConfig = getEstadoConfig(evento.estado)
  const EstadoIcon = estadoConfig.icon

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    try {
      let fechaStr = ''

      // Caso 1: Es un objeto Date nativo
      if (fecha instanceof Date) {
        fechaStr = fecha.toISOString().split('T')[0]
      }
      // Caso 2: Es un string
      else if (typeof fecha === 'string') {
        fechaStr = fecha.split('T')[0]
      }
      // Caso 3: Es un objeto MySQL Date
      else if (typeof fecha === 'object') {
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
                  {t('rentals.quotes')}
                </button>
                <button
                  onClick={() => { onEditar(evento); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                {evento.estado === 'activo' && (
                  <button
                    onClick={() => { onCambiarEstado(evento.id, 'completado'); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('rentals.completed')}
                  </button>
                )}
                {evento.estado !== 'cancelado' && (
                  <button
                    onClick={() => { onCambiarEstado(evento.id, 'cancelado'); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('rentals.cancelled')}
                  </button>
                )}
                <hr className="my-1" />
                <button
                  onClick={() => { onEliminar(evento); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
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
            {t('rentals.quotes')}
          </div>
          <p className="font-bold text-slate-900 text-lg">
            {evento.total_cotizaciones || 0}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            {t('rentals.totalAmount')}
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
          {t('rentals.quotes')} →
        </span>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CotizacionesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

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

  // Modales
  const [showModalEvento, setShowModalEvento] = useState(false)
  const [eventoEditar, setEventoEditar] = useState(null)
  const [eventoEliminar, setEventoEliminar] = useState(null)
  const [eventoDetalle, setEventoDetalle] = useState(null)
  const [showModalCotizacion, setShowModalCotizacion] = useState(false)
  const [eventoParaCotizacion, setEventoParaCotizacion] = useState(null)
  const [cotizacionEditar, setCotizacionEditar] = useState(null)
  const [fechasPorConfirmarInicial, setFechasPorConfirmarInicial] = useState(false)

  // ============================================
  // FILTRAR EVENTOS
  // ============================================

  const eventosFiltrados = (eventos || []).filter(e => {
    // Solo mostrar eventos activos (completados y cancelados van al historial)
    if (e.estado === 'completado' || e.estado === 'cancelado') {
      return false
    }
    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      if (!e.nombre?.toLowerCase().includes(termino) &&
          !e.cliente_nombre?.toLowerCase().includes(termino)) {
        return false
      }
    }
    return true
  })

  // ============================================
  // HANDLERS DE EVENTOS
  // ============================================

  const handleCrearEvento = async (datos) => {
    try {
      await crearEvento.mutateAsync(datos)
      toast.success(t('rentals.eventCreated'))
      setShowModalEvento(false)
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.message || t('messages.error.createError'))
      throw error
    }
  }

  const handleActualizarEvento = async (datos) => {
    try {
      await actualizarEvento.mutateAsync({ id: eventoEditar.id, data: datos })
      toast.success(t('messages.success.categoryUpdated'))
      setEventoEditar(null)
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.message || t('messages.error.updateError'))
      throw error
    }
  }

  const handleEliminarEvento = async () => {
    if (!eventoEliminar) return
    try {
      await eliminarEvento.mutateAsync(eventoEliminar.id)
      toast.success(t('messages.success.categoryDeleted'))
      setEventoEliminar(null)
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.message || t('messages.error.deleteError'))
    }
  }

  const handleCambiarEstado = async (id, estado) => {
    try {
      await cambiarEstado.mutateAsync({ id, estado })
      toast.success(t('rentals.completed'))
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.message || t('messages.error.updateError'))
    }
  }

  const handleVerEvento = (evento) => {
    setEventoDetalle(evento.id)
  }

  const handleCrearCotizacionDesdeEvento = (evento, opciones = {}) => {
    setEventoParaCotizacion(evento)
    setCotizacionEditar(null)
    setFechasPorConfirmarInicial(opciones.fechasPorConfirmar || false)
    setEventoDetalle(null)
    setShowModalCotizacion(true)
  }

  const handleEditarCotizacionDesdeEvento = (cotizacion) => {
    setCotizacionEditar(cotizacion)
    setEventoParaCotizacion(null)
    setEventoDetalle(null)
    setShowModalCotizacion(true)
  }

  const handleCerrarModalCotizacion = () => {
    setShowModalCotizacion(false)
    setEventoParaCotizacion(null)
    setCotizacionEditar(null)
    setFechasPorConfirmarInicial(false)
    refetch()
  }

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text={t('rentals.loadingQuotes')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {t('rentals.errorLoadingQuotes')}: {error.message || t('common.unexpectedError')}
          <Button variant="ghost" onClick={() => refetch()} className="ml-4">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              {t('rentals.quotes')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('rentals.description')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={() => setShowModalEvento(true)}
            >
              {t('rentals.newEvent')}
            </Button>
          </div>
        </div>
      </div>

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
              placeholder={t('rentals.searchByEventClient')}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Link al historial */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Archive className="w-4 h-4" />}
            onClick={() => navigate('/alquileres/historial-eventos')}
            className="text-slate-600"
          >
            {t('rentals.history')}
          </Button>
        </div>
      </div>

      {/* INFO */}
      <div className="mb-4 text-sm text-slate-500">
        {t('common.showing')} {eventosFiltrados.length} {t('rentals.events').toLowerCase()}
      </div>

      {/* GRID DE EVENTOS */}
      {eventosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          title={t('rentals.noEvents')}
          description={busqueda
            ? t('empty.noResults')
            : t('rentals.createFirstEvent')}
          icon={Calendar}
          action={!busqueda ? {
            label: t('rentals.newEvent'),
            icon: <Plus />,
            onClick: () => setShowModalEvento(true)
          } : undefined}
        />
      )}

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
        onEditarCotizacion={handleEditarCotizacionDesdeEvento}
      />

      {/* Modal crear/editar cotización */}
      {showModalCotizacion && (
        <CotizacionFormModal
          isOpen={showModalCotizacion}
          onClose={handleCerrarModalCotizacion}
          mode={cotizacionEditar ? 'editar' : 'crear'}
          cotizacion={cotizacionEditar}
          eventoPreseleccionado={eventoParaCotizacion}
          fechasPorConfirmarInicial={fechasPorConfirmarInicial}
        />
      )}

      {/* Modal confirmar eliminar evento */}
      <ConfirmModal
        isOpen={!!eventoEliminar}
        onClose={() => setEventoEliminar(null)}
        onConfirm={handleEliminarEvento}
        title={t('rentals.deleteEvent')}
        message={eventoEliminar ? `${t('rentals.confirmDeleteEvent')} "${eventoEliminar.nombre}"?` : ''}
        variant="danger"
        confirmText={t('common.delete')}
        loading={eliminarEvento.isPending}
      />
    </div>
  )
}
