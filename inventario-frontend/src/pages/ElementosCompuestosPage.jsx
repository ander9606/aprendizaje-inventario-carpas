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
  Package,
  Layers,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  FolderOpen,
  RefreshCw,
  Star,
  Loader2
} from 'lucide-react'

// Hooks
import { useGetCategoriasProductos, useDeleteCategoriaProducto } from '../hooks/UseCategoriasProductos'
import {
  useGetElementosCompuestos,
  useDeleteElementoCompuesto,
  useGetComponentesAgrupados
} from '../hooks/UseElementosCompuestos'

// Componentes comunes
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Card from '../components/common/Card'
import ElementoCompuestoFormModal from '../components/forms/ElementoCompuestoFormModal'
import CategoriaProductoFormModal from '../components/forms/CategoriaProductoFormModal'

/**
 * ElementosCompuestosPage
 *
 * Página principal para gestionar elementos compuestos (plantillas de alquiler).
 * Muestra categorías como tarjetas clickeables para ver sus elementos.
 */
function ElementosCompuestosPage() {
  const navigate = useNavigate()

  // ============================================
  // ESTADOS
  // ============================================
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [elementoToEdit, setElementoToEdit] = useState(null)
  const [elementoToDelete, setElementoToDelete] = useState(null)
  const [elementoToView, setElementoToView] = useState(null)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [categoriaToEdit, setCategoriaToEdit] = useState(null)

  // ============================================
  // HOOKS DE DATOS
  // ============================================
  const { categorias, isLoading: loadingCategorias, refetch: refetchCategorias } = useGetCategoriasProductos()
  const { elementos, isLoading: loadingElementos, refetch } = useGetElementosCompuestos()
  const { deleteElemento, isPending: isDeleting } = useDeleteElementoCompuesto()
  const { deleteCategoria, isPending: isDeletingCategoria } = useDeleteCategoriaProducto()

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  // Contar elementos por categoría
  const contarElementosPorCategoria = (categoriaId) => {
    return elementos.filter(el => el.categoria_id === categoriaId).length
  }

  // Obtener elementos de una categoría
  const getElementosDeCategoria = (categoriaId) => {
    let lista = elementos.filter(el => el.categoria_id === categoriaId)
    if (searchTerm) {
      lista = lista.filter(el =>
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

  const handleSelectCategoria = (categoria) => {
    setSelectedCategoria(categoria)
  }

  const handleBackToCategorias = () => {
    setSelectedCategoria(null)
    setSearchTerm('')
  }

  const handleCrearCategoria = () => {
    setCategoriaToEdit(null)
    setShowCategoriaModal(true)
  }

  const handleCategoriaSuccess = () => {
    setShowCategoriaModal(false)
    setCategoriaToEdit(null)
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
      toast.error(`No se puede eliminar. Esta categoría tiene ${cantidadElementos} plantilla(s) asociada(s).`)
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
        toast.error(error.response?.data?.mensaje || 'Error al eliminar la categoría')
      }
    }
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
            onClick={() => selectedCategoria ? handleBackToCategorias() : navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{selectedCategoria ? 'Volver a Categorías' : 'Volver a Módulos'}</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Tent className="w-8 h-8 text-emerald-600" />
                {selectedCategoria ? selectedCategoria.nombre : 'Productos de Alquiler'}
              </h1>
              <p className="text-slate-600 mt-1">
                {selectedCategoria
                  ? `${getElementosDeCategoria(selectedCategoria.id).length} plantilla(s) en esta categoría`
                  : 'Plantillas de productos para cotizar y alquilar'
                }
              </p>
            </div>

            <div className="flex gap-3">
              {!selectedCategoria && (
                <Button
                  variant="outline"
                  onClick={handleCrearCategoria}
                  className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <FolderOpen className="w-4 h-4" />
                  Nueva Categoría
                </Button>
              )}
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
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando...</p>
          </div>
        )}

        {/* ============================================
            VISTA DE CATEGORÍAS (cuando no hay categoría seleccionada)
            ============================================ */}
        {!isLoading && !selectedCategoria && (
          <>
            {categorias.length === 0 ? (
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
                {categorias.map((categoria) => (
                  <CategoriaProductoCard
                    key={categoria.id}
                    categoria={categoria}
                    cantidadElementos={contarElementosPorCategoria(categoria.id)}
                    onClick={() => handleSelectCategoria(categoria)}
                    onEdit={handleEditarCategoria}
                    onDelete={handleEliminarCategoria}
                    isDeleting={isDeletingCategoria}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================
            VISTA DE ELEMENTOS (cuando hay categoría seleccionada)
            ============================================ */}
        {!isLoading && selectedCategoria && (
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
            {getElementosDeCategoria(selectedCategoria.id).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Tent className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No hay plantillas en esta categoría
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
                {getElementosDeCategoria(selectedCategoria.id).map(elemento => (
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
          }}
          onSuccess={handleCategoriaSuccess}
          categoria={categoriaToEdit}
        />
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE: Tarjeta de Categoría de Producto
// ============================================

function CategoriaProductoCard({ categoria, cantidadElementos, onClick, onEdit, onDelete, isDeleting }) {
  return (
    <Card
      variant="outlined"
      className="hover:shadow-lg transition-all duration-200 hover:border-emerald-300"
    >
      <Card.Header>
        <div className="flex items-center gap-3">
          <div className="text-4xl">
            {categoria.emoji || '📦'}
          </div>
          <Card.Title className="flex-1">
            {categoria.nombre}
          </Card.Title>
        </div>
        {categoria.descripcion && (
          <Card.Description>
            {categoria.descripcion}
          </Card.Description>
        )}
      </Card.Header>

      <Card.Content>
        <div className="flex items-center gap-2 text-slate-600">
          <Tent className="w-5 h-5" />
          <span className="font-medium">
            {cantidadElementos} plantilla{cantidadElementos !== 1 ? 's' : ''}
          </span>
        </div>
      </Card.Content>

      <Card.Footer>
        {/* Botón principal */}
        <Button
          variant="primary"
          fullWidth
          icon={<FolderOpen />}
          onClick={onClick}
          className="mb-3"
        >
          Ver Plantillas
        </Button>

        {/* Botones secundarios */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={(e) => onEdit(categoria, e)}
            className="flex-1"
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(e) => onDelete(categoria, e)}
            loading={isDeleting}
            disabled={isDeleting}
            className="flex-1 text-red-600 hover:bg-red-50"
          >
            Eliminar
          </Button>
        </div>
      </Card.Footer>
    </Card>
  )
}

// ============================================
// COMPONENTE: Tarjeta de Elemento Compuesto
// ============================================

function ElementoCompuestoCard({ elemento, onVer, onEditar, onEliminar, formatPrecio }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
  const { componentes, isLoading } = useGetComponentesAgrupados(elemento?.id)

  const fijos = componentes?.fijos || []
  const alternativas = componentes?.alternativas || []
  const adicionales = componentes?.adicionales || []

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

        {/* Componentes */}
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium text-slate-900 mb-3">Componentes</h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-600">Cargando componentes...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Componentes Fijos */}
              {fijos.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Componentes Fijos</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      Incluidos siempre
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {fijos.map((comp, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">• {comp.elemento_nombre || 'Elemento'}</span>
                        <span className="text-slate-500">× {comp.cantidad}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grupos de Alternativas */}
              {alternativas.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-900">Alternativas</span>
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      Intercambiables
                    </span>
                  </div>
                  {alternativas.map((grupo, grupoIdx) => (
                    <div key={grupoIdx} className="mb-2 last:mb-0">
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        {grupo.nombre} (requiere {grupo.cantidad_requerida || 1}):
                      </p>
                      <ul className="ml-4 space-y-1">
                        {(grupo.opciones || []).map((opt, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            {opt.es_default ? (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-slate-300" />
                            )}
                            <span className="text-slate-700">{opt.elemento_nombre || 'Elemento'}</span>
                            {!opt.es_default && opt.precio_adicional > 0 && (
                              <span className="text-emerald-600 text-xs">
                                +{formatPrecio(opt.precio_adicional)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Componentes Adicionales */}
              {adicionales.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">Adicionales</span>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                      Opcionales
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {adicionales.map((comp, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">• {comp.elemento_nombre || 'Elemento'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">× {comp.cantidad}</span>
                          {comp.precio_adicional > 0 && (
                            <span className="text-emerald-600">
                              +{formatPrecio(comp.precio_adicional)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sin componentes */}
              {fijos.length === 0 && alternativas.length === 0 && adicionales.length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Esta plantilla no tiene componentes definidos</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ElementosCompuestosPage
