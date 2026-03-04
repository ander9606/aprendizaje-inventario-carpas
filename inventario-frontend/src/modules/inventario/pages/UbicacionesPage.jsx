// ============================================
// PÁGINA: UBICACIONES
// Gestión completa de ubicaciones
// ============================================

import { useState } from 'react'
import { Plus, MapPin, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetUbicaciones,
  useDeleteUbicacion
} from '../hooks/useUbicaciones'
import UbicacionCard from '../components/cards/UbicacionCard'
import UbicacionFormModal from '../components/forms/UbicacionFormModal'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'

/**
 * Página UbicacionesPage
 *
 * Muestra todas las ubicaciones en un grid
 *
 * FUNCIONALIDADES:
 * - Ver todas las ubicaciones
 * - Crear nueva ubicación
 * - Editar ubicación existente
 * - Eliminar ubicación
 */
export default function UbicacionesPage() {

  const navigate = useNavigate()

  // ============================================
  // HOOKS: Obtener datos
  // ============================================

  // Obtener ubicaciones
  const { ubicaciones, isLoading, error, refetch } = useGetUbicaciones()

  // Hook para eliminar
  const { mutateAsync: deleteUbicacion, isLoading: isDeleting } = useDeleteUbicacion()

  // ============================================
  // STATE: Control de modales
  // ============================================

  // Estado para controlar qué modal está abierto
  const [modalState, setModalState] = useState({
    crear: false,
    editar: false
  })

  // Ubicación seleccionada para editar
  const [selectedUbicacion, setSelectedUbicacion] = useState(null)

  // ============================================
  // HANDLERS: Acciones de ubicaciones
  // ============================================

  /**
   * Abrir modal de crear ubicación
   */
  const handleOpenCrear = () => {
    setModalState({ ...modalState, crear: true })
  }

  /**
   * Cerrar todos los modales
   */
  const handleCloseModal = () => {
    setModalState({
      crear: false,
      editar: false
    })
    setSelectedUbicacion(null)
  }

  /**
   * Abrir modal de editar ubicación
   */
  const handleEdit = (ubicacion) => {
    setSelectedUbicacion(ubicacion)
    setModalState({ ...modalState, editar: true })
  }

  /**
   * Eliminar ubicación
   */
  const handleDelete = async (id) => {
    try {
      await deleteUbicacion(id)
      console.log('✅ Ubicación eliminada exitosamente')
    } catch (error) {
      console.error('❌ Error al eliminar:', error)
      const mensaje = error.response?.data?.message ||
        'No se pudo eliminar la ubicación. Puede tener inventario asociado.'
      alert(mensaje)
    }
  }

  /**
   * Volver al dashboard de configuración
   */
  const handleVolver = () => {
    navigate('/configuracion')
  }

  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  // Estado de carga inicial
  if (isLoading) {
    return (
      <Spinner
        fullScreen
        size="xl"
        text="Cargando ubicaciones..."
      />
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar ubicaciones
          </h2>
          <p className="text-slate-600 mb-6">
            {error.message || 'Ocurrió un error inesperado'}
          </p>
          <Button onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: Contenido principal
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============================================
          HEADER DE LA PÁGINA
          ============================================ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Título y botón volver */}
            <div className="flex items-center gap-4">
              {/* Botón volver */}
              <button
                onClick={handleVolver}
                className="
                  p-2 hover:bg-slate-100 rounded-lg transition-colors
                  flex items-center gap-2 text-slate-600 hover:text-slate-900
                "
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Título */}
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Ubicaciones
                  </h1>
                  <p className="text-sm text-slate-600">
                    Gestiona tus ubicaciones de inventario
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de crear */}
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={handleOpenCrear}
            >
              Nueva Ubicación
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="container mx-auto px-6 py-8">
        {/* Título de sección */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            📍 Todas las Ubicaciones
          </h2>
          <p className="text-slate-600">
            {ubicaciones.length} ubicación{ubicaciones.length !== 1 ? 'es' : ''} registrada{ubicaciones.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ============================================
            GRID DE UBICACIONES
            ============================================ */}
        {ubicaciones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ubicaciones.map((ubicacion) => (
              <UbicacionCard
                key={ubicacion.id}
                ubicacion={ubicacion}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          /* ============================================
              ESTADO VACÍO: No hay ubicaciones
              ============================================ */
          <EmptyState
            type="no-data"
            title="No hay ubicaciones creadas"
            description="Crea tu primera ubicación para comenzar a organizar tu inventario"
            icon={MapPin}
            action={{
              label: "Crear primera ubicación",
              icon: <Plus />,
              onClick: handleOpenCrear
            }}
          />
        )}
      </div>

      {/* ============================================
          MODALES
          ============================================ */}

      {/* Modal: Crear ubicación */}
      <UbicacionFormModal
        isOpen={modalState.crear}
        onClose={handleCloseModal}
        mode="crear"
        ubicacion={null}
      />

      {/* Modal: Editar ubicación */}
      <UbicacionFormModal
        isOpen={modalState.editar}
        onClose={handleCloseModal}
        mode="editar"
        ubicacion={selectedUbicacion}
      />

      {/* Indicador de carga al eliminar */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            Eliminando ubicación...
          </span>
        </div>
      )}
    </div>
  )
}
