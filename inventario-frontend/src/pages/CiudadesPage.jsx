// ============================================
// PÁGINA: CIUDADES
// Catálogo maestro de ciudades
// ============================================

import { useState } from 'react'
import { Plus, MapPin, ArrowLeft, Pencil, Trash2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetCiudades,
  useCreateCiudad,
  useUpdateCiudad,
  useDeleteCiudad
} from '../hooks/UseCiudades'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

/**
 * Página CiudadesPage
 */
export default function CiudadesPage() {

  const navigate = useNavigate()

  // ============================================
  // HOOKS: Obtener datos
  // ============================================

  const { ciudades, isLoading, error, refetch } = useGetCiudades()
  const { mutateAsync: createCiudad, isLoading: isCreating } = useCreateCiudad()
  const { mutateAsync: updateCiudad, isLoading: isUpdating } = useUpdateCiudad()
  const { mutateAsync: deleteCiudad, isLoading: isDeleting } = useDeleteCiudad()

  // ============================================
  // STATE
  // ============================================

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCiudad, setEditingCiudad] = useState(null)
  const [formData, setFormData] = useState({ nombre: '', departamento: '' })
  const [busqueda, setBusqueda] = useState('')

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrear = () => {
    setEditingCiudad(null)
    setFormData({ nombre: '', departamento: '' })
    setModalOpen(true)
  }

  const handleOpenEditar = (ciudad) => {
    setEditingCiudad(ciudad)
    setFormData({
      nombre: ciudad.nombre,
      departamento: ciudad.departamento || ''
    })
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingCiudad(null)
    setFormData({ nombre: '', departamento: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      alert('El nombre de la ciudad es obligatorio')
      return
    }

    try {
      if (editingCiudad) {
        await updateCiudad({
          id: editingCiudad.id,
          data: formData
        })
      } else {
        await createCiudad(formData)
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al guardar la ciudad')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta ciudad?')) return
    try {
      await deleteCiudad(id)
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error.response?.data?.message || 'Error al eliminar la ciudad')
    }
  }

  const handleVolver = () => {
    navigate('/configuracion')
  }

  // ============================================
  // FILTROS
  // ============================================

  const ciudadesFiltradas = ciudades.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.departamento && c.departamento.toLowerCase().includes(busqueda.toLowerCase()))
  )

  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (isLoading) {
    return (
      <Spinner
        fullScreen
        size="xl"
        text="Cargando ciudades..."
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar ciudades
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
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Ciudades
                  </h1>
                  <p className="text-sm text-slate-600">
                    Catálogo maestro de ciudades
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={<Plus />}
              onClick={handleOpenCrear}
            >
              Nueva Ciudad
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container mx-auto px-6 py-8">

        {/* BUSCADOR */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="text-sm text-blue-600 hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-slate-600">
            {ciudadesFiltradas.length} ciudad{ciudadesFiltradas.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* LISTA DE CIUDADES */}
        {ciudadesFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ciudadesFiltradas.map((ciudad) => (
              <div
                key={ciudad.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {ciudad.nombre}
                      </h3>
                      {ciudad.departamento && (
                        <p className="text-sm text-slate-500">
                          {ciudad.departamento}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditar(ciudad)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ciudad.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className={`
                    inline-flex px-2 py-1 rounded-full text-xs font-medium
                    ${ciudad.activo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'}
                  `}>
                    {ciudad.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="no-data"
            title="No hay ciudades registradas"
            description="Crea tu primera ciudad para empezar"
            icon={MapPin}
            action={{
              label: "Crear primera ciudad",
              icon: <Plus />,
              onClick: handleOpenCrear
            }}
          />
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingCiudad ? 'Editar Ciudad' : 'Nueva Ciudad'}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre de la ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Medellín"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Antioquia"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Guardando...
                    </span>
                  ) : (
                    editingCiudad ? 'Guardar cambios' : 'Crear ciudad'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Indicador de carga al eliminar */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            Eliminando ciudad...
          </span>
        </div>
      )}
    </div>
  )
}
