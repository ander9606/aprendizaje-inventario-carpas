// ============================================
// PÁGINA: CLIENTES
// Gestión completa de clientes
// ============================================

import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
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

  
  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Cargando clientes..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar clientes: {error.message || 'Ocurrió un error inesperado'}
          <Button variant="ghost" onClick={() => refetch()} className="ml-4">
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
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              Clientes
            </h1>
            <p className="text-slate-500 mt-1">
              Gestiona tus clientes para cotizaciones
            </p>
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

      {/* INFO */}
      <div className="mb-4 text-sm text-slate-500">
        Mostrando {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
      </div>

      {/* GRID DE CLIENTES */}
      {clientes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
