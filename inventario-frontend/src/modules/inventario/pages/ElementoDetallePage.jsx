// ============================================
// PÁGINA: DETALLE DE ELEMENTO
// Vista completa de un elemento específico
// ============================================

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Plus, Calendar, User, Clock, MapPin, BarChart3, Layers, Settings, Package, ArrowRightLeft, Search, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
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
import ImageUpload from '@shared/components/ImageUpload'
import ConfirmModal from '@shared/components/ConfirmModal'
import { EstadoBadge } from '@shared/components/Badge'
import SerieItem from '../components/elementos/series/SerieItem'
import LoteUbicacionGroup from '../components/elementos/lotes/LoteUbicacionGroup'
import EmptyState from '@shared/components/EmptyState'

// Modales
import ElementoFormModal from '../components/forms/ElementoFormModal'
import SerieFormModal from '../components/forms/SerieFormModal'
import LoteFormModal from '../components/forms/LoteFormModal'
import { useTranslation } from 'react-i18next'

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
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const ITEMS_POR_PAGINA = 10

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
   * Cálculos de disponibilidad para la barra de progreso
   */
  const disponibilidad = useMemo(() => {
    const total = elemento?.requiere_series
      ? series.length
      : lotes.reduce((sum, l) => sum + (l.cantidad || 0), 0)

    if (total === 0) return { total: 0, disponibles: 0, alquilados: 0, otros: 0, pctDisponible: 0, pctAlquilado: 0, pctOtros: 0 }

    const disponibles = elemento?.requiere_series
      ? (estadisticas.bueno || 0) + (estadisticas.disponible || 0) + (estadisticas.nuevo || 0)
      : (estadisticas.bueno || 0) + (estadisticas.nuevo || 0)
    const alquilados = estadisticas.alquilado || 0
    const mantenimiento = estadisticas.mantenimiento || 0
    const danados = estadisticas['dañado'] || 0
    const otros = mantenimiento + danados

    return {
      total,
      disponibles,
      alquilados,
      otros,
      pctDisponible: Math.round((disponibles / total) * 100),
      pctAlquilado: Math.round((alquilados / total) * 100),
      pctOtros: Math.round((otros / total) * 100),
    }
  }, [elemento?.requiere_series, series, lotes, estadisticas])

  /**
   * itemsFiltrados: Series o lotes filtrados por estado y búsqueda
   */
  const itemsFiltrados = useMemo(() => {
    let items = elemento?.requiere_series ? series : lotes
    if (filtroEstado) {
      items = items.filter(item => item.estado === filtroEstado)
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      items = elemento?.requiere_series
        ? items.filter(s => s.numero_serie?.toLowerCase().includes(q))
        : items.filter(l => (l.ubicacion || l.nombre || '').toLowerCase().includes(q))
    }
    return items
  }, [elemento?.requiere_series, series, lotes, filtroEstado, busqueda])

  const totalPaginas = Math.ceil(itemsFiltrados.length / ITEMS_POR_PAGINA)
  const itemsPaginados = itemsFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
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
    if (filtroEstado === estado) {
      setFiltroEstado(null)
    } else {
      setFiltroEstado(estado)
    }
    setPaginaActual(1)
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
          title={t('inventory.elementNotFound')}
          description={t('inventory.elementNotFoundDesc')}
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

  // Colores de stat cards por estado
  const statCards = [
    { key: null, value: disponibilidad.total, label: 'Total', borderColor: 'border-slate-200', textColor: 'text-slate-900' },
    { key: 'bueno', value: estadisticas?.bueno || 0, label: 'Bueno', borderColor: 'border-green-500', textColor: 'text-green-600' },
    { key: 'alquilado', value: estadisticas?.alquilado || 0, label: 'Alquilado', borderColor: 'border-amber-500', textColor: 'text-amber-600' },
    { key: 'mantenimiento', value: estadisticas?.mantenimiento || 0, label: 'Mantenimiento', borderColor: 'border-purple-500', textColor: 'text-purple-600' },
    { key: 'dañado', value: estadisticas?.['dañado'] || 0, label: 'Dañado', borderColor: 'border-red-500', textColor: 'text-red-600' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ============================================
          SIDEBAR DE NAVEGACIÓN
          ============================================ */}
      <aside className="hidden lg:flex w-[280px] bg-sidebar flex-shrink-0 flex-col border-r border-slate-200">
        <div className="px-6 lg:px-8 py-6 border-b border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">Inventario</span>
        </div>

        <nav className="flex-1 px-4 py-4">
          <p className="px-4 text-sm text-slate-500 mb-2">Navegación</p>
          {[
            { icon: Layers, label: 'Categorías', path: '/inventario', active: true },
            { icon: BarChart3, label: 'Analítica', path: '/inventario/dashboard' },
            { icon: MapPin, label: 'Ubicaciones', path: '/configuracion/ubicaciones' },
            { icon: Settings, label: 'Configuración', path: '/configuracion' },
          ].map(({ icon: Icon, label, path, active }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full text-base font-normal transition-colors mb-1 ${
                active
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <main className="flex-1 overflow-auto flex flex-col">

        {/* PAGE HEADER */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
          {/* Breadcrumb */}
          <div className="mb-2">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Title + Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{elemento.emoji || '🏕️'}</span>
              <h1 className="text-xl font-bold text-slate-900">{elemento.nombre}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="md" onClick={handleDeleteElemento}>
                Eliminar
              </Button>
              <Button variant="outline" size="md" onClick={handleEditElemento}>
                Editar
              </Button>
              <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
                {elemento.requiere_series ? 'Agregar serie' : 'Agregar lote'}
              </Button>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="flex gap-3 px-4 lg:px-6 py-4 overflow-x-auto">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => handleFiltroEstado(stat.key)}
              className={`flex-1 bg-white rounded-lg border p-3.5 text-left transition-all ${stat.borderColor} ${
                filtroEstado === stat.key
                  ? 'ring-2 ring-blue-200'
                  : 'hover:shadow-sm'
              }`}
            >
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* CONTENT ROW: InfoCol + TableCol */}
        <div className="flex flex-col lg:flex-row gap-4 px-4 lg:px-6 pb-6 flex-1 min-h-0">

          {/* INFO COLUMN (LEFT) */}
          <div className="w-[360px] flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
              {/* Image area */}
              {elemento.imagen ? (
                <div className="w-full h-[180px] bg-slate-100 overflow-hidden">
                  <img
                    src={elemento.imagen}
                    alt={elemento.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-[180px] bg-slate-100 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                </div>
              )}

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col gap-3.5">
                {/* Name + badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[17px] font-bold text-slate-900">{elemento.nombre}</h2>
                  <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                    {elemento.requiere_series ? 'Series' : 'Lotes'}
                  </span>
                </div>

                {/* Description */}
                {elemento.descripcion && (
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    {elemento.descripcion}
                  </p>
                )}

                {/* Divider */}
                <div className="h-px bg-slate-200" />

                {/* Metadata */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500">Categoría</span>
                    <span className="text-slate-900 font-medium">{elemento.categoria_padre_nombre || '-'}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500">Subcategoría</span>
                    <span className="text-slate-900 font-medium">{elemento.subcategoria_nombre || '-'}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500">Registrado</span>
                    <span className="text-slate-900 font-medium">
                      {elemento.fecha_ingreso ? formatearFechaCorta(elemento.fecha_ingreso) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500">Última actualización</span>
                    <span className="text-slate-900 font-medium">
                      {elemento.updated_at ? formatearFechaCorta(elemento.updated_at) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE COLUMN (RIGHT) */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">

            {/* Table section header: title + search */}
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">
                {elemento.requiere_series ? 'Series' : 'Lotes'} &middot; {itemsFiltrados.length} unidades
              </h3>
              <div className="relative w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 flex-1 flex flex-col overflow-hidden">
              {elemento.requiere_series ? (
                <>
                  {/* Series Table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-3 text-slate-500 font-normal">Nº de Serie</th>
                        <th className="text-left p-3 text-slate-500 font-normal">Estado</th>
                        <th className="text-left p-3 text-slate-500 font-normal">Fecha registro</th>
                        <th className="text-left p-3 text-slate-500 font-normal">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            {busqueda ? 'Sin resultados para la búsqueda' : 'No hay series'}
                          </td>
                        </tr>
                      ) : (
                        itemsPaginados.map((serie) => (
                          <tr key={serie.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 text-slate-900">{serie.numero_serie}</td>
                            <td className="p-3">
                              <EstadoBadge estado={serie.estado} size="sm" />
                            </td>
                            <td className="p-3 text-slate-500">
                              {serie.created_at ? formatearFechaCorta(serie.created_at) : '-'}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleEditSerie(serie)}
                                className="text-blue-600 hover:text-blue-800 text-[13px] font-medium"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              ) : (
                <>
                  {/* Lotes Table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-3 text-slate-500 font-normal">Ubicación</th>
                        <th className="text-left p-3 text-slate-500 font-normal">Estado</th>
                        <th className="text-left p-3 text-slate-500 font-normal">Cantidad</th>
                        <th className="text-left p-3 text-slate-500 font-normal">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            {busqueda ? 'Sin resultados para la búsqueda' : 'No hay lotes'}
                          </td>
                        </tr>
                      ) : (
                        itemsPaginados.map((lote, idx) => (
                          <tr key={lote.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 text-slate-900">{lote.ubicacion || 'Sin ubicación'}</td>
                            <td className="p-3">
                              <EstadoBadge estado={lote.estado} size="sm" />
                            </td>
                            <td className="p-3 text-slate-700">{lote.cantidad}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleEditLote(lote, lote.ubicacion)}
                                className="text-blue-600 hover:text-blue-800 text-[13px] font-medium"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {/* Pagination */}
              {itemsFiltrados.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 mt-auto">
                  <span className="text-sm text-slate-500">
                    Mostrando {itemsFiltrados.length} registros
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                      disabled={paginaActual <= 1}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual >= totalPaginas}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* MODALES */}
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

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm?.title || '¿Confirmar eliminación?'}
        message={deleteConfirm?.message || ''}
        variant="danger"
        confirmText={t('common.delete')}
        loading={deleteElemento.isPending || deleteSerie.isPending || deleteLote.isPending}
      />

      </main>
    </div>
  )
}

export default ElementoDetallePage
