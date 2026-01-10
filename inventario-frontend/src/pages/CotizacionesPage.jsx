// ============================================
// PÁGINA: COTIZACIONES
// Gestión de cotizaciones
// ============================================

import { useState } from 'react'
import { Plus, FileText, ArrowLeft, Users, Filter, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../hooks/UseNavigation'
import { useGetCotizaciones, useAprobarCotizacion, useDeleteCotizacion, useCambiarEstadoCotizacion } from '../hooks/cotizaciones'
import CotizacionCard from '../components/cards/CotizacionCard'
import CotizacionFormModal from '../components/forms/CotizacionFormModal'
import CotizacionDetalleModal from '../components/modals/CotizacionDetalleModal'
import AprobarCotizacionModal from '../components/modals/AprobarCotizacionModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

export default function CotizacionesPage() {

  const navigate = useNavigate()
  const { volverAModulos } = useNavigation()

  // ============================================
  // HOOKS
  // ============================================

  const { cotizaciones, isLoading, error, refetch } = useGetCotizaciones()
  const { mutateAsync: aprobarCotizacion, isLoading: isAprobando } = useAprobarCotizacion()
  const { mutateAsync: eliminarCotizacion, isLoading: isEliminando } = useDeleteCotizacion()
  const { mutateAsync: cambiarEstado } = useCambiarEstadoCotizacion()

  // ============================================
  // STATE
  // ============================================

  const [modalState, setModalState] = useState({
    crear: false,
    editar: false,
    detalle: false,
    aprobar: false
  })
  const [selectedCotizacion, setSelectedCotizacion] = useState(null)
  const [selectedCotizacionId, setSelectedCotizacionId] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrear = () => {
    setModalState({ ...modalState, crear: true })
  }

  const handleCloseModal = () => {
    setModalState({ crear: false, editar: false, detalle: false, aprobar: false })
    setSelectedCotizacion(null)
    setSelectedCotizacionId(null)
  }

  const handleVerDetalle = (cotizacion) => {
    setSelectedCotizacionId(cotizacion.id)
    setModalState({ ...modalState, detalle: true })
  }

  const handleEditar = (cotizacion) => {
    setSelectedCotizacion(cotizacion)
    setModalState({ crear: false, detalle: false, editar: true })
  }

  const handleIrClientes = () => {
    navigate('/alquileres/clientes')
  }

  const handleIrCalendario = () => {
    navigate('/alquileres/calendario')
  }

  // Abrir modal de aprobación
  const handleAprobar = (cotizacion) => {
    setSelectedCotizacionId(cotizacion.id)
    setModalState({ ...modalState, detalle: false, aprobar: true })
  }

  // Confirmar aprobación desde el modal
  const handleConfirmarAprobacion = async ({ id, opciones }) => {
    try {
      await aprobarCotizacion({ id, opciones })
      handleCloseModal()
      // Navegar a alquileres después de aprobar
      navigate('/alquileres')
    } catch (error) {
      console.error('Error al aprobar:', error)
      alert(error.response?.data?.mensaje || error.response?.data?.message || 'Error al aprobar la cotización')
    }
  }

  const handleEliminar = async (cotizacion) => {
    try {
      await eliminarCotizacion(cotizacion.id)
      handleCloseModal()
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error.response?.data?.message || 'Error al eliminar la cotización')
    }
  }

  const handleRechazar = async (cotizacion) => {
    try {
      await cambiarEstado({ id: cotizacion.id, estado: 'rechazada' })
      handleCloseModal()
    } catch (error) {
      console.error('Error al rechazar:', error)
      alert(error.response?.data?.message || 'Error al rechazar la cotización')
    }
  }

  // ============================================
  // FILTRAR COTIZACIONES
  // ============================================

  const cotizacionesFiltradas = filtroEstado === 'todos'
    ? cotizaciones
    : cotizaciones.filter(c => c.estado === filtroEstado)

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <Spinner
        fullScreen
        size="xl"
        text="Cargando cotizaciones..."
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar cotizaciones
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
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Cotizaciones
                </h1>
                <p className="text-sm text-slate-600">
                  Gestiona tus cotizaciones de alquiler
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
                onClick={handleOpenCrear}
              >
                Nueva Cotizacion
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container mx-auto px-6 py-8">
        {/* FILTROS */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              Todas las Cotizaciones
            </h2>
            <p className="text-slate-600">
              {cotizacionesFiltradas.length} cotizacion{cotizacionesFiltradas.length !== 1 ? 'es' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
              <option value="vencida">Vencidas</option>
            </select>
          </div>
        </div>

        {/* GRID */}
        {cotizacionesFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cotizacionesFiltradas.map((cotizacion) => (
              <CotizacionCard
                key={cotizacion.id}
                cotizacion={cotizacion}
                onVerDetalle={handleVerDetalle}
                onEditar={handleEditar}
                onAprobar={handleAprobar}
                onRechazar={handleRechazar}
                onEliminar={handleEliminar}
                isAprobando={isAprobando}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="no-data"
            title="No hay cotizaciones"
            description={filtroEstado === 'todos'
              ? "Crea tu primera cotizacion para comenzar"
              : `No hay cotizaciones con estado "${filtroEstado}"`}
            icon={FileText}
            action={filtroEstado === 'todos' ? {
              label: "Crear cotizacion",
              icon: <Plus />,
              onClick: handleOpenCrear
            } : undefined}
          />
        )}
      </div>

      {/* MODALES */}
      <CotizacionFormModal
        isOpen={modalState.crear}
        onClose={handleCloseModal}
        mode="crear"
        cotizacion={null}
      />

      <CotizacionFormModal
        isOpen={modalState.editar}
        onClose={handleCloseModal}
        mode="editar"
        cotizacion={selectedCotizacion}
      />

      <CotizacionDetalleModal
        isOpen={modalState.detalle}
        onClose={handleCloseModal}
        cotizacionId={selectedCotizacionId}
        onEditar={handleEditar}
        onAprobar={handleAprobar}
        onEliminar={handleEliminar}
        onRechazar={handleRechazar}
        isAprobando={isAprobando}
        isEliminando={isEliminando}
      />

      <AprobarCotizacionModal
        isOpen={modalState.aprobar}
        onClose={handleCloseModal}
        cotizacionId={selectedCotizacionId}
        onAprobar={handleConfirmarAprobacion}
        isAprobando={isAprobando}
      />
    </div>
  )
}
