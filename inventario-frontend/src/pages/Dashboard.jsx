// ============================================
// PÁGINA: DASHBOARD
// Nivel 1: Vista principal de categorías padre
// ============================================

import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { 
  useGetCategoriasPadre,
  useDeleteCategoria 
} from '../hooks/Usecategorias'
import CategoriaPadreCard from '../components/cards/CategoriaPadreCard'
import CategoriaFormModal from '../components/forms/CategoriaFormModal'
import SubcategoriaFormModal from '../components/forms/SubcategoriaFormModal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

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
  
  // ============================================
  // HOOKS: Obtener datos
  // ============================================
  
  // Obtener categorías padre
  const { categoriasPadre, isLoading, error, refetch } = useGetCategoriasPadre()
  
  // Hook para eliminar
  const { deleteCategoria, isLoading: isDeleting } = useDeleteCategoria()
  
  // ============================================
  // STATE: Control de modales
  // ============================================
  
  // Estado para controlar qué modal está abierto
  const [modalState, setModalState] = useState({
    crear: false,
    editar: false,
    crearSubcategoria: false
  })
  
  // Categoría seleccionada para editar
  const [selectedCategoria, setSelectedCategoria] = useState(null)
  
  // ID de categoría padre para crear subcategoría
  const [parentCategoriaId, setParentCategoriaId] = useState(null)
  
  // ============================================
  // HANDLERS: Acciones de categorías
  // ============================================
  
  /**
   * Abrir modal de crear categoría
   */
  const handleOpenCrear = () => {
    setModalState({ ...modalState, crear: true })
  }
  
  /**
   * Cerrar todos los modales
   */
  const handleCloseModal = () => {
    setModalState({
      crear: false,
      editar: false,
      crearSubcategoria: false
    })
    setSelectedCategoria(null)
    setParentCategoriaId(null)
  }
  
  /**
   * Abrir modal de editar categoría
   */
  const handleEdit = (categoria) => {
    setSelectedCategoria(categoria)
    setModalState({ ...modalState, editar: true })
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
    setParentCategoriaId(categoriaId)
    setModalState({ ...modalState, crearSubcategoria: true })
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
          <div className="flex items-center justify-between">
            {/* Título */}
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Sistema de Inventario
                </h1>
                <p className="text-sm text-slate-600">
                  Gestiona tus categorías y elementos
                </p>
              </div>
            </div>
            
            {/* Botón de crear */}
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
      
      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="container mx-auto px-6 py-8">
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
        isOpen={modalState.crear}
        onClose={handleCloseModal}
        mode="crear"
        categoria={null}
      />
      
      {/* Modal: Editar categoría */}
      <CategoriaFormModal
        isOpen={modalState.editar}
        onClose={handleCloseModal}
        mode="editar"
        categoria={selectedCategoria}
      />
      
      {/* Modal: Crear subcategoría */}
      <SubcategoriaFormModal
        isOpen={modalState.crearSubcategoria}
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