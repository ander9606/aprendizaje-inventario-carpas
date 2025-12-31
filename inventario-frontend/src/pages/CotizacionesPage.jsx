// ============================================
// PÁGINA: COTIZACIONES
// Gestión de cotizaciones
// ============================================

import { useState } from 'react'
import { Plus, FileText, ArrowLeft, Users, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetCotizaciones,
  useDeleteCotizacion,
  useAprobarCotizacion,
  useDuplicarCotizacion
} from '../hooks/UseCotizaciones'
import CotizacionCard from '../components/cards/CotizacionCard'
import CotizacionFormModal from '../components/forms/CotizacionFormModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

export default function CotizacionesPage() {

  const navigate = useNavigate()

  // ============================================
  // HOOKS
  // ============================================

  const { cotizaciones, isLoading, error, refetch } = useGetCotizaciones()
  const { mutateAsync: deleteCotizacion, isLoading: isDeleting } = useDeleteCotizacion()
  const { mutateAsync: aprobarCotizacion, isLoading: isAprobando } = useAprobarCotizacion()
  const { mutateAsync: duplicarCotizacion, isLoading: isDuplicando } = useDuplicarCotizacion()

  // ============================================
  // STATE
  // ============================================

  const [modalState, setModalState] = useState({
    crear: false,
    editar: false
  })
  const [selectedCotizacion, setSelectedCotizacion] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrear = () => {
    setModalState({ ...modalState, crear: true })
  }

  const handleCloseModal = () => {
    setModalState({ crear: false, editar: false })
    setSelectedCotizacion(null)
  }

  const handleEdit = (cotizacion) => {
    setSelectedCotizacion(cotizacion)
    setModalState({ ...modalState, editar: true })
  }

  const handleDelete = async (id) => {
    try {
      await deleteCotizacion(id)
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error.response?.data?.message || 'No se pudo eliminar la cotizacion')
    }
  }

  const handleAprobar = async (cotizacion) => {
    const confirmar = confirm(
      `Aprobar cotizacion #${cotizacion.id}?\n\n` +
      `Esto creara un alquiler para: ${cotizacion.evento_nombre || 'Sin nombre'}\n` +
      `Cliente: ${cotizacion.cliente_nombre}`
    )

    if (!confirmar) return

    try {
      const resultado = await aprobarCotizacion({ id: cotizacion.id, opciones: {} })

      if (resultado.advertencia) {
        alert(
          'Cotizacion aprobada con advertencias:\n\n' +
          (resultado.advertencias?.join('\n') || 'Hay elementos con disponibilidad insuficiente')
        )
      } else {
        alert('Cotizacion aprobada y alquiler creado exitosamente')
      }
    } catch (error) {
      console.error('Error al aprobar:', error)

      // Si hay problemas de disponibilidad
      if (error.response?.status === 409) {
        const data = error.response.data
        const confirmarForzar = confirm(
          'Hay elementos insuficientes:\n\n' +
          (data.elementos_faltantes?.join('\n') || 'Verificar disponibilidad') +
          '\n\nAprobar de todas formas?'
        )

        if (confirmarForzar) {
          try {
            await aprobarCotizacion({ id: cotizacion.id, opciones: { forzar: true } })
            alert('Cotizacion aprobada (forzada)')
          } catch (err) {
            alert(err.response?.data?.message || 'Error al aprobar')
          }
        }
      } else {
        alert(error.response?.data?.message || 'No se pudo aprobar la cotizacion')
      }
    }
  }

  const handleDuplicar = async (id) => {
    try {
      await duplicarCotizacion(id)
      alert('Cotizacion duplicada')
    } catch (error) {
      console.error('Error al duplicar:', error)
      alert(error.response?.data?.message || 'No se pudo duplicar')
    }
  }

  const handleVerDetalle = (cotizacion) => {
    // Por ahora abrir para editar
    handleEdit(cotizacion)
  }

  const handleVolver = () => {
    navigate('/alquileres')
  }

  const handleIrClientes = () => {
    navigate('/alquileres/clientes')
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

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
            </div>

            <div className="flex items-center gap-3">
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
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAprobar={handleAprobar}
                onDuplicar={handleDuplicar}
                onVerDetalle={handleVerDetalle}
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

      {/* INDICADORES */}
      {(isDeleting || isAprobando || isDuplicando) && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            {isDeleting && 'Eliminando...'}
            {isAprobando && 'Aprobando...'}
            {isDuplicando && 'Duplicando...'}
          </span>
        </div>
      )}
    </div>
  )
}
