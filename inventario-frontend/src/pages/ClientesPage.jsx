// ============================================
// PÁGINA: CLIENTES
// Gestión completa de clientes
// ============================================

import { useState } from 'react'
import { Plus, Users, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetClientes,
  useDeleteCliente
} from '../hooks/UseClientes'
import ClienteCard from '../components/cards/ClienteCard'
import ClienteFormModal from '../components/forms/ClienteFormModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

/**
 * Página ClientesPage
 *
 * Muestra todos los clientes en un grid
 *
 * FUNCIONALIDADES:
 * - Ver todos los clientes
 * - Crear nuevo cliente
 * - Editar cliente existente
 * - Eliminar cliente
 */
export default function ClientesPage() {

  const navigate = useNavigate()

  // ============================================
  // HOOKS: Obtener datos
  // ============================================

  const { clientes, isLoading, error, refetch } = useGetClientes()
  const { mutateAsync: deleteCliente, isLoading: isDeleting } = useDeleteCliente()

  // ============================================
  // STATE: Control de modales
  // ============================================

  const [modalState, setModalState] = useState({
    crear: false,
    editar: false
  })

  const [selectedCliente, setSelectedCliente] = useState(null)

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrear = () => {
    setModalState({ ...modalState, crear: true })
  }

  const handleCloseModal = () => {
    setModalState({
      crear: false,
      editar: false
    })
    setSelectedCliente(null)
  }

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente)
    setModalState({ ...modalState, editar: true })
  }

  const handleDelete = async (id) => {
    try {
      await deleteCliente(id)
    } catch (error) {
      console.error('Error al eliminar:', error)
      const mensaje = error.response?.data?.message ||
        'No se pudo eliminar el cliente. Puede tener cotizaciones asociadas.'
      alert(mensaje)
    }
  }

  const handleVolver = () => {
    navigate('/alquileres')
  }

  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (isLoading) {
    return (
      <Spinner
        fullScreen
        size="xl"
        text="Cargando clientes..."
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar clientes
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
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="
                  p-2 hover:bg-slate-100 rounded-lg transition-colors
                  flex items-center gap-2 text-slate-600 hover:text-slate-900
                "
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Clientes
                  </h1>
                  <p className="text-sm text-slate-600">
                    Gestiona tus clientes para cotizaciones
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={<Plus />}
              onClick={handleOpenCrear}
            >
              Nuevo Cliente
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            Todos los Clientes
          </h2>
          <p className="text-slate-600">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* GRID DE CLIENTES */}
        {clientes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="no-data"
            title="No hay clientes creados"
            description="Crea tu primer cliente para comenzar a generar cotizaciones"
            icon={Users}
            action={{
              label: "Crear primer cliente",
              icon: <Plus />,
              onClick: handleOpenCrear
            }}
          />
        )}
      </div>

      {/* MODALES */}
      <ClienteFormModal
        isOpen={modalState.crear}
        onClose={handleCloseModal}
        mode="crear"
        cliente={null}
      />

      <ClienteFormModal
        isOpen={modalState.editar}
        onClose={handleCloseModal}
        mode="editar"
        cliente={selectedCliente}
      />

      {/* Indicador de carga al eliminar */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            Eliminando cliente...
          </span>
        </div>
      )}
    </div>
  )
}
