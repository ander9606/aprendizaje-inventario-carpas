// ============================================
// PÁGINA: CIUDADES
// Catálogo maestro de ciudades con tarifas de transporte
// ============================================

import { useState } from 'react'
import { Plus, MapPin, ArrowLeft, Pencil, Trash2, Search, Truck } from 'lucide-react'
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

// Tipos de camión disponibles
const TIPOS_CAMION = [
  { id: 'Pequeño', nombre: 'Pequeño', descripcion: 'Hasta 3 ton' },
  { id: 'Mediano', nombre: 'Mediano', descripcion: '3-8 ton' },
  { id: 'Grande', nombre: 'Grande', descripcion: '8-15 ton' },
  { id: 'Extragrande', nombre: 'Extragrande', descripcion: '+15 ton' }
]

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
  const [formData, setFormData] = useState({
    nombre: '',
    departamento: '',
    tarifas: {
      'Pequeño': '',
      'Mediano': '',
      'Grande': '',
      'Extragrande': ''
    }
  })
  const [busqueda, setBusqueda] = useState('')

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrear = () => {
    setEditingCiudad(null)
    setFormData({
      nombre: '',
      departamento: '',
      tarifas: {
        'Pequeño': '',
        'Mediano': '',
        'Grande': '',
        'Extragrande': ''
      }
    })
    setModalOpen(true)
  }

  const handleOpenEditar = (ciudad) => {
    setEditingCiudad(ciudad)
    setFormData({
      nombre: ciudad.nombre,
      departamento: ciudad.departamento || '',
      tarifas: {
        'Pequeño': ciudad.tarifas?.['Pequeño'] || '',
        'Mediano': ciudad.tarifas?.['Mediano'] || '',
        'Grande': ciudad.tarifas?.['Grande'] || '',
        'Extragrande': ciudad.tarifas?.['Extragrande'] || ''
      }
    })
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingCiudad(null)
    setFormData({
      nombre: '',
      departamento: '',
      tarifas: {
        'Pequeño': '',
        'Mediano': '',
        'Grande': '',
        'Extragrande': ''
      }
    })
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
    if (!confirm('¿Estás seguro de eliminar esta ciudad y sus tarifas?')) return
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

  const handleTarifaChange = (tipo, valor) => {
    // Solo permitir números
    const numero = valor.replace(/[^\d]/g, '')
    setFormData(prev => ({
      ...prev,
      tarifas: {
        ...prev.tarifas,
        [tipo]: numero
      }
    }))
  }

  const formatearMoneda = (valor) => {
    if (!valor) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor)
  }

  const formatearInputMoneda = (valor) => {
    if (!valor) return ''
    return new Intl.NumberFormat('es-CO').format(valor)
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
                <MapPin className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Ciudades
                  </h1>
                  <p className="text-sm text-slate-600">
                    Catálogo de ciudades con tarifas de transporte
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

        {/* TABLA DE CIUDADES */}
        {ciudadesFiltradas.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                      Ciudad
                    </th>
                    {TIPOS_CAMION.map(tipo => (
                      <th key={tipo.id} className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                        <div className="flex items-center justify-end gap-1">
                          <Truck className="w-4 h-4" />
                          {tipo.nombre}
                        </div>
                        <span className="text-xs font-normal text-slate-500">{tipo.descripcion}</span>
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">
                      Estado
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ciudadesFiltradas.map((ciudad) => (
                    <tr key={ciudad.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{ciudad.nombre}</div>
                            {ciudad.departamento && (
                              <div className="text-sm text-slate-500">{ciudad.departamento}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {TIPOS_CAMION.map(tipo => (
                        <td key={tipo.id} className="px-4 py-4 text-right text-sm">
                          {ciudad.tarifas?.[tipo.id] ? (
                            <span className="font-medium text-slate-900">
                              {formatearMoneda(ciudad.tarifas[tipo.id])}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-4 text-center">
                        <span className={`
                          inline-flex px-2 py-1 rounded-full text-xs font-medium
                          ${ciudad.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'}
                        `}>
                          {ciudad.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingCiudad ? 'Editar Ciudad' : 'Nueva Ciudad'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Define la ciudad y sus tarifas de transporte
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre de la ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ej: Antioquia"
                    />
                  </div>
                </div>

                {/* Tarifas de transporte */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-orange-600" />
                    <h3 className="font-medium text-slate-900">Tarifas de Transporte</h3>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    {TIPOS_CAMION.map(tipo => (
                      <div key={tipo.id} className="flex items-center gap-4">
                        <div className="w-32">
                          <span className="text-sm font-medium text-slate-700">{tipo.nombre}</span>
                          <span className="text-xs text-slate-500 block">{tipo.descripcion}</span>
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                          <input
                            type="text"
                            value={formatearInputMoneda(formData.tarifas[tipo.id])}
                            onChange={(e) => handleTarifaChange(tipo.id, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-right"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Deja en blanco los tipos de camión que no aplican para esta ciudad
                  </p>
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
