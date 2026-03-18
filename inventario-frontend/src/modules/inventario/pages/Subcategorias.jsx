// ============================================
// PÁGINA: SUBCATEGORIAS
// Nivel 2: Vista de subcategorías de una categoría padre
// ============================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import { 
  useGetCategoria, 
  useGetSubcategorias 
} from '../hooks/useCategorias'
import SubcategoriaCard from '../components/cards/SubcategoriaCard'
import SubcategoriaFormModal from '../components/forms/SubcategoriaFormModal'
import Breadcrumb from '@shared/components/Breadcrum'
import Button from '@shared/components/Button'
import { IconoCategoria } from '@shared/components/IconoCategoria'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import { toast } from 'sonner'
import ElementoFormModal from '../components/forms/ElementoFormModal'

/**
 * PÁGINA: Subcategorias (Nivel 2)
 * 
 * ¿QUÉ HACE ESTA PÁGINA?
 * 
 * Muestra todas las subcategorías que pertenecen a UNA categoría padre.
 * 
 * EJEMPLO DE FLUJO:
 * 1. Usuario está en Dashboard (Nivel 1)
 * 2. Hace click en "Ver subcategorías" de "Carpas"
 * 3. React Router navega a: /categorias/1 (donde 1 es el ID de "Carpas")
 * 4. Esta página se monta y:
 *    - Lee el ID de la URL (useParams)
 *    - Carga los datos de la categoría padre
 *    - Carga todas las subcategorías de esa categoría
 *    - Muestra todo en un grid
 * 
 * ESTRUCTURA VISUAL:
 * 
 * ┌─────────────────────────────────────────┐
 * │ ← Volver | Inicio > 🏕️ Carpas          │  ← Breadcrumb
 * ├─────────────────────────────────────────┤
 * │ 🏕️ Carpas                  [+ Nueva]   │  ← Header
 * │ 3 subcategorías                         │
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │  ┌──────┐  ┌──────┐  ┌──────┐         │
 * │  │Card  │  │Card  │  │Card  │         │  ← Grid
 * │  │3x3   │  │5x5   │  │10x10 │         │
 * │  └──────┘  └──────┘  └──────┘         │
 * │                                         │
 * └─────────────────────────────────────────┘
 */
export default function Subcategorias() {
  
  // ============================================
  // HOOKS: React Router
  // ============================================
  
  /**
   * useParams() obtiene parámetros de la URL
   * 
   * Si la ruta es: /categorias/:categoriaId
   * Y la URL es: /categorias/5
   * Entonces: categoriaId = "5" (string)
   */
  const { categoriaId } = useParams()
  const navigate = useNavigate()
  
  // ============================================
  // HOOKS: Obtener datos
  // ============================================
  
  /**
   * Obtener información de la categoría padre
   * Necesitamos esto para:
   * - Mostrar el nombre en el header
   * - Mostrar el emoji
   * - Construir el breadcrumb
   */
  const { 
    categoria, 
    isLoading: loadingCategoria, 
    error: errorCategoria 
  } = useGetCategoria(categoriaId)
  
  /**
   * Obtener todas las subcategorías de esta categoría
   */
  const { 
    subcategorias, 
    isLoading: loadingSubcategorias, 
    error: errorSubcategorias 
  } = useGetSubcategorias(categoriaId)
  
  // Estados de carga combinados
  const isLoading = loadingCategoria || loadingSubcategorias
  const error = errorCategoria || errorSubcategorias
  
  // ============================================
  // STATE: Control de modales
  // ============================================
  
  const [modalState, setModalState] = useState({
    crear: false,
    editar: false,
    crearElemento: false
  })
  
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(null)
  const [subcategoriaIdForElement, setSubcategoriaIdForElement] = useState(null)
  
  // ============================================
  // HANDLERS: Modaes
  // ============================================
  
  /**
   * Abrir modal de crear subcategoría
   */
  const handleOpenCrear = () => {
    setModalState({ ...modalState, crear: true })
  }
  
  /**
   * Abrir modal de editar subcategoría
   */
  const handleEdit = (subcategoria) => {
    setSelectedSubcategoria(subcategoria)
    setModalState({ ...modalState, editar: true })
  }
  
  /// Abrir modal de crear elemento 
  const handleCreateElemento = (subcategoriaId) => {
    // Guardar el ID de la subcategoría seleccionada
    setSubcategoriaIdForElement(subcategoriaId)
    // Abrir modal de crear elemento
    setModalState({ ...modalState, crearElemento: true })
  }
  
  /**
   * Cerrar todos los modales
   */
  const handleCloseModal = () => {
    setModalState({
      crear: false,
      editar: false,
      crearElemento: false
    })
    setSelectedSubcategoria(null)
    setSubcategoriaIdForElement(null)
  }
  
  /**manejador de exito para ElementoFormModal
   * al hacer una simulacion, forzamos un re-render pidiendo las subcategorias de nuevo
   * luego lo cambiaremos ya que usamos react-query y este se encargara de actualizar la cache
   */
  const handleElementoSuccess = () => {
    // Por ahora solo mostramos un alert
    toast.success('Elemento creado exitosamente')
    setSubcategoriaIdForElement(null)
    // Aquí podríamos agregar lógica para refrescar la lista de elementos si es necesario
  }

  /**
   * Volver al Dashboard de Inventario
   */
  const handleGoBack = () => {
    navigate('/inventario')
  }
  
  // ============================================
  // RENDER: Estados de carga y error
  // ============================================
  
  // Estado de carga
  if (isLoading) {
    return (
      <Spinner 
        fullScreen 
        size="xl" 
        text="Cargando subcategorías..."
      />
    )
  }
  
  // Estado de error
  if (error || !categoria) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error al cargar la categoría
          </h2>
          <p className="text-slate-600 mb-6">
            {error?.message || 'La categoría no existe o no se pudo cargar'}
          </p>
          <Button onClick={handleGoBack}>
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }
  
  // ============================================
  // PREPARAR BREADCRUMB
  // ============================================
  
  const breadcrumbItems = [
    {
      label: 'Inventario',
      path: '/inventario',
      icon: '📦'
    },
    {
      label: categoria.nombre,
      path: `/inventario/categorias/${categoria.id}`,
      icon: categoria.emoji || '📦'
    }
  ]
  
  // ============================================
  // RENDER: Contenido principal
  // ============================================
  
  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* ============================================
          HEADER
          ============================================ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 lg:px-6 py-3 lg:py-4">
          {/* Breadcrumb */}
          <div className="mb-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Título con emoji en caja */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 rounded-[10px] flex items-center justify-center flex-shrink-0">
                <IconoCategoria value={categoria.emoji} className="text-2xl" size={24} />
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-slate-900">
                  {categoria.nombre}
                </h1>
                <p className="text-sm text-slate-500">
                  {subcategorias.length} subcategoría{subcategorias.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<Plus />}
              onClick={handleOpenCrear}
            >
              Nueva Subcategoría
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        
        {/* ============================================
            GRID DE SUBCATEGORÍAS
            ============================================ */}
        {subcategorias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {subcategorias.map((subcategoria) => (
              <SubcategoriaCard
                key={subcategoria.id}
                subcategoria={subcategoria}
                categoriaId={categoriaId}
                onEdit={handleEdit}
                onCreateElemento={handleCreateElemento}
              />
            ))}
          </div>
        ) : (
          /* ============================================
              ESTADO VACÍO: No hay subcategorías
              ============================================ */
          <EmptyState
            type="no-data"
            title="No hay subcategorías creadas"
            description={`Crea la primera subcategoría de "${categoria.nombre}" para organizar tus elementos`}
            icon={Package}
            action={{
              label: "Crear primera subcategoría",
              icon: <Plus />,
              onClick: handleOpenCrear
            }}
          />
        )}
      </div>
      
      {/* ============================================
          MODALES
          ============================================ */}
      
      {/* Modal: Crear subcategoría */}
      <SubcategoriaFormModal
        isOpen={modalState.crear}
        onClose={handleCloseModal}
        mode="crear"
        padreId={parseInt(categoriaId)}
      />
      
      {/* Modal: Editar subcategoría */}
      <SubcategoriaFormModal
        isOpen={modalState.editar}
        onClose={handleCloseModal}
        mode="editar"
        subcategoria={selectedSubcategoria}
      />
      
      {/* Modal: Crear elemento */}
      {/* solo se monta si subcategoriaIdForElement tiene valor y el modal esta abierto isOpen(true) */}
      {subcategoriaIdForElement && (
        <ElementoFormModal
          isOpen={modalState.crearElemento}
          onClose={handleCloseModal}
          //usamos el handler de exito para mostrar el toast minetras se implementa query
          onSuccess={handleElementoSuccess}
          subcategoriaId={subcategoriaIdForElement}
          elemento = {null} // Crear nuevo elemento
          />
        )}
    </div>
  )
}