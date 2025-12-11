// ============================================
// PÁGINA: ELEMENTOS (VERSIÓN SIMPLIFICADA)
// Las cards ahora cargan sus propios datos de series/lotes
// ============================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'

// Hooks personalizados
import { useGetElementos, useDeleteElemento } from '../hooks/Useelementos'
import { useDeleteLote } from '../hooks/Uselotes'

// Componentes UI
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import Breadcrumb from '../components/common/Breadcrum'

// Cards de elementos (ahora cargan sus propios datos)
import ElementoSerieCard from '../components/elementos/series/ElementoSerieCard'
import ElementoLoteCard from '../components/elementos/lotes/ElementoLoteCard'

// Modales
import ElementoFormModal from '../components/forms/ElementoFormModal'
import SerieFormModal from '../components/forms/SerieFormModal'
import LoteFormModal from '../components/forms/LoteFormModal'
import CrearLoteModal from '../components/forms/CrearLoteModal'

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

  // ============================================
  // HANDLERS - Navegación
  // ============================================
  const handleGoBack = () => navigate(-1)

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
    navigate(`/categorias/${categoriaId}/subcategorias/${subcategoriaId}/elementos/${elemento.id}`)
  }

  const handleDeleteElemento = async (elemento) => {
    if (!elemento?.id) return

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${elemento.nombre}"?\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmar) return

    try {
      await deleteElemento(elemento.id)
      refetch()
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || error.message || 'Error desconocido'
      alert(`No se pudo eliminar el elemento:\n\n${mensaje}`)
    }
  }

  // ============================================
  // HANDLERS - Series
  // ============================================
  const handleAddSerie = (elemento) => setElementoParaSerie(elemento)
  
  const handleEditSerie = (serie) => {
    console.log('Editar serie:', serie)
    // TODO: Abrir modal de edición de serie
  }
  
  const handleDeleteSerie = (serie) => {
    if (window.confirm(`¿Eliminar serie ${serie.numero_serie}?`)) {
      console.log('Eliminar serie:', serie)
      // TODO: Llamar a useDeleteSerie
    }
  }
  
  const handleMoveSerie = (serie) => {
    console.log('Mover serie:', serie)
    // TODO: Abrir modal de mover serie
  }

  // ============================================
  // HANDLERS - Lotes
  // ============================================
  const handleAddLote = (elemento) => setElementoParaLote(elemento)
  
  const handleEditLote = (lote, ubicacion) => {
    console.log('Editar lote:', lote, 'en:', ubicacion)
    // TODO: Abrir modal de edición de lote
  }
  
  const handleMoveLote = (lote, ubicacion) => {
    setLoteParaMover({ lote, ubicacion })
  }
  
  const handleDeleteLote = async (lote, ubicacion) => {
    if (!lote?.id) {
      console.error('Error: Lote sin ID', lote)
      return
    }

    const confirmar = window.confirm(
      `¿Eliminar ${lote.cantidad} unidades en estado "${lote.estado}" de "${ubicacion || 'Sin ubicación'}"?\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmar) return

    try {
      console.log('🗑️ Eliminando lote:', lote.id)
      await deleteLote(lote.id)
      console.log('✅ Lote eliminado exitosamente')
      // React Query invalida automáticamente el cache de lotes
    } catch (error) {
      console.error('❌ Error al eliminar lote:', error)
      const mensaje = error.response?.data?.mensaje || error.message || 'Error desconocido'
      alert(`No se pudo eliminar el lote:\n\n${mensaje}`)
    }
  }

  // ============================================
  // BREADCRUMB
  // ============================================
  const breadcrumbItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Categorías', path: '/categorias' },
    {
      label: subcategoria?.categoria_padre_nombre || 'Categoría',
      path: `/categorias/${categoriaId}`
    },
    {
      label: subcategoria?.nombre || 'Subcategoría',
      path: `/categorias/${categoriaId}/subcategorias/${subcategoriaId}`
    },
    { label: 'Elementos' }
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <span className="text-4xl">{subcategoria?.emoji || '📦'}</span>
                {subcategoria?.nombre || 'Elementos'}
              </h1>
              <p className="text-slate-600 mt-1">
                {elementos.length} {elementos.length === 1 ? 'elemento' : 'elementos'}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleOpenCreateModal}
            disabled={isDeleting || isDeletingLote}
          >
            Nuevo Elemento
          </Button>
        </div>
      </div>

      {/* Indicador de eliminación */}
      {(isDeleting || isDeletingLote) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <Spinner size="sm" />
          <span className="text-yellow-700">
            {isDeleting ? 'Eliminando elemento...' : 'Eliminando lote...'}
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
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {elementos.map((elemento) => {
            // Datos base que pasan a las cards
            // Las cards cargan sus propios lotes/series usando su ID
            const elementoBase = {
              id: elemento.id,
              nombre: elemento.nombre,
              icono: subcategoria?.emoji || '📦',
              alertas: []
            }

            if (elemento.requiere_series) {
              // ============================================
              // ELEMENTO CON SERIES
              // La card carga sus propias series automáticamente
              // ============================================
              return (
                <ElementoSerieCard
                  key={elemento.id}
                  elemento={elementoBase}
                  onEdit={() => handleEditElemento(elemento)}
                  onDelete={() => handleDeleteElemento(elemento)}
                  onAddSerie={() => handleAddSerie(elemento)}
                  onEditSerie={handleEditSerie}
                  onDeleteSerie={handleDeleteSerie}
                  onMoveSerie={handleMoveSerie}
                  disabled={isDeleting || isDeletingLote}
                />
              )
            } else {
              // ============================================
              // ELEMENTO CON LOTES
              // La card carga sus propios lotes automáticamente
              // ============================================
              return (
                <ElementoLoteCard
                  key={elemento.id}
                  elemento={elementoBase}
                  onEdit={() => handleEditElemento(elemento)}
                  onDelete={() => handleDeleteElemento(elemento)}
                  onAddLote={() => handleAddLote(elemento)}
                  onEditLote={handleEditLote}
                  onMoveLote={handleMoveLote}
                  onDeleteLote={handleDeleteLote}
                  disabled={isDeleting || isDeletingLote}
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

      {/* Modal: Agregar/Mover Lote */}
      {(loteParaMover || elementoParaLote) && (
        <LoteFormModal
          isOpen={!!(loteParaMover || elementoParaLote)}
          onClose={() => {
            setLoteParaMover(null)
            setElementoParaLote(null)
          }}
          lote={loteParaMover?.lote}
          ubicacionOrigen={loteParaMover?.ubicacion}
          elemento={loteParaMover?.elemento || elementoParaLote}
          onSuccess={() => {
            setLoteParaMover(null)
            setElementoParaLote(null)
            // No necesita refetch, React Query invalida automáticamente
          }}
        />
      )}
    </div>
  )
}

export default ElementosPage