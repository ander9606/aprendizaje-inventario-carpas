// ============================================
// PÁGINA: DETALLE DE ELEMENTO
// Vista completa de un elemento específico
// ============================================

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Plus, Calendar, User, Clock, MapPin, BarChart3, Layers, Settings } from 'lucide-react'
import { toast } from 'sonner'

// Hooks personalizados
import { useGetElemento, useDeleteElemento, useSubirImagenElemento, useEliminarImagenElemento } from '../hooks/useElementos'
import { useGetSeriesConContexto, useDeleteSerie } from '../hooks/useSeries'
import { useGetLotesConContexto, useDeleteLote } from '../hooks/useLotes'

// Utilidades
import { formatearFechaCorta } from '@shared/utils/helpers'

// Componentes UI
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import Breadcrumb from '@shared/components/Breadcrum'
import Card from '@shared/components/Card'
import StatCard from '@shared/components/StatCard'
import ImageUpload from '@shared/components/ImageUpload'
import ConfirmModal from '@shared/components/ConfirmModal'
import SerieItem from '../components/elementos/series/SerieItem'
import LoteUbicacionGroup from '../components/elementos/lotes/LoteUbicacionGroup'
import EmptyState from '@shared/components/EmptyState'

// Modales
import ElementoFormModal from '../components/forms/ElementoFormModal'
import SerieFormModal from '../components/forms/SerieFormModal'
import LoteFormModal from '../components/forms/LoteFormModal'

/**
 * ============================================
 * COMPONENTE PRINCIPAL: ElementoDetallePage
 * ============================================
 *
 * Esta página muestra el detalle COMPLETO de un elemento específico.
 *
 * FUNCIONALIDADES:
 * 1. Muestra información general del elemento
 * 2. Muestra estadísticas detalladas
 * 3. Si es SERIE: Lista todas las series con filtros
 * 4. Si es LOTE: Muestra distribución por ubicación
 * 5. Permite editar/eliminar el elemento
 * 6. Permite agregar/editar/eliminar series o lotes
 *
 * RUTAS:
 * /categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId
 *
 * @example
 * // URL: /categorias/1/subcategorias/5/elementos/12
 * // Muestra detalle del elemento con ID 12
 */
function ElementoDetallePage() {
  // ============================================
  // 1. HOOKS DE REACT ROUTER
  // ============================================

  /**
   * useParams: Extrae parámetros de la URL
   * - categoriaId: ID de la categoría padre
   * - subcategoriaId: ID de la subcategoría
   * - elementoId: ID del elemento a mostrar
   */
  const { categoriaId, subcategoriaId, elementoId } = useParams()

  /**
   * useNavigate: Función para navegar entre páginas
   */
  const navigate = useNavigate()

  // ============================================
  // 2. ESTADOS LOCALES
  // ============================================

  /**
   * filtroEstado: Para filtrar series/lotes por estado
   * null = mostrar todos
   * 'nuevo', 'bueno', etc = mostrar solo ese estado
   */
  const [filtroEstado, setFiltroEstado] = useState(null)

  /**
   * Estados de modales
   */
  const [showEditElementoModal, setShowEditElementoModal] = useState(false)
  const [showAddSerieModal, setShowAddSerieModal] = useState(false)
  const [serieParaEditar, setSerieParaEditar] = useState(null)
  const [loteParaMover, setLoteParaMover] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ============================================
  // 3. HOOKS DE DATOS
  // ============================================

  /**
   * useGetElemento: Obtiene datos básicos del elemento
   *
   * DEVUELVE:
   * - elemento: Objeto con nombre, descripción, icono, etc
   * - isLoading: true mientras carga
   * - error: Si hubo error
   */
  const {
    elemento,
    isLoading: loadingElemento,
    error: errorElemento,
    refetch: refetchElemento
  } = useGetElemento(elementoId)

  /**
   * DECISIÓN: ¿Qué hook usar para los detalles?
   *
   * Si el elemento requiere_series = true:
   *   → useGetSeries
   *
   * Si el elemento requiere_series = false:
   *   → useGetLotes
   *
   * NOTA: Solo llamamos el hook correspondiente
   * usando el parámetro 'enabled'
   */

  /**
   * useGetSeriesConContexto: Para elementos con tracking individual
   * Incluye info de evento actual y próximo evento por serie
   */
  const {
    series = [],
    isLoading: loadingSeries,
    refetch: refetchSeries
  } = useGetSeriesConContexto(elementoId, {
    enabled: !!elemento?.requiere_series
  })

  /**
   * useGetLotesConContexto: Para elementos con tracking por cantidad
   * Incluye desglose de cantidades en eventos activos
   */
  const {
    lotes_por_ubicacion: lotesPorUbicacionRaw = [],
    en_eventos = [],
    isLoading: loadingLotes,
  } = useGetLotesConContexto(elementoId, {
    enabled: elemento ? !elemento.requiere_series : false
  })

  // Mapear formato de lotes_por_ubicacion para compatibilidad con LoteUbicacionGroup
  const lotes_por_ubicacion = useMemo(() =>
    lotesPorUbicacionRaw.map(ub => ({
      nombre: ub.ubicacion,
      lotes: ub.lotes,
      cantidad_total: ub.total
    })),
    [lotesPorUbicacionRaw]
  )

  // Extraer array plano de lotes para filtrado
  const lotes = useMemo(() =>
    lotesPorUbicacionRaw.flatMap(ub => ub.lotes),
    [lotesPorUbicacionRaw]
  )

  // ============================================
  // 3B. MUTATIONS (Operaciones de escritura)
  // ============================================

  /**
   * useDeleteElemento: Mutation para eliminar el elemento
   */
  const deleteElemento = useDeleteElemento()

  /**
   * useDeleteSerie: Mutation para eliminar una serie
   */
  const deleteSerie = useDeleteSerie()

  /**
   * useDeleteLote: Mutation para eliminar un lote
   */
  const deleteLote = useDeleteLote()

  /**
   * Hooks de imagen: Subir y eliminar imagen del elemento
   */
  const subirImagen = useSubirImagenElemento()
  const eliminarImagen = useEliminarImagenElemento()

  // ============================================
  // 4. VARIABLES DERIVADAS
  // ============================================

  /**
   * isLoading: Combina los estados de carga
   * true si cualquiera está cargando
   */
  const isLoading = loadingElemento ||
    (elemento?.requiere_series ? loadingSeries : loadingLotes)

  /**
   * estadisticas: Calculadas desde los datos de series/lotes
   */
  const estadisticas = useMemo(() => {
    if (elemento?.requiere_series) {
      return series.reduce((stats, serie) => {
        const estado = serie.estado || 'sin_estado'
        stats[estado] = (stats[estado] || 0) + 1
        return stats
      }, { bueno: 0, alquilado: 0, mantenimiento: 0, dañado: 0 })
    } else {
      return lotes.reduce((stats, lote) => {
        const estado = lote.estado || 'sin_estado'
        stats[estado] = (stats[estado] || 0) + (lote.cantidad || 0)
        return stats
      }, { bueno: 0, alquilado: 0, mantenimiento: 0, dañado: 0 })
    }
  }, [elemento?.requiere_series, series, lotes])

  /**
   * itemsFiltrados: Series o lotes filtrados por estado
   */
  const itemsFiltrados = elemento?.requiere_series
    ? (filtroEstado
        ? series.filter(s => s.estado === filtroEstado)
        : series
      )
    : (filtroEstado
        ? lotes.filter(l => l.estado === filtroEstado)
        : lotes
      )

  // ============================================
  // 5. HANDLERS
  // ============================================

  /**
   * Handler: Volver a la lista de elementos
   */
  const handleGoBack = () => {
    navigate(`/inventario/categorias/${categoriaId}/subcategorias/${subcategoriaId}/elementos`)
  }

  /**
   * Handler: Editar el elemento
   *
   * ¿QUÉ HACE?
   * Abre el modal de edición con los datos del elemento
   */
  const handleEditElemento = () => {
    setShowEditElementoModal(true)
  }

  /**
   * Handler: Eliminar el elemento
   *
   * ¿QUÉ HACE?
   * 1. Muestra confirmación
   * 2. Valida que no tenga series/lotes
   * 3. Llama a la mutation de eliminar
   * 4. Navega de vuelta a la lista
   */
  const handleDeleteElemento = () => {
    // Validar que no tenga series/lotes
    const tieneSeries = elemento?.requiere_series && series.length > 0
    const tieneLotes = !elemento?.requiere_series && lotes.reduce((sum, l) => sum + (l.cantidad || 0), 0) > 0

    if (tieneSeries || tieneLotes) {
      toast.error('No se puede eliminar un elemento que tiene series o lotes asociados')
      return
    }

    setDeleteConfirm({
      type: 'elemento',
      title: `¿Eliminar "${elemento?.nombre}"?`,
      message: 'Se eliminará este elemento del inventario. Esta acción no se puede deshacer.'
    })
  }

  const handleConfirmDelete = () => {
    const { type, data } = deleteConfirm
    if (type === 'elemento') {
      deleteElemento.mutate(elementoId, {
        onSuccess: () => {
          setDeleteConfirm(null)
          toast.success('Elemento eliminado exitosamente')
          navigate(`/inventario/categorias/${categoriaId}/subcategorias/${subcategoriaId}/elementos`)
        },
        onError: (error) => {
          setDeleteConfirm(null)
          toast.error(error.message || 'Error al eliminar elemento')
        }
      })
    } else if (type === 'serie') {
      deleteSerie.mutate(data.id, {
        onSuccess: () => {
          setDeleteConfirm(null)
          toast.success(`Serie "${data.numero_serie}" eliminada`)
          refetchElemento()
          refetchSeries()
        },
        onError: (error) => {
          setDeleteConfirm(null)
          toast.error(error.message || 'Error al eliminar serie')
        }
      })
    } else if (type === 'lote') {
      deleteLote.mutate(data.id, {
        onSuccess: () => {
          setDeleteConfirm(null)
          toast.success('Lote eliminado exitosamente')
          refetchElemento()
        },
        onError: (error) => {
          setDeleteConfirm(null)
          toast.error(error.message || 'Error al eliminar lote')
        }
      })
    }
  }

  /**
   * Handler: Agregar nueva serie o lote
   */
  const handleAdd = () => {
    if (elemento?.requiere_series) {
      setShowAddSerieModal(true)
    } else {
      // Para lotes, usar el modal de mover con datos vacíos
      toast.info('Usa el botón de agregar cantidad en cada ubicación')
    }
  }

  /**
   * Handler: Editar serie
   */
  const handleEditSerie = (serie) => {
    setSerieParaEditar(serie)
  }

  /**
   * Handler: Eliminar serie
   */
  const handleDeleteSerie = (serie) => {
    setDeleteConfirm({
      type: 'serie',
      data: serie,
      title: `¿Eliminar serie "${serie.numero_serie}"?`,
      message: 'Se eliminará esta unidad del inventario. Esta acción no se puede deshacer.'
    })
  }

  /**
   * Handler: Mover serie
   */
  const handleMoveSerie = (serie) => {
    // Para mover serie, usar el modal de editar con la serie
    setSerieParaEditar(serie)
  }

  /**
   * Handler: Editar lote
   */
  const handleEditLote = (lote, ubicacion) => {
    // Para editar lote, abrir modal de mover cantidad
    setLoteParaMover({ lote, ubicacion, elemento })
  }

  /**
   * Handler: Mover lote (cambiar cantidad de ubicación/estado)
   */
  const handleMoveLote = (lote, ubicacion) => {
    setLoteParaMover({ lote, ubicacion, elemento })
  }

  /**
   * Handler: Eliminar lote
   */
  const handleDeleteLote = (lote, ubicacion) => {
    setDeleteConfirm({
      type: 'lote',
      data: lote,
      title: '¿Eliminar lote?',
      message: `Se eliminarán ${lote.cantidad} unidades en estado "${lote.estado}" de "${ubicacion || 'Sin ubicación'}". Esta acción no se puede deshacer.`
    })
  }

  /**
   * Handler: Cambiar filtro de estado
   *
   * @param {string} estado - Estado a filtrar (null = todos)
   */
  const handleFiltroEstado = (estado) => {
    // Si ya está seleccionado, quitarlo (mostrar todos)
    if (filtroEstado === estado) {
      setFiltroEstado(null)
    } else {
      setFiltroEstado(estado)
    }
  }

  // ============================================
  // 6. BREADCRUMB
  // ============================================
  // NOTA: La ruta /subcategorias/:id no existe como página separada
  // Las subcategorías se muestran en la página de categoría
  const breadcrumbItems = [
    { label: 'Inventario', path: '/inventario' },
    {
      label: elemento?.categoria_padre_nombre || 'Categoría',
      path: `/inventario/categorias/${categoriaId}`
    },
    {
      label: elemento?.subcategoria_nombre || 'Elementos',
      path: `/inventario/categorias/${categoriaId}/subcategorias/${subcategoriaId}/elementos`
    },
    { label: elemento?.nombre || 'Detalle' }
  ]

  // ============================================
  // 7. RENDERIZADO CONDICIONAL
  // ============================================

  /**
   * LOADING: Mientras carga
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  /**
   * ERROR: Si hubo error
   */
  if (errorElemento) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Error al cargar elemento
          </h2>
          <p className="text-red-600 mb-4">
            {errorElemento.message || 'Ocurrió un error desconocido'}
          </p>
          <Button variant="outline" onClick={refetchElemento}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  /**
   * NOT FOUND: Si no existe el elemento
   */
  if (!elemento) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          type="no-data"
          title="Elemento no encontrado"
          description="El elemento que buscas no existe"
          action={{
            label: 'Volver a elementos',
            onClick: handleGoBack
          }}
        />
      </div>
    )
  }

  // ============================================
  // 8. RENDERIZADO PRINCIPAL
  // ============================================

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ============================================
          SIDEBAR DE NAVEGACIÓN
          ============================================ */}
      <aside className="w-52 bg-slate-900 flex-shrink-0 flex flex-col">
        {/* Header */}
        <div className="px-4 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Inventario</span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {[
            { icon: Layers, label: 'Categorías', path: '/inventario', active: true },
            { icon: BarChart3, label: 'Analítica', path: '/inventario/dashboard' },
            { icon: MapPin, label: 'Ubicaciones', path: '/configuracion/ubicaciones' },
            { icon: Settings, label: 'Configuración', path: '/configuracion' },
          ].map(({ icon: Icon, label, path, active }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">

      {/* ============================================
          HEADER
          ============================================ */}
      <div className="mb-6">
        {/* Breadcrumb + Volver */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Card de info del elemento */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Barra de acento */}
          <div className={`h-1.5 ${elemento.requiere_series
            ? 'bg-gradient-to-r from-purple-500 to-violet-500'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
          }`} />

          <div className="p-6">
            <div className="flex gap-6">
              {/* Imagen del elemento */}
              <div className="flex-shrink-0">
                <ImageUpload
                  imagenUrl={elemento.imagen}
                  onSubir={(archivo) => {
                    subirImagen.mutate(
                      { elementoId: elemento.id, archivo },
                      {
                        onSuccess: () => { toast.success('Imagen actualizada'); refetchElemento() },
                        onError: () => toast.error('Error al subir imagen')
                      }
                    )
                  }}
                  onEliminar={() => {
                    eliminarImagen.mutate(elemento.id, {
                      onSuccess: () => { toast.success('Imagen eliminada'); refetchElemento() },
                      onError: () => toast.error('Error al eliminar imagen')
                    })
                  }}
                  isUploading={subirImagen.isPending}
                  size="lg"
                />
              </div>

              {/* Información del elemento */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-slate-900 truncate">
                      {elemento.nombre}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {elemento.subcategoria_nombre} &middot; {elemento.categoria_padre_nombre}
                    </p>
                  </div>

                  {/* Acciones principales */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={handleDeleteElemento}
                    >
                      Eliminar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={handleEditElemento}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={handleAdd}
                    >
                      {elemento.requiere_series ? 'Agregar serie' : 'Agregar lote'}
                    </Button>
                  </div>
                </div>

                {/* Descripción */}
                {elemento.descripcion && (
                  <p className="text-slate-600 mt-2 max-w-2xl text-sm">
                    {elemento.descripcion}
                  </p>
                )}

                {/* Badges: tipo de gestión + material + unidad */}
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {elemento.requiere_series ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Gestión por Series
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      Gestión por Lotes
                    </span>
                  )}
                  {elemento.material && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {elemento.material}
                    </span>
                  )}
                  {elemento.unidad && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {elemento.unidad}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          ESTADÍSTICAS - Click para filtrar
          ============================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Total"
          value={elemento.requiere_series ? series.length : lotes.reduce((sum, l) => sum + (l.cantidad || 0), 0)}
          color="gray"
          size="md"
          onClick={() => setFiltroEstado(null)}
          active={!filtroEstado}
        />
        <StatCard
          label="Bueno"
          value={estadisticas?.bueno || 0}
          color="green"
          size="md"
          onClick={() => handleFiltroEstado('bueno')}
          active={filtroEstado === 'bueno'}
        />
        <StatCard
          label="Alquilado"
          value={estadisticas?.alquilado || 0}
          color="blue"
          size="md"
          onClick={() => handleFiltroEstado('alquilado')}
          active={filtroEstado === 'alquilado'}
        />
        <StatCard
          label="Mantenimiento"
          value={estadisticas?.mantenimiento || 0}
          color="yellow"
          size="md"
          onClick={() => handleFiltroEstado('mantenimiento')}
          active={filtroEstado === 'mantenimiento'}
        />
        <StatCard
          label="Dañado"
          value={estadisticas?.['dañado'] || 0}
          color="red"
          size="md"
          onClick={() => handleFiltroEstado('dañado')}
          active={filtroEstado === 'dañado'}
        />
      </div>

      {/* ============================================
          RESUMEN DE EVENTOS (cuando filtro es alquilado)
          ============================================ */}
      {filtroEstado === 'alquilado' && !elemento.requiere_series && en_eventos.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">En eventos activos</h3>
          <div className="grid gap-2 lg:grid-cols-2">
            {en_eventos.map((evento) => (
              <div
                key={evento.alquiler_id}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-blue-900 text-sm truncate">
                    {evento.evento_nombre || 'Evento sin nombre'}
                  </span>
                  <span className="ml-auto text-lg font-bold text-blue-700 flex-shrink-0">
                    {evento.cantidad}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-blue-700">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{evento.cliente}</span>
                  </div>
                  {evento.fecha_evento && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatearFechaCorta(evento.fecha_evento)}
                        {evento.fecha_desmontaje && <> - {formatearFechaCorta(evento.fecha_desmontaje)}</>}
                      </span>
                    </div>
                  )}
                </div>
                {evento.ubicacion && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{evento.ubicacion}</span>
                    {evento.ciudad && <span>({evento.ciudad})</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          CONTENIDO PRINCIPAL (Series o Lotes)
          ============================================ */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>
              {elemento.requiere_series ? 'Series' : 'Lotes por Ubicación'}
              {filtroEstado
                ? ` — ${filtroEstado.charAt(0).toUpperCase() + filtroEstado.slice(1)} (${itemsFiltrados.length})`
                : ''
              }
            </Card.Title>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAdd}
            >
              {elemento.requiere_series ? 'Agregar Serie' : 'Agregar Lote'}
            </Button>
          </div>
        </Card.Header>

        <Card.Content>
          {/* ==========================================
              VISTA PARA SERIES
              ========================================== */}
          {!!elemento.requiere_series && (
            <>
              {itemsFiltrados.length === 0 ? (
                <EmptyState
                  type="no-results"
                  title="No hay series"
                  description={filtroEstado
                    ? `No hay series en estado ${filtroEstado}`
                    : 'Agrega la primera serie'
                  }
                  action={!filtroEstado && {
                    label: 'Agregar serie',
                    onClick: handleAdd,
                    icon: <Plus />
                  }}
                />
              ) : (
                <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  {itemsFiltrados.map((serie) => (
                    <SerieItem
                      key={serie.id}
                      serie={serie}
                      onEdit={handleEditSerie}
                      onDelete={handleDeleteSerie}
                      onMove={handleMoveSerie}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ==========================================
              VISTA PARA LOTES
              ========================================== */}
          {!elemento.requiere_series && (
            <>
              {lotes_por_ubicacion.length === 0 ? (
                <EmptyState
                  type="no-data"
                  title="No hay lotes"
                  description="Agrega el primer lote"
                  action={{
                    label: 'Agregar lote',
                    onClick: handleAdd,
                    icon: <Plus />
                  }}
                />
              ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  {lotes_por_ubicacion.map((ubicacion, idx) => (
                    <LoteUbicacionGroup
                      key={ubicacion.nombre || idx}
                      ubicacion={ubicacion}
                      defaultExpanded
                      onEditLote={handleEditLote}
                      onMoveLote={handleMoveLote}
                      onDeleteLote={handleDeleteLote}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* ============================================
          MODALES
          ============================================ */}

      {/* Modal: Editar Elemento */}
      {showEditElementoModal && (
        <ElementoFormModal
          isOpen={showEditElementoModal}
          onClose={() => setShowEditElementoModal(false)}
          onSuccess={() => {
            setShowEditElementoModal(false)
            refetchElemento()
          }}
          elemento={{
            ...elemento,
            cantidad: elemento.requiere_series
              ? series.length
              : lotes.reduce((sum, l) => sum + (l.cantidad || 0), 0)
          }}
        />
      )}

      {/* Modal: Agregar Serie */}
      {showAddSerieModal && !!elemento?.requiere_series && (
        <SerieFormModal
          isOpen={showAddSerieModal}
          onClose={() => setShowAddSerieModal(false)}
          onSuccess={() => {
            setShowAddSerieModal(false)
            refetchElemento()
            refetchSeries()
          }}
          elemento={elemento}
        />
      )}

      {/* Modal: Editar Serie */}
      {serieParaEditar && (
        <SerieFormModal
          isOpen={!!serieParaEditar}
          onClose={() => setSerieParaEditar(null)}
          onSuccess={() => {
            setSerieParaEditar(null)
            refetchElemento()
            refetchSeries()
          }}
          elemento={elemento}
          serie={serieParaEditar}
        />
      )}

      {/* Modal: Mover Cantidad (Lotes) */}
      {loteParaMover && (
        <LoteFormModal
          isOpen={!!loteParaMover}
          onClose={() => setLoteParaMover(null)}
          onSuccess={() => {
            setLoteParaMover(null)
            refetchElemento()
          }}
          lote={loteParaMover.lote}
          ubicacionOrigen={loteParaMover.ubicacion}
          elemento={loteParaMover.elemento}
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
        loading={deleteElemento.isPending || deleteSerie.isPending || deleteLote.isPending}
      />
    </div>
      </main>
    </div>
  )
}

export default ElementoDetallePage

/**
 * ============================================
 * 🎓 CONCEPTOS CLAVE
 * ============================================
 *
 * 1. CONDITIONAL HOOK CALLS:
 * ──────────────────────────
 * useGetSeries(elementoId, { enabled: elemento?.requiere_series })
 *
 * El parámetro 'enabled' hace que el hook solo se ejecute
 * cuando la condición es true. Esto es importante para
 * no hacer peticiones innecesarias.
 *
 *
 * 2. VARIABLES DERIVADAS:
 * ───────────────────────
 * const estadisticas = elemento?.requiere_series
 *   ? estadisticasSeries
 *   : estadisticasLotes
 *
 * Calculamos valores basados en el estado/props.
 * Se recalculan automáticamente cuando cambian las dependencias.
 *
 *
 * 3. FILTRADO DE ARRAYS:
 * ─────────────────────
 * const filtrados = items.filter(item => item.estado === filtro)
 *
 * filter() crea un nuevo array con los elementos que cumplen
 * la condición. No modifica el array original.
 *
 *
 * 4. OPTIONAL CHAINING:
 * ────────────────────
 * elemento?.nombre
 *
 * Si elemento es null/undefined, devuelve undefined
 * en lugar de lanzar error.
 *
 *
 * 5. RENDERIZADO CONDICIONAL:
 * ──────────────────────────
 * {elemento.requiere_series ? <ComponenteA /> : <ComponenteB />}
 *
 * Muestra un componente u otro según la condición.
 */
