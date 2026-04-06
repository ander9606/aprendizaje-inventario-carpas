// ============================================
// PÁGINA: CLIENTES
// Gestión completa de clientes
// ============================================

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetClientes,
  useDeleteCliente
} from '../hooks/useClientes'
import { useRepetirEvento } from '@alquileres/hooks/useEventos'
import ClienteCard from '../components/cards/ClienteCard'
import ClienteFormModal from '../components/forms/ClienteFormModal'
import ClienteHistorialModal from '../components/modals/ClienteHistorialModal'
import EventoFormModal from '@alquileres/components/modals/EventoFormModal'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import { toast } from 'sonner'

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
 * - Ver historial de eventos de un cliente
 * - Repetir un evento pasado (crear nuevo evento con mismo cliente)
 */
export default function ClientesPage() {

  // ============================================
  // HOOKS: Obtener datos
  // ============================================

  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientes, isLoading, error, refetch } = useGetClientes()
  const { mutateAsync: deleteCliente, isLoading: isDeleting } = useDeleteCliente()
  const repetirEvento = useRepetirEvento()

  // ============================================
  // STATE: Control de modales
  // ============================================

  const [modalState, setModalState] = useState({
    crear: false,
    editar: false
  })

  const [selectedCliente, setSelectedCliente] = useState(null)
  const [historialClienteId, setHistorialClienteId] = useState(null)
  const [eventoRepetir, setEventoRepetir] = useState(null)

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
        t('clients.cannotDeleteClient')
      alert(mensaje)
    }
  }

  const handleVerHistorial = (cliente) => {
    setHistorialClienteId(cliente.id)
  }

  const handleRepetirEvento = (evento, cliente) => {
    setHistorialClienteId(null)
    setEventoRepetir({
      ...evento,
      cliente_id: cliente.id
    })
  }

  const handleCrearEventoRepetido = async (datos) => {
    try {
      const resultado = await repetirEvento.mutateAsync({
        id: eventoRepetir.id,
        fecha_inicio: datos.fecha_inicio,
        fecha_fin: datos.fecha_fin
      })
      const productosCopiados = resultado?.data?.productos_copiados || 0
      toast.success(`Evento repetido con ${productosCopiados} producto${productosCopiados !== 1 ? 's' : ''}`)
      setEventoRepetir(null)
      navigate('/alquileres/cotizaciones')
    } catch (error) {
      toast.error(error?.response?.data?.message || t('clients.errorRepeatingEvent'))
      throw error
    }
  }


  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text={t('clients.loadingClients')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {t('clients.errorLoadingClients')}: {error.message || t('messages.error.generic')}
          <Button variant="ghost" onClick={() => refetch()} className="ml-4">
            {t('clients.retry')}
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
              {t('clients.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('clients.manageClientsDescription')}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Plus />}
            onClick={handleOpenCrear}
          >
            {t('clients.newClient')}
          </Button>
        </div>
      </div>

      {/* INFO */}
      <div className="mb-4 text-sm text-slate-500">
        {t('clients.showingClients', { count: clientes.length })}
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
              onVerHistorial={handleVerHistorial}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          type="no-data"
          title={t('clients.noClientsCreated')}
          description={t('clients.createFirstClientDescription')}
          icon={Users}
          action={{
            label: t('clients.createFirstClient'),
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

      {/* Modal historial de eventos */}
      <ClienteHistorialModal
        isOpen={!!historialClienteId}
        onClose={() => setHistorialClienteId(null)}
        clienteId={historialClienteId}
        onRepetirEvento={handleRepetirEvento}
      />

      {/* Modal repetir evento */}
      <EventoFormModal
        isOpen={!!eventoRepetir}
        onClose={() => setEventoRepetir(null)}
        onSave={handleCrearEventoRepetido}
        eventoReferencia={eventoRepetir}
      />

      {/* Indicador de carga al eliminar */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            {t('clients.deletingClient')}
          </span>
        </div>
      )}
    </div>
  )
}
