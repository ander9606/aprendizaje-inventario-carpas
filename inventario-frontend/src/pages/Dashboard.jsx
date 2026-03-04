// ============================================
// PÁGINA: DASHBOARD
// Nivel 1: Vista principal de categorías padre
// ============================================

import { useState, useMemo } from 'react'
import { Plus, Package, Search, X, Layers, ChevronRight, BarChart3, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '@shared/hooks/useNavigation'  
import {
  useGetCategoriasPadre,
  useDeleteCategoria
} from '@inventario/hooks/useCategorias'
import { useGetTodosElementos } from '@inventario/hooks/useElementos'
import CategoriaPadreCard from '@inventario/components/cards/CategoriaPadreCard'
import CategoriaFormModal from '@inventario/components/forms/CategoriaFormModal'
import SubcategoriaFormModal from '@inventario/components/forms/SubcategoriaFormModal'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import InventarioListView from '@inventario/components/InventarioListView'
import { IconoCategoria } from '@shared/components/IconoCategoria'
import ViewTabs from '@shared/components/ViewTabs'
import { exportarInventarioExcel } from '@inventario/api/apiExport'
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

  // Vista activa (categorías o listado)
  const [viewMode, setViewMode] = useState('categorias')

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
      toast.error('No se pudo eliminar la categoría. Verifica que no tenga subcategorías.')
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
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          {/* Back link */}
          <button
            onClick={volverAModulos}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-3 transition-colors"
          >
            &larr; Volver a Módulos
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Título + toggle */}
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-[22px] font-bold text-slate-900">
                  Inventario Individual
                </h1>
                <p className="text-sm text-slate-500">
                  Gestiona tus categorías y elementos
                </p>
              </div>
              <div className="ml-4 hidden sm:block">
                <ViewTabs
                  tabs={[
                    { label: 'Categorías', value: 'categorias' },
                    { label: 'Listado', value: 'listado' }
                  ]}
                  activeTab={viewMode}
                  onChange={setViewMode}
                />
              </div>
            </div>

            {/* Botones de acciones */}
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <Button
                variant="outline-light"
                size="sm"
                icon={<FileSpreadsheet />}
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Excel'}</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<BarChart3 />}
                onClick={() => navigate('/inventario/dashboard')}
              >
                <span className="hidden sm:inline">Dashboard</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<Plus />}
                onClick={handleOpenCrear}
              >
                Nueva Categoría
              </Button>
            </div>
          </div>

          {/* ViewTabs mobile */}
          <div className="mt-3 sm:hidden">
            <ViewTabs
              tabs={[
                { label: 'Categorías', value: 'categorias' },
                { label: 'Listado', value: 'listado' }
              ]}
              activeTab={viewMode}
              onChange={setViewMode}
            />
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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar categorías o elementos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowSearchResults(e.target.value.length >= 2)
              }}
              onFocus={() => searchTerm.length >= 2 && setShowSearchResults(true)}
              className="w-full pl-12 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-3">
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

        {/* ============================================
            CONTENIDO: CATEGORÍAS O LISTADO
            ============================================ */}
        {viewMode === 'categorias' ? (
          <>
            {/* Título de sección */}
            <div className="mb-6">
              <p className="text-slate-600">
                {categoriasPadre.length} categoría{categoriasPadre.length !== 1 ? 's' : ''} registrada{categoriasPadre.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Grid de categorías (2 columnas) */}
            {categoriasPadre.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          </>
        ) : (
          /* Vista listado */
          <InventarioListView
            elementos={todosElementos}
            isLoading={loadingElementos}
            onGoToElemento={handleGoToElemento}
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