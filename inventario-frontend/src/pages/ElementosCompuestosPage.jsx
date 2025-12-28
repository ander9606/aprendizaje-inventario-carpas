// ============================================
// PÁGINA: ELEMENTOS COMPUESTOS
// Gestión de plantillas de productos compuestos
// ============================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Layers,
  ArrowLeft,
  Package,
  Search,
  Filter,
  DollarSign,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Box,
  Link2,
  PlusCircle
} from 'lucide-react'

// Hooks
import { useGetCategoriasProductos } from '../hooks/UseCategoriasProductos'
import {
  useGetElementosCompuestos,
  useDeleteElementoCompuesto
} from '../hooks/UseElementosCompuestos'

// Componentes
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { Card } from '../components/common/Card'
import Badge from '../components/common/Badge'

// Modales (se crearán después)
import ElementoCompuestoFormModal from '../components/forms/ElementoCompuestoFormModal'
import CategoriaProductoFormModal from '../components/forms/CategoriaProductoFormModal'
import ComponentesModal from '../components/forms/ComponentesModal'

/**
 * Página ElementosCompuestosPage
 *
 * Gestiona las plantillas de productos compuestos:
 * - Lista por categorías (Carpas, Salas Lounge, etc.)
 * - CRUD de elementos compuestos
 * - Gestión de componentes (fijos, alternativas, adicionales)
 */
export default function ElementosCompuestosPage() {
  const navigate = useNavigate()

  // ============================================
  // HOOKS: Obtener datos
  // ============================================

  const {
    categorias,
    isLoading: loadingCategorias,
    error: errorCategorias,
    refetch: refetchCategorias
  } = useGetCategoriasProductos()

  const {
    elementos,
    isLoading: loadingElementos,
    error: errorElementos,
    refetch: refetchElementos
  } = useGetElementosCompuestos()

  const { deleteElemento, isLoading: isDeleting } = useDeleteElementoCompuesto()

  // ============================================
  // STATE
  // ============================================

  // Búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState(null)

  // Categorías expandidas (para el acordeón)
  const [expandedCategorias, setExpandedCategorias] = useState({})

  // Modales
  const [modalState, setModalState] = useState({
    crearCategoria: false,
    editarCategoria: false,
    crearElemento: false,
    editarElemento: false,
    verComponentes: false
  })

  // Datos seleccionados
  const [selectedElemento, setSelectedElemento] = useState(null)
  const [selectedCategoriaData, setSelectedCategoriaData] = useState(null)

  // ============================================
  // COMPUTED: Elementos agrupados por categoría
  // ============================================

  const elementosPorCategoria = useMemo(() => {
    const grupos = {}

    // Inicializar grupos con todas las categorías
    categorias.forEach(cat => {
      grupos[cat.id] = {
        categoria: cat,
        elementos: []
      }
    })

    // Agrupar elementos
    elementos.forEach(elem => {
      if (grupos[elem.categoria_id]) {
        grupos[elem.categoria_id].elementos.push(elem)
      }
    })

    return grupos
  }, [categorias, elementos])

  // ============================================
  // COMPUTED: Elementos filtrados
  // ============================================

  const elementosFiltrados = useMemo(() => {
    let resultado = { ...elementosPorCategoria }

    // Filtrar por categoría seleccionada
    if (selectedCategoria) {
      resultado = {
        [selectedCategoria]: resultado[selectedCategoria]
      }
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase()
      Object.keys(resultado).forEach(catId => {
        resultado[catId] = {
          ...resultado[catId],
          elementos: resultado[catId].elementos.filter(elem =>
            elem.nombre.toLowerCase().includes(termLower) ||
            elem.descripcion?.toLowerCase().includes(termLower)
          )
        }
      })
    }

    return resultado
  }, [elementosPorCategoria, selectedCategoria, searchTerm])

  // ============================================
  // HANDLERS
  // ============================================

  const toggleCategoria = (categoriaId) => {
    setExpandedCategorias(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }))
  }

  const handleCloseModal = () => {
    setModalState({
      crearCategoria: false,
      editarCategoria: false,
      crearElemento: false,
      editarElemento: false,
      verComponentes: false
    })
    setSelectedElemento(null)
    setSelectedCategoriaData(null)
  }

  const handleCrearElemento = (categoriaId = null) => {
    setSelectedCategoriaData(categoriaId ? { id: categoriaId } : null)
    setModalState({ ...modalState, crearElemento: true })
  }

  const handleEditarElemento = (elemento) => {
    setSelectedElemento(elemento)
    setModalState({ ...modalState, editarElemento: true })
  }

  const handleVerComponentes = (elemento) => {
    setSelectedElemento(elemento)
    setModalState({ ...modalState, verComponentes: true })
  }

  const handleEliminarElemento = async (elemento) => {
    if (window.confirm(`¿Eliminar "${elemento.nombre}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteElemento(elemento.id)
        refetchElementos()
      } catch (error) {
        console.error('Error al eliminar:', error)
        alert('No se pudo eliminar el elemento')
      }
    }
  }

  const handleCrearCategoria = () => {
    setModalState({ ...modalState, crearCategoria: true })
  }

  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (loadingCategorias || loadingElementos) {
    return (
      <Spinner
        fullScreen
        size="xl"
        text="Cargando elementos compuestos..."
      />
    )
  }

  if (errorCategorias || errorElementos) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">Error</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar datos
          </h2>
          <p className="text-slate-600 mb-6">
            {errorCategorias?.message || errorElementos?.message}
          </p>
          <Button onClick={() => {
            refetchCategorias()
            refetchElementos()
          }}>
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
          HEADER
          ============================================ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Título y navegación */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate('/')}
              >
                Inicio
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Layers className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Elementos Compuestos
                  </h1>
                  <p className="text-sm text-slate-600">
                    Plantillas de productos para alquiler
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleCrearCategoria}
              >
                Nueva Categoría
              </Button>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => handleCrearElemento()}
              >
                Nuevo Elemento
              </Button>
            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="mt-4 flex items-center gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar elementos compuestos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={selectedCategoria || ''}
                onChange={(e) => setSelectedCategoria(e.target.value || null)}
                className="px-4 py-2 border border-slate-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="container mx-auto px-6 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{elementos.length}</p>
                <p className="text-sm text-slate-600">Elementos Compuestos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{categorias.length}</p>
                <p className="text-sm text-slate-600">Categorías</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ${elementos.reduce((sum, e) => sum + (e.precio_base || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">Valor total en catálogo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista por categorías */}
        {categorias.length === 0 ? (
          <EmptyState
            type="no-data"
            title="No hay categorías de productos"
            description="Crea tu primera categoría para comenzar a agregar elementos compuestos"
            icon={Layers}
            action={{
              label: "Crear primera categoría",
              icon: <Plus />,
              onClick: handleCrearCategoria
            }}
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(elementosFiltrados).map(([catId, grupo]) => {
              if (!grupo.categoria) return null

              const isExpanded = expandedCategorias[catId] !== false // Por defecto expandido
              const elementosCount = grupo.elementos.length

              return (
                <div
                  key={catId}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  {/* Header de categoría */}
                  <div
                    onClick={() => toggleCategoria(catId)}
                    className="flex items-center justify-between px-6 py-4 cursor-pointer
                             hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="text-2xl">{grupo.categoria.emoji || '📦'}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {grupo.categoria.nombre}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {elementosCount} elemento{elementosCount !== 1 ? 's' : ''} compuesto{elementosCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCrearElemento(catId)
                      }}
                    >
                      Agregar
                    </Button>
                  </div>

                  {/* Lista de elementos (colapsable) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      {elementosCount === 0 ? (
                        <div className="px-6 py-8 text-center">
                          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">
                            No hay elementos en esta categoría
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => handleCrearElemento(catId)}
                          >
                            Crear primer elemento
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {grupo.elementos.map(elemento => (
                            <ElementoCompuestoItem
                              key={elemento.id}
                              elemento={elemento}
                              onEdit={() => handleEditarElemento(elemento)}
                              onDelete={() => handleEliminarElemento(elemento)}
                              onViewComponents={() => handleVerComponentes(elemento)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ============================================
          MODALES
          ============================================ */}

      {/* Modal: Crear categoría */}
      <CategoriaProductoFormModal
        isOpen={modalState.crearCategoria}
        onClose={handleCloseModal}
        mode="crear"
        onSuccess={() => {
          refetchCategorias()
          handleCloseModal()
        }}
      />

      {/* Modal: Crear elemento */}
      <ElementoCompuestoFormModal
        isOpen={modalState.crearElemento}
        onClose={handleCloseModal}
        mode="crear"
        categorias={categorias}
        categoriaPreseleccionada={selectedCategoriaData?.id}
        onSuccess={() => {
          refetchElementos()
          handleCloseModal()
        }}
      />

      {/* Modal: Editar elemento */}
      <ElementoCompuestoFormModal
        isOpen={modalState.editarElemento}
        onClose={handleCloseModal}
        mode="editar"
        elemento={selectedElemento}
        categorias={categorias}
        onSuccess={() => {
          refetchElementos()
          handleCloseModal()
        }}
      />

      {/* Modal: Ver/Editar componentes */}
      <ComponentesModal
        isOpen={modalState.verComponentes}
        onClose={handleCloseModal}
        elemento={selectedElemento}
        onSuccess={() => {
          refetchElementos()
        }}
      />

      {/* Indicador de eliminación */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            Eliminando elemento...
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE: ElementoCompuestoItem
// Item individual de un elemento compuesto
// ============================================

function ElementoCompuestoItem({ elemento, onEdit, onDelete, onViewComponents }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
      {/* Info del elemento */}
      <div className="flex items-center gap-4 flex-1">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Layers className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate">
            {elemento.nombre}
          </h4>
          {elemento.descripcion && (
            <p className="text-sm text-slate-500 truncate">
              {elemento.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Precio y badges */}
      <div className="flex items-center gap-4">
        {/* Precio base */}
        <div className="text-right">
          <p className="font-semibold text-slate-900">
            ${(elemento.precio_base || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">Precio base</p>
        </div>

        {/* Contador de componentes */}
        {elemento.componentes_count !== undefined && (
          <Badge variant="secondary" size="sm">
            <Link2 className="w-3 h-3 mr-1" />
            {elemento.componentes_count} componentes
          </Badge>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            onClick={onViewComponents}
            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Ver componentes"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
