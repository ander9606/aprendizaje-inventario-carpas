// ============================================
// PÁGINA: TARIFAS DE TRANSPORTE
// Gestión de tarifas por ciudad y tipo de camión
// ============================================

import { useState } from 'react'
import { Plus, Truck, ArrowLeft, Pencil, Trash2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetTarifasTransporte,
  useDeleteTarifa
} from '../hooks/UseTarifasTransporte'
import { CATEGORIAS_CAMION } from '../api/apiTarifasTransporte'
import TarifaFormModal from '../components/forms/TarifaFormModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

/**
 * Página TarifasTransportePage
 */
export default function TarifasTransportePage() {

  const navigate = useNavigate()

  // ============================================
  // HOOKS: Obtener datos
  // ============================================

  const { tarifas, isLoading, error, refetch } = useGetTarifasTransporte()
  const { mutateAsync: deleteTarifa, isLoading: isDeleting } = useDeleteTarifa()

  // ============================================
  // STATE
  // ============================================

  const [modalState, setModalState] = useState({
    crear: false,
    editar: false
  })
  const [selectedTarifa, setSelectedTarifa] = useState(null)
  const [filtros, setFiltros] = useState({
    ciudad: '',
    tipoCamion: ''
  })

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrear = () => {
    setModalState({ crear: true, editar: false })
  }

  const handleCloseModal = () => {
    setModalState({ crear: false, editar: false })
    setSelectedTarifa(null)
  }

  const handleEdit = (tarifa) => {
    setSelectedTarifa(tarifa)
    setModalState({ crear: false, editar: true })
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tarifa?')) return
    try {
      await deleteTarifa(id)
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error.response?.data?.message || 'Error al eliminar la tarifa')
    }
  }

  const handleVolver = () => {
    navigate('/configuracion')
  }

  // ============================================
  // FILTROS
  // ============================================

  const ciudadesUnicas = [...new Set(tarifas.map(t => t.ciudad))].sort()

  const tarifasFiltradas = tarifas.filter(t => {
    if (filtros.ciudad && t.ciudad !== filtros.ciudad) return false
    if (filtros.tipoCamion && t.tipo_camion !== filtros.tipoCamion) return false
    return true
  })

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (isLoading) {
    return (
      <Spinner
        fullScreen
        size="xl"
        text="Cargando tarifas..."
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar tarifas
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
                <Truck className="w-8 h-8 text-orange-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Tarifas de Transporte
                  </h1>
                  <p className="text-sm text-slate-600">
                    Precios por ciudad y tipo de camión
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={<Plus />}
              onClick={handleOpenCrear}
            >
              Nueva Tarifa
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container mx-auto px-6 py-8">

        {/* FILTROS */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filtrar:</span>
            </div>

            <select
              value={filtros.ciudad}
              onChange={(e) => setFiltros({ ...filtros, ciudad: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Todas las ciudades</option>
              {ciudadesUnicas.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>

            <select
              value={filtros.tipoCamion}
              onChange={(e) => setFiltros({ ...filtros, tipoCamion: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Todos los camiones</option>
              {CATEGORIAS_CAMION.map(cat => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </select>

            {(filtros.ciudad || filtros.tipoCamion) && (
              <button
                onClick={() => setFiltros({ ciudad: '', tipoCamion: '' })}
                className="text-sm text-blue-600 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-slate-600">
            {tarifasFiltradas.length} tarifa{tarifasFiltradas.length !== 1 ? 's' : ''}
            {filtros.ciudad || filtros.tipoCamion ? ' encontrada' : ''}
            {tarifasFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* TABLA DE TARIFAS */}
        {tarifasFiltradas.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                    Ciudad
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                    Tipo de Camión
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-slate-700">
                    Precio
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-slate-700">
                    Estado
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-slate-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tarifasFiltradas.map((tarifa) => (
                  <tr key={tarifa.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {tarifa.ciudad}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="w-4 h-4" />
                        {tarifa.tipo_camion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold text-right">
                      {formatearMoneda(tarifa.precio)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`
                        inline-flex px-2 py-1 rounded-full text-xs font-medium
                        ${tarifa.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'}
                      `}>
                        {tarifa.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(tarifa)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tarifa.id)}
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
        ) : (
          <EmptyState
            type="no-data"
            title="No hay tarifas registradas"
            description="Crea tu primera tarifa de transporte"
            icon={Truck}
            action={{
              label: "Crear primera tarifa",
              icon: <Plus />,
              onClick: handleOpenCrear
            }}
          />
        )}
      </div>

      {/* MODALES */}
      <TarifaFormModal
        isOpen={modalState.crear}
        onClose={handleCloseModal}
        mode="crear"
        tarifa={null}
      />

      <TarifaFormModal
        isOpen={modalState.editar}
        onClose={handleCloseModal}
        mode="editar"
        tarifa={selectedTarifa}
      />

      {/* Indicador de carga al eliminar */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            Eliminando tarifa...
          </span>
        </div>
      )}
    </div>
  )
}
