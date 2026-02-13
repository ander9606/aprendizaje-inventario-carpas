// ============================================
// PÁGINA: DASHBOARD
// Nivel 1: Vista principal de categorías padre
// ============================================

import { useState, useMemo } from 'react'
import { Plus, Package, ArrowLeft, Search, X, Layers, ChevronRight, BarChart3, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../hooks/UseNavigation'  
import {
  useGetCategoriasPadre,
  useDeleteCategoria
} from '../hooks/Usecategorias'
import { useGetTodosElementos } from '../hooks/Useelementos'
import CategoriaPadreCard from '../components/cards/CategoriaPadreCard'
import CategoriaFormModal from '../components/forms/CategoriaFormModal'
import SubcategoriaFormModal from '../components/forms/SubcategoriaFormModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { IconoCategoria } from '../components/common/IconoCategoria'
import { exportarInventarioExcel } from '../api/apiExport'
import { toast } from 'sonner'


/**
 * Página Dashboard - Nivel 1
 * 
 * Muestra todas las categorías padre en un grid
 * 
 * FUNCIONALIDADES:
 * - Ver todas las categorías padre
 * - Crear nueva categoría
 * - Editar categoría existente
 * - Eliminar categoría
 * - Crear subcategoría desde la card
 * 
 * ESTRUCTURA:
 * ┌─────────────────────────────────────────┐
 * │ 📦 Sistema de Inventario    [+ Crear]  │  ← Header
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │  ┌─────┐  ┌─────┐  ┌─────┐            │
 * │  │Card │  │Card │  │Card │            │  ← Grid de Cards
 * │  └─────┘  └─────┘  └─────┘            │
 * │                                         │
 * └─────────────────────────────────────────┘
 */
export default function Dashboard() {

  const navigate = useNavigate()
  const { volverAModulos } = useNavigation()

  // ============================================
  // HOOKS: Obtener datos
  // ============================================

  // Obtener categorías padre
  const { categoriasPadre, isLoading, error, refetch } = useGetCategoriasPadre()

  // Obtener todos los elementos para búsqueda
  const { elementos: todosElementos, isLoading: loadingElementos } = useGetTodosElementos()

  // Hook para eliminar
  const { deleteCategoria, isLoading: isDeleting } = useDeleteCategoria()

  // ============================================
  // STATE: Control de modales y búsqueda
  // ============================================

  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Estado para controlar qué modal está abierto
  const [modalActivo, setModalActivo] = useState(null)

  // Categoría seleccionada para editar
  const [selectedCategoria, setSelectedCategoria] = useState(null)

  // ID de categoría padre para crear subcategoría
  const [parentCategoriaId, setParentCategoriaId] = useState(null)

  // Estado para exportar Excel
  const [isExporting, setIsExporting] = useState(false)

  // ============================================
  // BÚSQUEDA: Filtrar categorías y elementos
  // ============================================

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      return { categorias: [], elementos: [] }
    }

    const term = searchTerm.toLowerCase().trim()

    // Buscar en categorías (padre y subcategorías)
    const categoriasEncontradas = categoriasPadre.filter(cat =>
      cat.nombre.toLowerCase().includes(term) ||


      cat.subcategorias?.some(sub => sub.nombre.toLowerCase().includes(term))
    )

    // Buscar en elementos
    const elementosEncontrados = todosElementos.filter(el =>
      el.nombre.toLowerCase().includes(term) ||
      el.descripcion?.toLowerCase().includes(term)
    ).slice(0, 10) // Limitar a 10 resultados

    return {
      categorias: categoriasEncontradas,
      elementos: elementosEncontrados
    }
  }, [searchTerm, categoriasPadre, todosElementos])

  const hasSearchResults = searchResults.categorias.length > 0 || searchResults.elementos.length > 0

  // Navegar a la página de elementos (donde están las tarjetas)
  const handleGoToElemento = (elemento) => {
    navigate(`/inventario/categorias/${elemento.categoria_padre_id}/subcategorias/${elemento.categoria_id}/elementos`)
    setSearchTerm('')
    setShowSearchResults(false)
  }

  // Navegar a una categoría
  const handleGoToCategoria = (categoria) => {
    navigate(`/inventario/categorias/${categoria.id}`)
    setSearchTerm('')
    setShowSearchResults(false)
  }

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
    setShowSearchResults(false)
  }
  
  // ============================================
  // HANDLER: Exportar Excel
  // ============================================
  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      await exportarInventarioExcel()
      toast.success('Inventario exportado a Excel exitosamente')
    } catch (error) {
      toast.error('Error al exportar: ' + (error.message || 'Intenta de nuevo'))
    } finally {
      setIsExporting(false)
    }
  }

  // ============================================
  // HANDLERS: Acciones de categorías
  // ============================================
  
  /**
   * Abrir modal de crear categoría
   */
  const handleOpenCrear = () => {
    setSelectedCategoria(null)
    setParentCategoriaId(null)
    setModalActivo('crear')
  }
  
  /**
   * Cerrar todos los modales
   */
  const handleCloseModal = () => {
    setModalActivo(null)
    setSelectedCategoria(null)
    setParentCategoriaId(null)
  }
  
  /**
   * Abrir modal de editar categoría
   */
  const handleEdit = (categoria) => {
    setSelectedCategoria(categoria)
    setParentCategoriaId(null)
    setModalActivo('editar')
  }
  
  /**
   * Eliminar categoría
   */
  const handleDelete = async (id) => {
    try {
      await deleteCategoria(id)
      // React Query automáticamente recarga las categorías
      // gracias a queryClient.invalidateQueries en el hook
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('No se pudo eliminar la categoría. Verifica que no tenga subcategorías.')
    }
  }
  
  /**
   * Abrir modal de crear subcategoría
   */
  const handleCreateSubcategoria = (categoriaId) => {
    setSelectedCategoria(null)
    setParentCategoriaId(categoriaId)
    setModalActivo('subcategoria')
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
        text="Cargando categorías..."
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
            Error al cargar categorías
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
          {/* Navegación superior */}
          <button
            onClick={volverAModulos}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Módulos</span>
          </button>

          <div className="flex items-center justify-between">
            {/* Título */}
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Inventario Individual
                </h1>
                <p className="text-sm text-slate-600">
                  Gestiona tus categorías y elementos
                </p>
              </div>
            </div>

            {/* Botones de acciones */}
            <div className="flex gap-3">
              {/* Botón: Exportar Excel */}
              <Button
                variant="secondary"
                icon={<FileSpreadsheet />}
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                {isExporting ? 'Exportando...' : 'Excel'}
              </Button>

              {/* Botón: Dashboard de inventario */}
              <Button
                variant="secondary"
                icon={<BarChart3 />}
                onClick={() => navigate('/inventario/dashboard')}
              >
                Dashboard
              </Button>

              {/* Botón: Crear categoría */}
              <Button
                variant="primary"
                icon={<Plus />}
                onClick={handleOpenCrear}
              >
                Nueva Categoría
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="container mx-auto px-6 py-8">

        {/* ============================================
            BUSCADOR GLOBAL
            ============================================ */}
        <div className="mb-6 relative">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar categorías o elementos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSearchResults(e.target.value.length >= 2)
                }}
                onFocus={() => searchTerm.length >= 2 && setShowSearchResults(true)}
                className="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {showSearchResults && searchTerm.length >= 2 && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                {loadingElementos ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="sm" />
                    <span className="ml-2 text-slate-600">Buscando...</span>
                  </div>
                ) : hasSearchResults ? (
                  <div className="space-y-4">
                    {/* Categorías encontradas */}
                    {searchResults.categorias.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Categorías ({searchResults.categorias.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.categorias.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => handleGoToCategoria(cat)}
                              className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
                            >
                              <IconoCategoria value={cat.emoji} className="text-2xl" size={28} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">{cat.nombre}</p>
                                <p className="text-sm text-slate-500">
                                  {cat.subcategorias?.length || 0} subcategorías
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Elementos encontrados */}
                    {searchResults.elementos.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Elementos ({searchResults.elementos.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.elementos.map(el => (
                            <button
                              key={el.id}
                              onClick={() => handleGoToElemento(el)}
                              className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Layers className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">{el.nombre}</p>
                                <p className="text-sm text-slate-500 truncate">
                                  {el.categoria_padre_nombre || 'Sin categoría'} → {el.categoria_nombre || 'Sin subcategoría'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  el.requiere_series
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {el.requiere_series ? 'Series' : 'Cantidad'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No se encontraron resultados para "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Título de sección */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            🏷️ Categorías Principales
          </h2>
          <p className="text-slate-600">
            {categoriasPadre.length} categoría{categoriasPadre.length !== 1 ? 's' : ''} registrada{categoriasPadre.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* ============================================
            GRID DE CATEGORÍAS
            ============================================ */}
        {categoriasPadre.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoriasPadre.map((categoria) => (
              <CategoriaPadreCard
                key={categoria.id}
                categoria={categoria}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateSubcategoria={handleCreateSubcategoria}
              />
            ))}
          </div>
        ) : (
          /* ============================================
              ESTADO VACÍO: No hay categorías
              ============================================ */
          <EmptyState
            type="no-data"
            title="No hay categorías creadas"
            description="Crea tu primera categoría para comenzar a organizar tu inventario"
            icon={Package}
            action={{
              label: "Crear primera categoría",
              icon: <Plus />,
              onClick: handleOpenCrear
            }}
          />
        )}
      </div>
      
      {/* ============================================
          MODALES
          ============================================ */}
      
      {/* Modal: Crear categoría padre */}
      <CategoriaFormModal
        isOpen={modalActivo === 'crear'}
        onClose={handleCloseModal}
        mode="crear"
        categoria={null}
      />
      
      {/* Modal: Editar categoría */}
      <CategoriaFormModal
        isOpen={modalActivo === 'editar'}
        onClose={handleCloseModal}
        mode="editar"
        categoria={selectedCategoria}
      />
      
      {/* Modal: Crear subcategoría */}
      <SubcategoriaFormModal
        isOpen={modalActivo === 'subcategoria'}
        onClose={handleCloseModal}
        mode="crear"
        padreId={parentCategoriaId}
      />
      
      {/* Indicador de carga al eliminar */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">
            Eliminando categoría...
          </span>
        </div>
      )}
    </div>
  )
}