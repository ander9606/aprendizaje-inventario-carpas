// ============================================
// PÁGINA: ELEMENTOS COMPUESTOS
// Gestión de plantillas de productos para alquiler
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Tent,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Package,
  Layers,
  DollarSign,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

// Hooks
import { useGetCategoriasProductos } from '../hooks/UseCategoriasProductos'
import {
  useGetElementosCompuestos,
  useDeleteElementoCompuesto
} from '../hooks/UseElementosCompuestos'

// Componentes comunes
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'

/**
 * ElementosCompuestosPage
 *
 * Página principal para gestionar elementos compuestos (plantillas de alquiler).
 * Muestra elementos agrupados por categoría con opciones de crear, editar y eliminar.
 */
function ElementosCompuestosPage() {
  const navigate = useNavigate()

  // ============================================
  // ESTADOS
  // ============================================
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [expandedCategorias, setExpandedCategorias] = useState({})
  const [showFormModal, setShowFormModal] = useState(false)
  const [elementoToEdit, setElementoToEdit] = useState(null)
  const [elementoToDelete, setElementoToDelete] = useState(null)
  const [elementoToView, setElementoToView] = useState(null)

  // ============================================
  // HOOKS DE DATOS
  // ============================================
  const { categorias, isLoading: loadingCategorias } = useGetCategoriasProductos()
  const { elementos, isLoading: loadingElementos, refetch } = useGetElementosCompuestos()
  const { deleteElemento, isPending: isDeleting } = useDeleteElementoCompuesto()

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  // Agrupar elementos por categoría
  const elementosPorCategoria = elementos.reduce((acc, elemento) => {
    const catId = elemento.categoria_id || 'sin-categoria'
    if (!acc[catId]) {
      acc[catId] = []
    }
    acc[catId].push(elemento)
    return acc
  }, {})

  // Filtrar elementos
  const filtrarElementos = (lista) => {
    if (!searchTerm) return lista
    return lista.filter(el =>
      el.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Toggle categoría expandida
  const toggleCategoria = (catId) => {
    setExpandedCategorias(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  // Formatear precio
  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio || 0)
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleCrear = () => {
    setElementoToEdit(null)
    setShowFormModal(true)
  }

  const handleEditar = (elemento) => {
    setElementoToEdit(elemento)
    setShowFormModal(true)
  }

  const handleVer = (elemento) => {
    setElementoToView(elemento)
  }

  const handleEliminar = async () => {
    if (!elementoToDelete) return

    try {
      await deleteElemento(elementoToDelete.id)
      toast.success('Elemento compuesto eliminado exitosamente')
      setElementoToDelete(null)
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al eliminar')
    }
  }

  const handleFormSuccess = () => {
    setShowFormModal(false)
    setElementoToEdit(null)
    refetch()
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  const isLoading = loadingCategorias || loadingElementos

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/productos')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Productos</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Tent className="w-8 h-8 text-emerald-600" />
                Elementos Compuestos
              </h1>
              <p className="text-slate-600 mt-1">
                Plantillas de productos para cotizar y alquilar
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleCrear}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Plantilla
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="w-full md:w-64">
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando elementos...</p>
          </div>
        )}

        {/* Lista vacía */}
        {!isLoading && elementos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Tent className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No hay elementos compuestos
            </h3>
            <p className="text-slate-600 mb-6">
              Crea tu primera plantilla de producto para empezar a cotizar
            </p>
            <Button variant="primary" onClick={handleCrear}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Plantilla
            </Button>
          </div>
        )}

        {/* Lista de elementos por categoría */}
        {!isLoading && elementos.length > 0 && (
          <div className="space-y-4">
            {categorias
              .filter(cat => !selectedCategoria || cat.id === parseInt(selectedCategoria))
              .map(categoria => {
                const elementosDeCategoria = filtrarElementos(elementosPorCategoria[categoria.id] || [])
                if (elementosDeCategoria.length === 0) return null

                const isExpanded = expandedCategorias[categoria.id] !== false

                return (
                  <div
                    key={categoria.id}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
                  >
                    {/* Header de categoría */}
                    <button
                      onClick={() => toggleCategoria(categoria.id)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        )}
                        <Layers className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-slate-900">
                          {categoria.nombre}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({elementosDeCategoria.length})
                        </span>
                      </div>
                    </button>

                    {/* Lista de elementos */}
                    {isExpanded && (
                      <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {elementosDeCategoria.map(elemento => (
                          <ElementoCompuestoCard
                            key={elemento.id}
                            elemento={elemento}
                            onVer={() => handleVer(elemento)}
                            onEditar={() => handleEditar(elemento)}
                            onEliminar={() => setElementoToDelete(elemento)}
                            formatPrecio={formatPrecio}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

            {/* Elementos sin categoría */}
            {elementosPorCategoria['sin-categoria']?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50">
                  <span className="font-medium text-slate-900">Sin categoría</span>
                </div>
                <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filtrarElementos(elementosPorCategoria['sin-categoria']).map(elemento => (
                    <ElementoCompuestoCard
                      key={elemento.id}
                      elemento={elemento}
                      onVer={() => handleVer(elemento)}
                      onEditar={() => handleEditar(elemento)}
                      onEliminar={() => setElementoToDelete(elemento)}
                      formatPrecio={formatPrecio}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={!!elementoToDelete}
          onClose={() => setElementoToDelete(null)}
          title="Eliminar Elemento Compuesto"
          size="sm"
        >
          <div className="p-4">
            <p className="text-slate-600 mb-4">
              ¿Estás seguro de eliminar <strong>{elementoToDelete?.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setElementoToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleEliminar}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de vista detallada */}
        <Modal
          isOpen={!!elementoToView}
          onClose={() => setElementoToView(null)}
          title={elementoToView?.nombre || 'Detalle'}
          size="lg"
        >
          {elementoToView && (
            <ElementoCompuestoDetalle
              elemento={elementoToView}
              formatPrecio={formatPrecio}
            />
          )}
        </Modal>

        {/* TODO: Modal de formulario (multi-paso) */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-xl font-bold mb-4">
                {elementoToEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <p className="text-slate-600 mb-4">
                El formulario multi-paso se implementará a continuación.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowFormModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE: Tarjeta de Elemento Compuesto
// ============================================

function ElementoCompuestoCard({ elemento, onVer, onEditar, onEliminar, formatPrecio }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-slate-900">{elemento.nombre}</h3>
          {elemento.codigo && (
            <span className="text-sm text-slate-500">Código: {elemento.codigo}</span>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          elemento.activo !== false
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-600'
        }`}>
          {elemento.activo !== false ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4" />
          <span>{elemento.total_componentes || 0} componentes</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <DollarSign className="w-4 h-4" />
          <span>Base: {formatPrecio(elemento.precio_base)}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={onVer}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Ver detalle"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onEditar}
          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onEliminar}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE: Detalle de Elemento Compuesto
// ============================================

function ElementoCompuestoDetalle({ elemento, formatPrecio }) {
  return (
    <div className="p-4">
      <div className="grid gap-4">
        {/* Info básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">Código</label>
            <p className="font-medium">{elemento.codigo || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-slate-500">Precio Base</label>
            <p className="font-medium text-emerald-600">{formatPrecio(elemento.precio_base)}</p>
          </div>
          <div>
            <label className="text-sm text-slate-500">Depósito</label>
            <p className="font-medium">{formatPrecio(elemento.deposito)}</p>
          </div>
          <div>
            <label className="text-sm text-slate-500">Estado</label>
            <p className="font-medium">
              {elemento.activo !== false ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>

        {/* Descripción */}
        {elemento.descripcion && (
          <div>
            <label className="text-sm text-slate-500">Descripción</label>
            <p className="text-slate-700">{elemento.descripcion}</p>
          </div>
        )}

        {/* Placeholder para componentes */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-500 text-center">
            La vista de componentes (fijos, alternativas, adicionales) se mostrará aquí
          </p>
        </div>
      </div>
    </div>
  )
}

export default ElementosCompuestosPage
