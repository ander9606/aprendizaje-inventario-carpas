// ============================================
// PÁGINA: ELEMENTOS
// Lista de elementos de una subcategoría
// ============================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'

// Hooks personalizados
import { useGetElementos } from '../hooks/Useelementos'

// Componentes UI
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import Breadcrumb from '../components/common/Breadcrum'
import ElementoSerieCard from '../components/elementos/series/ElementoSerieCard'
import ElementoLoteCard from '../components/elementos/lotes/ElementoLoteCard'
import ElementoFormModal from '../components/forms/ElementoFormModal'
import SerieFormModal from '../components/forms/SerieFormModal'
import LoteFormModal from '../components/forms/LoteFormModal'

/**
 * ============================================
 * COMPONENTE PRINCIPAL: ElementosPage
 * ============================================
 *
 * Esta página muestra todos los elementos de una subcategoría.
 * Puede mostrar elementos gestionados por SERIE o por LOTE.
 *
 * FLUJO:
 * 1. Obtiene subcategoriaId de la URL
 * 2. Usa el hook useGetElementos para obtener los datos
 * 3. Muestra loading mientras carga
 * 4. Muestra EmptyState si no hay elementos
 * 5. Renderiza ElementoSerieCard o ElementoLoteCard según tipo
 *
 * RUTAS:
 * - /categorias/:categoriaId/subcategorias/:subcategoriaId/elementos
 *
 * @example
 * // URL: /categorias/1/subcategorias/5/elementos
 * // Muestra todos los elementos de la subcategoría 5
 */
function ElementosPage() {
  // ============================================
  // 1. HOOKS DE REACT ROUTER
  // ============================================

  /**
   * useParams: Obtiene parámetros de la URL
   * En este caso: categoriaId y subcategoriaId
   */
  const { categoriaId, subcategoriaId } = useParams()

  /**
   * useNavigate: Función para navegar programáticamente
   * Ejemplo: navigate('/otra-pagina')
   */
  const navigate = useNavigate()

  // ============================================
  // 2. ESTADOS LOCALES
  // ============================================

  /**
   * Modal de crear elemento
   * true = modal abierto, false = modal cerrado
   */
  const [showElementoModal, setShowElementoModal] = useState(false)

  /**
   * Modal de agregar serie
   * Guarda el elemento seleccionado para agregar serie
   */
  const [elementoParaSerie, setElementoParaSerie] = useState(null)

  /**
   * Modal de mover lote
   * Guarda los datos del lote a mover
   */
  const [loteParaMover, setLoteParaMover] = useState(null)

  // ============================================
  // 3. HOOK DE DATOS (React Query)
  // ============================================

  /**
   * useGetElementos: Obtiene todos los elementos de la subcategoría
   *
   * DEVUELVE:
   * - elementos: Array de elementos
   * - subcategoria: Datos de la subcategoría (nombre, icono, etc)
   * - isLoading: true mientras carga
   * - error: Objeto de error si falla
   * - refetch: Función para recargar datos manualmente
   *
   * NOTA: React Query maneja automáticamente:
   * - Cache de datos
   * - Reintentos si falla
   * - Actualización automática cuando cambia subcategoriaId
   */
  const {
    elementos = [],
    subcategoria,
    isLoading,
    error,
    refetch
  } = useGetElementos(subcategoriaId)

    console.log('Elementos cargados:', elementos)

  // ============================================
  // 4. HANDLERS - Funciones que manejan eventos
  // ============================================

  /**
   * Handler: Volver a la página anterior
   *
   * ¿QUÉ HACE?
   * Navega hacia atrás usando navigate(-1)
   * Es como hacer click en el botón "Atrás" del navegador
   */
  const handleGoBack = () => {
    navigate(-1)
  }

  /**
   * Handler: Abrir modal para crear elemento
   *
   * ¿QUÉ HACE?
   * Cambia el estado showElementoModal a true
   * Esto hace que el modal se muestre en pantalla
   */
  const handleOpenCreateModal = () => {
    setShowElementoModal(true)
  }

  /**
   * Handler: Cerrar modal de elemento
   *
   * ¿QUÉ HACE?
   * Cambia el estado showElementoModal a false
   * El modal se oculta
   */
  const handleCloseElementoModal = () => {
    setShowElementoModal(false)
  }

  /**
   * Handler: Después de crear elemento exitosamente
   *
   * ¿QUÉ HACE?
   * 1. Cierra el modal
   * 2. Recarga los datos con refetch() para mostrar el nuevo elemento
   *
   * NOTA: refetch() viene del hook useGetElementos
   */
  const handleElementoCreated = () => {
    setShowElementoModal(false)
    refetch()
  }

  /**
   * Handler: Editar un elemento
   *
   * @param {Object} elemento - El elemento a editar
   *
   * ¿QUÉ HACE?
   * Navega a la página de detalle del elemento
   * donde se puede ver toda la info y editar
   */
  const handleEditElemento = (elemento) => {
    navigate(`/categorias/${categoriaId}/subcategorias/${subcategoriaId}/elementos/${elemento.id}`)
  }

  /**
   * Handler: Eliminar un elemento
   *
   * @param {Object} elemento - El elemento a eliminar
   *
   * ¿QUÉ HACE?
   * 1. Muestra confirmación
   * 2. Si confirma, llama a la API para eliminar
   * 3. Recarga los datos
   *
   * TODO: Implementar con mutation de React Query
   */
  const handleDeleteElemento = (elemento) => {
    // Confirmación antes de eliminar
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${elemento.nombre}"?\n\nEsta acción no se puede deshacer.`
    )

    if (confirmar) {
      // TODO: Aquí llamar a useDeleteElemento mutation
      console.log('Eliminar elemento:', elemento)
    }
  }

  /**
   * Handler: Abrir modal para agregar serie
   *
   * @param {Object} elemento - El elemento al que agregar serie
   *
   * ¿QUÉ HACE?
   * 1. Guarda el elemento en el estado
   * 2. Esto hace que se abra el modal de serie
   */
  const handleAddSerie = (elemento) => {
    setElementoParaSerie(elemento)
  }

  /**
   * Handler: Editar una serie
   *
   * @param {Object} serie - La serie a editar
   *
   * ¿QUÉ HACE?
   * Abre el modal de edición de serie (pasando la serie existente)
   */
  const handleEditSerie = (serie) => {
    // TODO: Implementar modal de editar serie
    console.log('Editar serie:', serie)
  }

  /**
   * Handler: Eliminar una serie
   *
   * @param {Object} serie - La serie a eliminar
   *
   * ¿QUÉ HACE?
   * 1. Muestra confirmación
   * 2. Llama a la mutation para eliminar
   * 3. React Query actualiza automáticamente la UI
   */
  const handleDeleteSerie = (serie) => {
    const confirmar = window.confirm(
      `¿Eliminar serie ${serie.numero_serie}?`
    )

    if (confirmar) {
      // TODO: useDeleteSerie mutation
      console.log('Eliminar serie:', serie)
    }
  }

  /**
   * Handler: Mover serie a otra ubicación
   *
   * @param {Object} serie - La serie a mover
   *
   * ¿QUÉ HACE?
   * Abre modal para seleccionar nueva ubicación
   */
  const handleMoveSerie = (serie) => {
    // TODO: Implementar modal de mover serie
    console.log('Mover serie:', serie)
  }

  /**
   * Handler: Abrir modal para agregar lote
   *
   * @param {Object} elemento - El elemento al que agregar lote
   *
   * ¿QUÉ HACE?
   * Abre modal para ingresar cantidad, estado y ubicación
   */
  const handleAddLote = (elemento) => {
    // TODO: Implementar modal de agregar lote
    console.log('Agregar lote a:', elemento)
  }

  /**
   * Handler: Editar cantidad de un lote
   *
   * @param {Object} lote - El lote a editar
   * @param {string} ubicacion - La ubicación del lote
   */
  const handleEditLote = (lote, ubicacion) => {
    console.log('Editar lote:', lote, 'ubicación:', ubicacion)
  }

  /**
   * Handler: Mover cantidad de un lote
   *
   * @param {Object} lote - El lote origen
   * @param {string} ubicacion - La ubicación origen
   *
   * ¿QUÉ HACE?
   * 1. Guarda los datos del lote en el estado
   * 2. Abre el modal de mover cantidad
   */
  const handleMoveLote = (lote, ubicacion) => {
    setLoteParaMover({ lote, ubicacion })
  }

  /**
   * Handler: Eliminar un lote
   *
   * @param {Object} lote - El lote a eliminar
   * @param {string} ubicacion - La ubicación del lote
   */
  const handleDeleteLote = (lote, ubicacion) => {
    const confirmar = window.confirm(
      `¿Eliminar ${lote.cantidad} unidades en estado ${lote.estado}?`
    )

    if (confirmar) {
      // TODO: useDeleteLote mutation
      console.log('Eliminar lote:', lote)
    }
  }

  // ============================================
  // 5. BREADCRUMB (Migaja de pan)
  // ============================================

  /**
   * breadcrumbItems: Arreglo de rutas para navegación
   *
   * ESTRUCTURA:
   * - label: Texto a mostrar
   * - path: Ruta a la que navegar (opcional)
   *
   * EJEMPLO:
   * Inicio > Categorías > Camping > Carpas > Elementos
   */
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
    { label: 'Elementos' } // Última no tiene path (es la actual)
  ]

  // ============================================
  // 6. RENDERIZADO CONDICIONAL
  // ============================================

  /**
   * LOADING: Mientras carga los datos
   * Muestra un spinner centrado
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  /**
   * ERROR: Si hubo un error al cargar
   * Muestra mensaje de error con opción de reintentar
   */
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
  // 7. RENDERIZADO PRINCIPAL
  // ============================================

  return (
    <div className="container mx-auto px-4 py-6">

      {/* ============================================
          HEADER DE LA PÁGINA
          ============================================ */}
      <div className="mb-6">
        {/* Breadcrumb (navegación de migas) */}
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        {/* Título y botones de acción */}
        <div className="flex items-center justify-between">
          {/* Lado izquierdo: Botón volver + Título */}
          <div className="flex items-center gap-4">
            {/* Botón para volver atrás */}
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            {/* Título con icono de subcategoría */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <span className="text-4xl">{subcategoria?.icono || '📦'}</span>
                {subcategoria?.nombre || 'Elementos'}
              </h1>
              <p className="text-slate-600 mt-1">
                {elementos.length} {elementos.length === 1 ? 'elemento' : 'elementos'}
              </p>
            </div>
          </div>

          {/* Lado derecho: Botón crear elemento */}
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleOpenCreateModal}
          >
            Nuevo Elemento
          </Button>
        </div>
      </div>

      {/* ============================================
          LISTA DE ELEMENTOS
          ============================================ */}

      {/* Si no hay elementos, mostrar EmptyState */}
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
        /* Grid de elementos */
        <div className="grid grid-cols-1 gap-6">
          {elementos.map((elemento) => {

            /**
             * DECISIÓN: ¿Qué componente usar?
             *
             * Si requiere_series = true → ElementoSerieCard
             * Si requiere_series = false → ElementoLoteCard
             */
            if (elemento.requiere_series) {
              // ============================================
              // ELEMENTO CON SERIES (tracking individual)
              // ============================================
              return (
                <ElementoSerieCard
                  key={elemento.id}
                  elemento={{
                    nombre: elemento.nombre,
                    icono: subcategoria?.icono || '📦', // Usar icono de subcategoría
                    series: elemento.series || [],
                    estadisticas: {
                      total: elemento.total_series || 0,
                      disponible: elemento.series_disponibles || 0,
                      alquilado: elemento.series_alquiladas || 0,
                      mantenimiento: elemento.series_mantenimiento || 0,
                      nuevo: elemento.series_nuevas || 0,
                      danado: elemento.series_danadas || 0
                    },
                    alertas: [] // TODO: Calcular alertas de devolución
                  }}
                  onEdit={() => handleEditElemento(elemento)}
                  onDelete={() => handleDeleteElemento(elemento)}
                  onAddSerie={() => handleAddSerie(elemento)}
                  onEditSerie={handleEditSerie}
                  onDeleteSerie={handleDeleteSerie}
                  onMoveSerie={handleMoveSerie}
                />
              )
            } else {
              // ============================================
              // ELEMENTO CON LOTES (tracking por cantidad)
              // ============================================
              return (
                <ElementoLoteCard
                  key={elemento.id}
                  elemento={{
                    nombre: elemento.nombre,
                    icono: subcategoria?.icono || '📦', // Usar icono de subcategoría
                    ubicaciones: elemento.lotes_por_ubicacion || [],
                    estadisticas: {
                      total: elemento.cantidad_total || 0,
                      nuevo: elemento.cantidad_por_estado?.nuevo || 0,
                      bueno: elemento.cantidad_por_estado?.bueno || 0,
                      mantenimiento: elemento.cantidad_por_estado?.mantenimiento || 0,
                      danado: elemento.cantidad_por_estado?.danado || 0,
                      alquilado: elemento.cantidad_por_estado?.alquilado || 0
                    },
                    alertas: []
                  }}
                  onEdit={() => handleEditElemento(elemento)}
                  onDelete={() => handleDeleteElemento(elemento)}
                  onAddLote={() => handleAddLote(elemento)}
                  onEditLote={handleEditLote}
                  onMoveLote={handleMoveLote}
                  onDeleteLote={handleDeleteLote}
                />
              )
            }
          })}
        </div>
      )}

      {/* ============================================
          MODALES (se mostrarán cuando los estados cambien)
          ============================================ */}

      {showElementoModal && (
        <ElementoFormModal
          isOpen={showElementoModal}
          onClose={handleCloseElementoModal}
          onSuccess={handleElementoCreated}
          subcategoriaId={subcategoriaId}
        />
      )}

      {elementoParaSerie && (
        <SerieFormModal
          isOpen={!!elementoParaSerie}
          onClose={() => setElementoParaSerie(null)}
          elemento={elementoParaSerie}
          onSuccess={() => {
            setElementoParaSerie(null)
            refetch()
          }}
        />
      )}

      {loteParaMover && (
        <LoteFormModal
          isOpen={!!loteParaMover}
          onClose={() => setLoteParaMover(null)}
          lote={loteParaMover.lote}
          ubicacionOrigen={loteParaMover.ubicacion}
          elemento={loteParaMover.elemento}
          onSuccess={() => {
            setLoteParaMover(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}

export default ElementosPage

/**
 * ============================================
 * 🎓 CONCEPTOS CLAVE
 * ============================================
 *
 * 1. HOOKS DE REACT:
 * ──────────────────
 * - useState: Para manejar estado local (modales, selecciones)
 * - useParams: Para obtener parámetros de la URL
 * - useNavigate: Para navegar programáticamente
 *
 *
 * 2. REACT QUERY:
 * ───────────────
 * - useGetElementos: Hook personalizado que usa useQuery
 * - Maneja automáticamente: loading, error, cache, refetch
 * - No necesitas useEffect ni fetch manual
 *
 *
 * 3. RENDERIZADO CONDICIONAL:
 * ──────────────────────────
 * if (isLoading) return <Spinner />
 * if (error) return <Error />
 * if (!data) return <EmptyState />
 * return <Content />
 *
 *
 * 4. HANDLERS:
 * ───────────
 * Son funciones que manejan eventos del usuario
 * Ejemplo: onClick={handleEditElemento}
 *
 *
 * 5. PROPS DRILLING:
 * ─────────────────
 * Pasamos funciones (handlers) a componentes hijos
 * para que puedan comunicarse con el padre
 *
 *
 * 6. ELEMENTOS CON SERIES vs LOTES:
 * ─────────────────────────────────
 * - requiere_series = true → ElementoSerieCard
 * - requiere_series = false → ElementoLoteCard
 *
 * Cada uno tiene su propia estructura de datos
 */
