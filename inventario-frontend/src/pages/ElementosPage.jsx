// ============================================
// PÁGINA: ELEMENTOS (VERSIÓN SIMPLIFICADA)
// Las cards ahora cargan sus propios datos de series/lotes
// ============================================

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, FileSpreadsheet, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { exportarInventarioExcel } from '../api/apiExport'

// Hooks personalizados
import { useGetElementos, useDeleteElemento } from '../hooks/Useelementos'
import { useDeleteLote } from '../hooks/Uselotes'
import { useDeleteSerie } from '../hooks/Useseries'

// Componentes UI
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import Breadcrumb from '../components/common/Breadcrum'
import ConfirmModal from '../components/common/ConfirmModal'
import { IconoCategoria } from '../components/common/IconoCategoria'

// Cards de elementos (ahora cargan sus propios datos)
import ElementoSerieCard from '../components/elementos/series/ElementoSerieCard'
import ElementoLoteCard from '../components/elementos/lotes/ElementoLoteCard'

// Modales
import ElementoFormModal from '../components/forms/ElementoFormModal'
import SerieFormModal from '../components/forms/SerieFormModal'
import LoteFormModal from '../components/forms/LoteFormModal'
import CrearLoteModal from '../components/forms/CrearLoteModal'
import DevolverBodegaModal from '../components/forms/DevolverBodegaModal'
import DevolverSerieBodegaModal from '../components/forms/DevolverSerieBodegaModal'
import MoverSerieModal from '../components/forms/MoverSerieModal'

/**
 * ============================================
 * COMPONENTE PRINCIPAL: ElementosPage
 * ============================================
 * 
 * MEJORA: Las cards (ElementoSerieCard y ElementoLoteCard) ahora
 * cargan sus propios datos de series/lotes usando sus respectivos
 * hooks. Esto simplifica este componente y mejora el rendimiento
 * gracias al cache de React Query.
 */
function ElementosPage() {
  // ============================================
  // HOOKS DE REACT ROUTER
  // ============================================
  const { categoriaId, subcategoriaId } = useParams()
  const navigate = useNavigate()

  // ============================================
  // ESTADOS LOCALES (Modales)
  // ============================================
  const [showElementoModal, setShowElementoModal] = useState(false)
  const [elementoParaSerie, setElementoParaSerie] = useState(null)
  const [loteParaMover, setLoteParaMover] = useState(null)

  /**
   * Modal de crear lote
   * Guarda el elemento para crear un lote nuevo
   */
  const [elementoParaLote, setElementoParaLote] = useState(null)

  /**
   * Modal de devolver lote a bodega
   * Guarda el lote, ubicación y elemento para devolver
   */
  const [loteParaDevolver, setLoteParaDevolver] = useState(null)

  /**
   * Modal de devolver serie a bodega
   * Guarda la serie y elemento para devolver
   */
  const [serieParaDevolver, setSerieParaDevolver] = useState(null)

  /**
   * Modal de mover serie
   * Guarda la serie y elemento para mover
   */
  const [serieParaMover, setSerieParaMover] = useState(null)

  /**
   * Modal de editar serie
   * Guarda la serie y elemento para editar
   */
  const [serieParaEditar, setSerieParaEditar] = useState(null)

  // Estado para descarga Excel
  const [isExporting, setIsExporting] = useState(false)

  // Búsqueda local de elementos
  const [searchTerm, setSearchTerm] = useState('')

  // Modales de confirmación para eliminaciones
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type: 'elemento'|'serie'|'lote', data, extra }

  // ============================================
  // HOOKS DE DATOS
  // ============================================
  const {
    elementos = [],
    subcategoria,
    isLoading,
    error,
    refetch
  } = useGetElementos(subcategoriaId)

  const { 
    deleteElemento, 
    isLoading: isDeleting 
  } = useDeleteElemento()

  const {
    deleteLote,
    isLoading: isDeletingLote
  } = useDeleteLote()

  const {
    deleteSerie,
    isLoading: isDeletingSerie
  } = useDeleteSerie()

  // ============================================
  // HANDLERS - Navegación
  // ============================================
  const handleGoBack = () => navigate(-1)

  // ============================================
  // HANDLER - Exportar Excel
  // ============================================
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await exportarInventarioExcel()
      toast.success('Inventario exportado a Excel exitosamente')
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar el inventario')
    } finally {
      setIsExporting(false)
    }
  }

  // ============================================
  // HANDLERS - Modal Elemento
  // ============================================
  const handleOpenCreateModal = () => setShowElementoModal(true)
  const handleCloseElementoModal = () => setShowElementoModal(false)
  const handleElementoCreated = () => {
    setShowElementoModal(false)
    refetch()
  }

  // ============================================
  // HANDLERS - Elemento CRUD
  // ============================================
  const handleEditElemento = (elemento) => {
    navigate(`/inventario/categorias/${categoriaId}/subcategorias/${subcategoriaId}/elementos/${elemento.id}`)
  }

  const handleDeleteElemento = (elemento) => {
    if (!elemento?.id) return
    setDeleteConfirm({
      type: 'elemento',
      data: elemento,
      title: `¿Eliminar "${elemento.nombre}"?`,
      message: `Se eliminarán todas las ${elemento.requiere_series ? 'series' : 'unidades en lotes'} asociadas. Esta acción no se puede deshacer.`
    })
  }

  const handleConfirmDelete = async () => {
    const { type, data, extra } = deleteConfirm
    try {
      if (type === 'elemento') {
        await deleteElemento(data.id)
        refetch()
        toast.success(`Elemento "${data.nombre}" eliminado`)
      } else if (type === 'serie') {
        await deleteSerie(data.id)
        toast.success(`Serie "${data.numero_serie}" eliminada`)
      } else if (type === 'lote') {
        await deleteLote(data.id)
        toast.success('Lote eliminado exitosamente')
      }
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || error.message || 'Error desconocido'
      toast.error(mensaje)
    } finally {
      setDeleteConfirm(null)
    }
  }

  // ============================================
  // HANDLERS - Series
  // ============================================
  const handleAddSerie = (elemento) => setElementoParaSerie(elemento)

  const handleDevolverSerieBodega = (serie, elemento) => {
    setSerieParaDevolver({ serie, elemento })
  }

  const handleEditSerie = (serie, elemento) => {
    // Buscar el elemento completo si no viene incluido
    const elementoCompleto = elementos.find(el => el.id === serie.id_elemento) || elemento
    setSerieParaEditar({ serie, elemento: elementoCompleto })
  }

  const handleDeleteSerie = (serie) => {
    if (!serie?.id) return
    setDeleteConfirm({
      type: 'serie',
      data: serie,
      title: `¿Eliminar serie "${serie.numero_serie}"?`,
      message: 'Se eliminará esta unidad del inventario. Esta acción no se puede deshacer.'
    })
  }

  const handleMoveSerie = (serie, elemento) => {
    setSerieParaMover({ serie, elemento })
  }

  // ============================================
  // HANDLERS - Lotes
  // ============================================
  const handleAddLote = (elemento) => setElementoParaLote(elemento)

  const handleDevolverBodega = (lote, ubicacion, elemento) => {
    setLoteParaDevolver({ lote, ubicacion, elemento })
  }

  const handleMoveLote = (lote, ubicacion, elemento) => {
    setLoteParaMover({ lote, ubicacion, elemento })
  }
  
  const handleDeleteLote = (lote, ubicacion) => {
    if (!lote?.id) return
    setDeleteConfirm({
      type: 'lote',
      data: lote,
      extra: ubicacion,
      title: `¿Eliminar lote?`,
      message: `Se eliminarán ${lote.cantidad} unidades en estado "${lote.estado}" de "${ubicacion || 'Sin ubicación'}". Esta acción no se puede deshacer.`
    })
  }

  // ============================================
  // BÚSQUEDA LOCAL: Filtrar elementos por nombre
  // ============================================
  const elementosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return elementos
    const term = searchTerm.toLowerCase().trim()
    return elementos.filter(el =>
      el.nombre.toLowerCase().includes(term) ||
      el.descripcion?.toLowerCase().includes(term)
    )
  }, [elementos, searchTerm])

  // ============================================
  // BREADCRUMB
  // ============================================
  // NOTA: La ruta /subcategorias/:id no existe como página separada
  // Las subcategorías se muestran en la página de categoría
  const breadcrumbItems = [
    { label: 'Inventario', path: '/inventario' },
    {
      label: subcategoria?.categoria_padre_nombre || 'Categoría',
      path: `/inventario/categorias/${categoriaId}`
    },
    // La subcategoría no tiene página propia, mostramos solo el nombre
    { label: subcategoria?.nombre || 'Elementos' }
  ]

  // ============================================
  // RENDERIZADO - Loading
  // ============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  // ============================================
  // RENDERIZADO - Error
  // ============================================
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Error al cargar elementos
          </h2>
          <p className="text-red-600 mb-4">
            {error.message || 'Ocurrió un error desconocido'}
          </p>
          <Button variant="outline" onClick={refetch}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDERIZADO PRINCIPAL
  // ============================================
  return (
    <div className="container mx-auto px-4 py-6">

      {/* HEADER */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <IconoCategoria value={subcategoria?.emoji} className="text-3xl sm:text-4xl" size={36} />
                {subcategoria?.nombre || 'Elementos'}
              </h1>
              <p className="text-slate-600 mt-1">
                {elementos.length} {elementos.length === 1 ? 'elemento' : 'elementos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Excel'}</span>
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={handleOpenCreateModal}
              disabled={isDeleting || isDeletingLote || isDeletingSerie}
            >
              Nuevo Elemento
            </Button>
          </div>
        </div>

        {/* Búsqueda local - visible con 4+ elementos */}
        {elementos.length >= 4 && (
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar elementos por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Indicador de eliminación */}
      {(isDeleting || isDeletingLote || isDeletingSerie) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <Spinner size="sm" />
          <span className="text-yellow-700">
            {isDeleting ? 'Eliminando elemento...' : isDeletingLote ? 'Eliminando lote...' : 'Eliminando serie...'}
          </span>
        </div>
      )}

      {/* LISTA DE ELEMENTOS */}
      {elementos.length === 0 ? (
        <EmptyState
          type="no-data"
          title="No hay elementos registrados"
          description={`Crea el primer elemento en ${subcategoria?.nombre || 'esta subcategoría'}`}
          action={{
            label: 'Crear elemento',
            onClick: handleOpenCreateModal,
            icon: <Plus />
          }}
        />
      ) : elementosFiltrados.length === 0 ? (
        <EmptyState
          type="no-results"
          title="Sin resultados"
          description={`No se encontraron elementos con "${searchTerm}"`}
          action={{
            label: 'Limpiar búsqueda',
            onClick: () => setSearchTerm(''),
            icon: <X />
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {elementosFiltrados.map((elemento) => {
            // Pasar datos completos del elemento a las cards
            const elementoData = {
              ...elemento,
              icono: subcategoria?.emoji || '📦',
              alertas: []
            }

            if (elemento.requiere_series) {
              return (
                <ElementoSerieCard
                  key={elemento.id}
                  elemento={elementoData}
                  onEdit={() => handleEditElemento(elemento)}
                  onDelete={() => handleDeleteElemento(elemento)}
                  onAddSerie={() => handleAddSerie(elemento)}
                  onDevolverBodega={handleDevolverSerieBodega}
                  onEditSerie={handleEditSerie}
                  onDeleteSerie={handleDeleteSerie}
                  onMoveSerie={handleMoveSerie}
                  disabled={isDeleting || isDeletingLote || isDeletingSerie}
                />
              )
            } else {
              return (
                <ElementoLoteCard
                  key={elemento.id}
                  elemento={elementoData}
                  onEdit={() => handleEditElemento(elemento)}
                  onDelete={() => handleDeleteElemento(elemento)}
                  onAddLote={() => handleAddLote(elemento)}
                  onDevolverBodega={handleDevolverBodega}
                  onMoveLote={handleMoveLote}
                  onDeleteLote={handleDeleteLote}
                  disabled={isDeleting || isDeletingLote || isDeletingSerie}
                />
              )
            }
          })}
        </div>
      )}

      {/* ============================================
          MODALES
          ============================================ */}

      {/* Modal: Crear Elemento */}
      {showElementoModal && (
        <ElementoFormModal
          isOpen={showElementoModal}
          onClose={handleCloseElementoModal}
          onSuccess={handleElementoCreated}
          subcategoriaId={subcategoriaId}
        />
      )}

      {/* Modal: Agregar Serie */}
      {elementoParaSerie && (
        <SerieFormModal
          isOpen={!!elementoParaSerie}
          onClose={() => setElementoParaSerie(null)}
          elemento={elementoParaSerie}
          onSuccess={() => {
            setElementoParaSerie(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}

      {/* Modal: Crear Lote Nuevo */}
      {elementoParaLote && (
        <CrearLoteModal
          isOpen={!!elementoParaLote}
          onClose={() => setElementoParaLote(null)}
          elemento={elementoParaLote}
          onSuccess={() => {
            setElementoParaLote(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}

      {/* Modal: Mover Cantidad entre Lotes */}
      {loteParaMover && (
        <LoteFormModal
          isOpen={!!loteParaMover}
          onClose={() => setLoteParaMover(null)}
          lote={loteParaMover.lote}
          ubicacionOrigen={loteParaMover.ubicacion}
          elemento={loteParaMover.elemento}
          onSuccess={() => {
            setLoteParaMover(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}

      {/* Modal: Devolver Lote a Bodega */}
      {loteParaDevolver && (
        <DevolverBodegaModal
          isOpen={!!loteParaDevolver}
          onClose={() => setLoteParaDevolver(null)}
          lote={loteParaDevolver.lote}
          ubicacionOrigen={loteParaDevolver.ubicacion}
          elemento={loteParaDevolver.elemento}
          onSuccess={() => {
            setLoteParaDevolver(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}

      {/* Modal: Devolver Serie a Bodega */}
      {serieParaDevolver && (
        <DevolverSerieBodegaModal
          isOpen={!!serieParaDevolver}
          onClose={() => setSerieParaDevolver(null)}
          serie={serieParaDevolver.serie}
          elemento={serieParaDevolver.elemento}
          onSuccess={() => {
            setSerieParaDevolver(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}

      {/* Modal: Mover Serie */}
      {serieParaMover && (
        <MoverSerieModal
          isOpen={!!serieParaMover}
          onClose={() => setSerieParaMover(null)}
          serie={serieParaMover.serie}
          elemento={serieParaMover.elemento}
          onSuccess={() => {
            setSerieParaMover(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}

      {/* Modal: Editar Serie */}
      {serieParaEditar && (
        <SerieFormModal
          isOpen={!!serieParaEditar}
          onClose={() => setSerieParaEditar(null)}
          serie={serieParaEditar.serie}
          elemento={serieParaEditar.elemento}
          onSuccess={() => {
            setSerieParaEditar(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}

      {/* Modal: Confirmación de eliminación */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm?.title || '¿Confirmar eliminación?'}
        message={deleteConfirm?.message || ''}
        variant="danger"
        confirmText="Eliminar"
        loading={isDeleting || isDeletingLote || isDeletingSerie}
      />
    </div>
  )
}

export default ElementosPage