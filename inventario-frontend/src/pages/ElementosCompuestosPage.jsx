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
  ArrowLeft,
  Layers,
  FolderOpen,
  Folder,
} from 'lucide-react'

// Hooks
import {
  useGetCategoriasProductosArbol,
  useDeleteCategoriaProducto,
} from '../hooks/UseCategoriasProductos'

import {
  useGetElementosCompuestos,
  useDeleteElementoCompuesto,
} from '../hooks/UseElementosCompuestos'

// Componentes comunes
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Breadcrumb from '../components/common/Breadcrum'
import ElementoCompuestoFormModal from '../components/forms/ElementoCompuestoFormModal'
import CategoriaProductoFormModal from '../components/forms/CategoriaProductoFormModal'

// Componentes de tarjetas
import ElementoCompuestoCard from '../components/cards/ElementoCompuestoCard'
import ElementoCompuestoDetalle from '../components/cards/ElementoCompuestoDetalle'
import ProductCategoriaPadreCard from '../components/cards/ProductCategoriaPadreCard'
import ProductSubcategoriaCard from '../components/cards/ProductSubcategoriaCard'

/**
 * ElementosCompuestosPage
 *
 * Navegación jerárquica:
 * 1. Vista inicial: Categorías padre (Carpas, Parasoles, etc.)
 * 2. Al seleccionar padre: Ver subcategorías (P10, P14, etc.)
 * 3. Al seleccionar subcategoría: Ver plantillas/productos
 */
function ElementosCompuestosPage() {
  const navigate = useNavigate()

  // ============================================
  // ESTADOS DE NAVEGACIÓN
  // ============================================
  const [selectedCategoriaPadre, setSelectedCategoriaPadre] = useState(null)
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Estados de modales
  const [showFormModal, setShowFormModal] = useState(false)
  const [elementoToEdit, setElementoToEdit] = useState(null)
  const [elementoToDelete, setElementoToDelete] = useState(null)
  const [elementoToView, setElementoToView] = useState(null)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [categoriaToEdit, setCategoriaToEdit] = useState(null)
  const [categoriaPadreIdParaCrear, setCategoriaPadreIdParaCrear] =
    useState(null)

  // ============================================
  // HOOKS DE DATOS
  // ============================================
  const {
    categorias: categoriasArbol,
    isLoading: loadingCategorias,
    refetch: refetchCategorias,
  } = useGetCategoriasProductosArbol()

  const {
    elementos,
    isLoading: loadingElementos,
    refetch,
  } = useGetElementosCompuestos()

  const { deleteElemento, isPending: isDeleting } = useDeleteElementoCompuesto()
  const { deleteCategoria } = useDeleteCategoriaProducto()

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  // Contar elementos por categoría
  const contarElementosPorCategoria = (categoriaId) => {
    return elementos.filter((el) => el.categoria_id === categoriaId).length
  }

  // Obtener elementos de una categoría
  const getElementosDeCategoria = (categoriaId) => {
    let lista = elementos.filter((el) => el.categoria_id === categoriaId)
    if (searchTerm) {
      lista = lista.filter(
        (el) =>
          el.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          el.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return lista
  }

  // Formatear precio
  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
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
  // HANDLERS DE NAVEGACIÓN
  // ============================================

  // Nivel 1 → Nivel 2: Seleccionar categoría padre
  const handleSelectCategoriaPadre = (categoria) => {
    setSelectedCategoriaPadre(categoria)
    setSelectedSubcategoria(null)
    setSearchTerm('')
  }

  // Nivel 2 → Nivel 3: Seleccionar subcategoría
  const handleSelectSubcategoria = (subcategoria) => {
    setSelectedSubcategoria(subcategoria)
    setSearchTerm('')
  }

  // Volver al nivel anterior
  const handleGoBack = () => {
    if (selectedSubcategoria) {
      // De productos → subcategorías
      setSelectedSubcategoria(null)
      setSearchTerm('')
    } else if (selectedCategoriaPadre) {
      // De subcategorías → categorías padre
      setSelectedCategoriaPadre(null)
      setSearchTerm('')
    } else {
      // De categorías padre → módulos
      navigate('/')
    }
  }

  // Navegar directamente a un nivel específico (para breadcrumb)
  const handleNavigateToRoot = () => {
    setSelectedCategoriaPadre(null)
    setSelectedSubcategoria(null)
    setSearchTerm('')
  }

  const handleNavigateToCategoriaPadre = () => {
    setSelectedSubcategoria(null)
    setSearchTerm('')
  }

  const handleCrearCategoria = () => {
    setCategoriaToEdit(null)
    setCategoriaPadreIdParaCrear(null)
    setShowCategoriaModal(true)
  }

  const handleCrearSubcategoria = (padreId) => {
    setCategoriaToEdit(null)
    setCategoriaPadreIdParaCrear(padreId)
    setShowCategoriaModal(true)
  }

  const handleCategoriaSuccess = () => {
    setShowCategoriaModal(false)
    setCategoriaToEdit(null)
    setCategoriaPadreIdParaCrear(null)
    refetchCategorias()
  }

  const handleEditarCategoria = (categoria, e) => {
    e?.stopPropagation()
    setCategoriaToEdit(categoria)
    setShowCategoriaModal(true)
  }

  const handleEliminarCategoria = async (categoria, e) => {
    e?.stopPropagation()

    // Verificar si tiene elementos
    const cantidadElementos = contarElementosPorCategoria(categoria.id)
    if (cantidadElementos > 0) {
      toast.error(
        `No se puede eliminar. Esta categoría tiene ${cantidadElementos} plantilla(s) asociada(s).`
      )
      return
    }

    const confirmacion = confirm(
      `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?\n\nEsta acción no se puede deshacer.`
    )

    if (confirmacion) {
      try {
        await deleteCategoria(categoria.id)
        toast.success('Categoría eliminada exitosamente')
        refetchCategorias()
      } catch (error) {
        console.error('Error al eliminar categoría:', error)
        toast.error(
          error.response?.data?.mensaje || 'Error al eliminar la categoría'
        )
      }
    }
  }

  // ============================================
  // BREADCRUMB - Con iconos y clickeable
  // ============================================
  const getBreadcrumbItems = () => {
    const items = [
      {
        label: 'Productos de Alquiler',
        onClick: handleNavigateToRoot,
        icon: '🏷️',
      },
    ]

    if (selectedCategoriaPadre) {
      items.push({
        label: selectedCategoriaPadre.nombre,
        onClick: handleNavigateToCategoriaPadre,
        icon: selectedCategoriaPadre.emoji || '📦',
      })
    }

    if (selectedSubcategoria) {
      items.push({
        label: selectedSubcategoria.nombre,
        icon: selectedSubcategoria.emoji || '📦',
      })
    }

    return items
  }

  // ============================================
  // TÍTULO Y DESCRIPCIÓN SEGÚN NIVEL
  // ============================================
  const getPageTitle = () => {
    if (selectedSubcategoria) return selectedSubcategoria.nombre
    if (selectedCategoriaPadre) return selectedCategoriaPadre.nombre
    return 'Productos de Alquiler'
  }

  const getPageDescription = () => {
    if (selectedSubcategoria) {
      const count = getElementosDeCategoria(selectedSubcategoria.id).length
      return `${count} plantilla(s) en esta subcategoría`
    }
    if (selectedCategoriaPadre) {
      const count = selectedCategoriaPadre.hijos?.length || 0
      return `${count} subcategoría(s)`
    }
    return 'Plantillas de productos para cotizar y alquilar'
  }

  const getPageEmoji = () => {
    if (selectedSubcategoria) return selectedSubcategoria.emoji || '📦'
    if (selectedCategoriaPadre) return selectedCategoriaPadre.emoji || '📦'
    return null
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  const isLoading = loadingCategorias || loadingElementos

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb items={getBreadcrumbItems()} className="mb-4" />

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                {getPageEmoji() ? (
                  <span className="text-4xl">{getPageEmoji()}</span>
                ) : (
                  <Tent className="w-8 h-8 text-emerald-600" />
                )}
                {getPageTitle()}
              </h1>
              <p className="text-slate-600 mt-1">{getPageDescription()}</p>
            </div>

            <div className="flex gap-3">
              {/* Botón crear categoría (solo en nivel raíz) */}
              {!selectedCategoriaPadre && !selectedSubcategoria && (
                <Button
                  variant="outline"
                  onClick={handleCrearCategoria}
                  className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <FolderOpen className="w-4 h-4" />
                  Nueva Categoría
                </Button>
              )}

              {/* Botón crear subcategoría (en nivel de categoría padre) */}
              {selectedCategoriaPadre && !selectedSubcategoria && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleCrearSubcategoria(selectedCategoriaPadre.id)
                  }
                  className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Folder className="w-4 h-4" />
                  Nueva Subcategoría
                </Button>
              )}

              {/* Botón crear plantilla (en nivel de subcategoría) */}
              {selectedSubcategoria && (
                <Button
                  variant="primary"
                  onClick={handleCrear}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Plantilla
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando...</p>
          </div>
        )}

        {/* ============================================
            NIVEL 1: CATEGORÍAS PADRE
            ============================================ */}
        {!isLoading && !selectedCategoriaPadre && (
          <>
            {categoriasArbol.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No hay categorías de productos
                </h3>
                <p className="text-slate-600 mb-6">
                  Primero crea categorías para organizar tus plantillas
                </p>
                <Button
                  variant="primary"
                  onClick={handleCrearCategoria}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Categoría
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoriasArbol.map((categoria) => (
                  <ProductCategoriaPadreCard
                    key={categoria.id}
                    categoria={categoria}
                    totalSubcategorias={categoria.hijos?.length || 0}
                    totalProductos={contarElementosPorCategoria(categoria.id)}
                    onClick={() => handleSelectCategoriaPadre(categoria)}
                    onEdit={() => handleEditarCategoria(categoria)}
                    onCrearSubcategoria={() =>
                      handleCrearSubcategoria(categoria.id)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================
            NIVEL 2: SUBCATEGORÍAS
            ============================================ */}
        {!isLoading && selectedCategoriaPadre && !selectedSubcategoria && (
          <>
            {!selectedCategoriaPadre.hijos ||
            selectedCategoriaPadre.hijos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No hay subcategorías
                </h3>
                <p className="text-slate-600 mb-6">
                  Crea subcategorías para organizar las plantillas de{' '}
                  {selectedCategoriaPadre.nombre}
                </p>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleCrearSubcategoria(selectedCategoriaPadre.id)
                  }
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Subcategoría
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {selectedCategoriaPadre.hijos.map((subcategoria) => (
                  <ProductSubcategoriaCard
                    key={subcategoria.id}
                    subcategoria={subcategoria}
                    totalProductos={contarElementosPorCategoria(subcategoria.id)}
                    onClick={() => handleSelectSubcategoria(subcategoria)}
                    onEdit={() => handleEditarCategoria(subcategoria)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================
            NIVEL 3: PLANTILLAS/PRODUCTOS
            ============================================ */}
        {!isLoading && selectedSubcategoria && (
          <>
            {/* Buscador */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Lista de elementos */}
            {getElementosDeCategoria(selectedSubcategoria.id).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Tent className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No hay plantillas en esta subcategoría
                </h3>
                <p className="text-slate-600 mb-6">
                  Crea tu primera plantilla para empezar a cotizar
                </p>
                <Button variant="primary" onClick={handleCrear}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Plantilla
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getElementosDeCategoria(selectedSubcategoria.id).map(
                  (elemento) => (
                    <ElementoCompuestoCard
                      key={elemento.id}
                      elemento={elemento}
                      onVer={() => handleVer(elemento)}
                      onEditar={() => handleEditar(elemento)}
                      onEliminar={() => setElementoToDelete(elemento)}
                      formatPrecio={formatPrecio}
                    />
                  )
                )}
              </div>
            )}
          </>
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
              ¿Estás seguro de eliminar{' '}
              <strong>{elementoToDelete?.nombre}</strong>? Esta acción no se
              puede deshacer.
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

        {/* Modal de formulario (multi-paso) */}
        <ElementoCompuestoFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false)
            setElementoToEdit(null)
          }}
          onSuccess={handleFormSuccess}
          elemento={elementoToEdit}
        />

        {/* Modal de categoría */}
        <CategoriaProductoFormModal
          isOpen={showCategoriaModal}
          onClose={() => {
            setShowCategoriaModal(false)
            setCategoriaToEdit(null)
            setCategoriaPadreIdParaCrear(null)
          }}
          onSuccess={handleCategoriaSuccess}
          categoria={categoriaToEdit}
          categoriaPadreId={categoriaPadreIdParaCrear}
        />
      </div>
    </div>
  )
}

export default ElementosCompuestosPage
