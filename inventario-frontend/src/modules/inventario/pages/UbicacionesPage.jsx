// ============================================
// PAGINA: UBICACIONES Y DESTINOS
// Seccion 1: Almacenamiento (bodegas, talleres)
// Seccion 2: Destinos de evento (agrupados por ciudad)
// ============================================

import { useState, useMemo } from 'react'
import { Plus, MapPin, ArrowLeft, Warehouse, Navigation, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetUbicaciones,
  useDeleteUbicacion
} from '../hooks/useUbicaciones'
import { useGetCiudadesActivas } from '@clientes/hooks/useCiudades'
import UbicacionCard from '../components/cards/UbicacionCard'
import UbicacionFormModal from '../components/forms/UbicacionFormModal'
import DireccionesCiudadModal from '@clientes/components/modals/DireccionesCiudadModal'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import EmptyState from '@shared/components/EmptyState'
import { useTranslation } from 'react-i18next'

// Tipos que son de almacenamiento
const TIPOS_ALMACENAMIENTO = ['bodega', 'taller', 'transito']

export default function UbicacionesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // ============================================
  // HOOKS
  // ============================================

  const { ubicaciones, isLoading, error, refetch } = useGetUbicaciones()
  const { mutateAsync: deleteUbicacion, isLoading: isDeleting } = useDeleteUbicacion()
  const { ciudades, isLoading: loadingCiudades } = useGetCiudadesActivas()

  // ============================================
  // STATE
  // ============================================

  const [modalState, setModalState] = useState({ crear: false, editar: false })
  const [selectedUbicacion, setSelectedUbicacion] = useState(null)
  const [preselectedTipo, setPreselectedTipo] = useState(null)
  const [direccionesModal, setDireccionesModal] = useState({ open: false, ciudad: null })
  const [ciudadesExpandidas, setCiudadesExpandidas] = useState({})
  const [busquedaDestinos, setBusquedaDestinos] = useState('')

  // ============================================
  // DATOS DERIVADOS
  // ============================================

  const { almacenamiento, destinos, destinosPorCiudad } = useMemo(() => {
    const alm = ubicaciones.filter(u => TIPOS_ALMACENAMIENTO.includes(u.tipo))
    const dest = ubicaciones.filter(u => !TIPOS_ALMACENAMIENTO.includes(u.tipo))

    // Agrupar destinos por ciudad
    const porCiudad = {}
    dest.forEach(u => {
      const ciudadKey = u.ciudad_id || 'sin-ciudad'
      const ciudadNombre = u.ciudad || 'Sin ciudad asignada'
      if (!porCiudad[ciudadKey]) {
        porCiudad[ciudadKey] = {
          ciudadId: u.ciudad_id,
          ciudadNombre,
          ubicaciones: []
        }
      }
      porCiudad[ciudadKey].ubicaciones.push(u)
    })

    return { almacenamiento: alm, destinos: dest, destinosPorCiudad: porCiudad }
  }, [ubicaciones])

  // Filtrar destinos por busqueda
  const ciudadesConDestinos = useMemo(() => {
    const grupos = Object.values(destinosPorCiudad)
    if (!busquedaDestinos.trim()) return grupos

    const term = busquedaDestinos.toLowerCase()
    return grupos
      .map(grupo => ({
        ...grupo,
        ubicaciones: grupo.ubicaciones.filter(u =>
          u.nombre.toLowerCase().includes(term) ||
          (u.direccion && u.direccion.toLowerCase().includes(term)) ||
          grupo.ciudadNombre.toLowerCase().includes(term)
        )
      }))
      .filter(grupo => grupo.ubicaciones.length > 0)
  }, [destinosPorCiudad, busquedaDestinos])

  // Ciudades activas que NO tienen destinos aun
  const ciudadesSinDestinos = useMemo(() => {
    const ciudadesConDestinosIds = new Set(
      Object.values(destinosPorCiudad)
        .map(g => g.ciudadId)
        .filter(Boolean)
    )
    return ciudades.filter(c => !ciudadesConDestinosIds.has(c.id))
  }, [ciudades, destinosPorCiudad])

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrearAlmacenamiento = () => {
    setPreselectedTipo('bodega')
    setSelectedUbicacion(null)
    setModalState({ crear: true, editar: false })
  }

  const handleOpenCrearDestino = () => {
    setPreselectedTipo('evento')
    setSelectedUbicacion(null)
    setModalState({ crear: true, editar: false })
  }

  const handleCloseModal = () => {
    setModalState({ crear: false, editar: false })
    setSelectedUbicacion(null)
    setPreselectedTipo(null)
  }

  const handleEdit = (ubicacion) => {
    setSelectedUbicacion(ubicacion)
    setPreselectedTipo(null)
    setModalState({ crear: false, editar: true })
  }

  const handleDelete = async (id) => {
    try {
      await deleteUbicacion(id)
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo eliminar. Puede tener inventario asociado.')
    }
  }

  const toggleCiudad = (ciudadKey) => {
    setCiudadesExpandidas(prev => ({
      ...prev,
      [ciudadKey]: !prev[ciudadKey]
    }))
  }

  const handleAbrirDirecciones = (ciudad) => {
    setDireccionesModal({ open: true, ciudad })
  }

  // ============================================
  // RENDER: Estados de carga y error
  // ============================================

  if (isLoading) {
    return <Spinner fullScreen size="xl" text={t('inventory.loadingLocations')} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error al cargar ubicaciones</h2>
          <p className="text-slate-600 mb-6">{error.message || 'Error inesperado'}</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/configuracion')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Ubicaciones y Destinos
                  </h1>
                  <p className="text-sm text-slate-600">
                    Almacenamiento de inventario y destinos de evento
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-10">

        {/* ============================================
            SECCION 1: ALMACENAMIENTO
            ============================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Warehouse className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Almacenamiento
                </h2>
                <p className="text-sm text-slate-500">
                  Bodegas, talleres y puntos de transito donde se guarda el inventario
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCrearAlmacenamiento}
            >
              Nueva Bodega
            </Button>
          </div>

          {almacenamiento.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {almacenamiento.map((ubicacion) => (
                <UbicacionCard
                  key={ubicacion.id}
                  ubicacion={ubicacion}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
              <Warehouse className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No hay bodegas o talleres registrados</p>
              <p className="text-xs text-slate-500 mt-1">Crea tu primera bodega para organizar el inventario</p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenCrearAlmacenamiento}
                className="mt-4"
              >
                Crear bodega
              </Button>
            </div>
          )}
        </section>

        {/* Separador visual */}
        <div className="border-t border-slate-200" />

        {/* ============================================
            SECCION 2: DESTINOS DE EVENTO
            ============================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Navigation className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Destinos de Evento
                </h2>
                <p className="text-sm text-slate-500">
                  Lugares de eventos agrupados por ciudad &middot;{' '}
                  <button
                    onClick={() => navigate('/configuracion/ciudades')}
                    className="text-green-600 hover:text-green-700 font-medium hover:underline"
                  >
                    Gestionar ciudades
                  </button>
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCrearDestino}
            >
              Nuevo Destino
            </Button>
          </div>

          {/* Buscador de destinos */}
          {destinos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 mb-4">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('inventory.searchDestination')}
                  value={busquedaDestinos}
                  onChange={(e) => setBusquedaDestinos(e.target.value)}
                  className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400"
                />
                {busquedaDestinos && (
                  <button
                    onClick={() => setBusquedaDestinos('')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grupos por ciudad */}
          {ciudadesConDestinos.length > 0 ? (
            <div className="space-y-3">
              {ciudadesConDestinos.map((grupo) => {
                const key = grupo.ciudadId || 'sin-ciudad'
                const isExpanded = ciudadesExpandidas[key] !== false // expandido por defecto
                const ciudadObj = ciudades.find(c => c.id === grupo.ciudadId)

                return (
                  <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header de ciudad */}
                    <button
                      onClick={() => toggleCiudad(key)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-slate-900">
                            {grupo.ciudadNombre}
                          </span>
                          {ciudadObj?.departamento && (
                            <span className="text-xs text-slate-500 ml-2">
                              {ciudadObj.departamento}
                            </span>
                          )}
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                          {grupo.ubicaciones.length} destino{grupo.ubicaciones.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ciudadObj && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAbrirDirecciones(ciudadObj)
                            }}
                            className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline cursor-pointer"
                          >
                            + Agregar
                          </span>
                        )}
                        {isExpanded
                          ? <ChevronDown className="w-5 h-5 text-slate-400" />
                          : <ChevronRight className="w-5 h-5 text-slate-400" />
                        }
                      </div>
                    </button>

                    {/* Contenido expandible */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {grupo.ubicaciones.map((ubicacion) => (
                            <UbicacionCard
                              key={ubicacion.id}
                              ubicacion={ubicacion}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : destinos.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
              <Navigation className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No hay destinos de evento registrados</p>
              <p className="text-xs text-slate-500 mt-1">
                Agrega destinos desde aqui o desde el{' '}
                <button
                  onClick={() => navigate('/configuracion/ciudades')}
                  className="text-green-600 hover:underline font-medium"
                >
                  catalogo de ciudades
                </button>
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenCrearDestino}
                className="mt-4"
              >
                Crear destino
              </Button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500">No se encontraron resultados para "{busquedaDestinos}"</p>
            </div>
          )}

          {/* Ciudades sin destinos - acceso rapido */}
          {ciudadesSinDestinos.length > 0 && !busquedaDestinos && (
            <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
                Ciudades sin destinos registrados
              </p>
              <div className="flex flex-wrap gap-2">
                {ciudadesSinDestinos.map(ciudad => (
                  <button
                    key={ciudad.id}
                    onClick={() => handleAbrirDirecciones(ciudad)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {ciudad.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ============================================
          MODALES
          ============================================ */}

      <UbicacionFormModal
        isOpen={modalState.crear}
        onClose={handleCloseModal}
        mode="crear"
        ubicacion={null}
        preselectedTipo={preselectedTipo}
      />

      <UbicacionFormModal
        isOpen={modalState.editar}
        onClose={handleCloseModal}
        mode="editar"
        ubicacion={selectedUbicacion}
      />

      <DireccionesCiudadModal
        isOpen={direccionesModal.open}
        onClose={() => setDireccionesModal({ open: false, ciudad: null })}
        ciudad={direccionesModal.ciudad}
      />

      {/* Indicador de eliminacion */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm font-medium text-slate-700">Eliminando ubicacion...</span>
        </div>
      )}
    </div>
  )
}
