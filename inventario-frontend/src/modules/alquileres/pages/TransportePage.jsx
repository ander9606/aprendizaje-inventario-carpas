// ============================================
// PÁGINA: Transporte
// Vista de tarifas de transporte por ciudad
// Consulta de tarifas sin mostrar direcciones asociadas
// ============================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Search, MapPin, ExternalLink, Info, Filter, ChevronDown } from 'lucide-react'
import { useGetCiudades } from '@clientes/hooks/useCiudades'
import { useGetDepartamentosActivos } from '@clientes/hooks/useDepartamentos'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'

// Tipos de camión disponibles
const TIPOS_CAMION = [
  { id: 'Pequeño', nombre: 'Pequeño', descripcion: 'Hasta 3 ton' },
  { id: 'Mediano', nombre: 'Mediano', descripcion: '3-8 ton' },
  { id: 'Grande', nombre: 'Grande', descripcion: '8-15 ton' },
  { id: 'Extragrande', nombre: 'Extragrande', descripcion: '+15 ton' }
]

const formatearMoneda = (valor) => {
  if (!valor) return '-'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor)
}

export default function TransportePage() {
  const navigate = useNavigate()
  const { ciudades, isLoading, error, refetch } = useGetCiudades()
  const { departamentos } = useGetDepartamentosActivos()

  const [busqueda, setBusqueda] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('')
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const [filtroTipoCamion, setFiltroTipoCamion] = useState('')

  // Solo ciudades activas
  const ciudadesActivas = useMemo(() =>
    ciudades.filter(c => c.activo !== false),
    [ciudades]
  )

  // Departamentos únicos de las ciudades activas
  const departamentosUnicos = useMemo(() => {
    const deps = new Set()
    ciudadesActivas.forEach(c => {
      if (c.departamento) deps.add(c.departamento)
    })
    return Array.from(deps).sort()
  }, [ciudadesActivas])

  // Filtrado de ciudades
  const ciudadesFiltradas = useMemo(() => {
    let resultado = ciudadesActivas

    // Filtro por búsqueda de texto
    if (busqueda) {
      const term = busqueda.toLowerCase()
      resultado = resultado.filter(c =>
        c.nombre.toLowerCase().includes(term) ||
        (c.departamento && c.departamento.toLowerCase().includes(term))
      )
    }

    // Filtro por departamento
    if (filtroDepartamento) {
      resultado = resultado.filter(c => c.departamento === filtroDepartamento)
    }

    // Filtro por ciudad específica
    if (filtroCiudad) {
      resultado = resultado.filter(c => c.id === parseInt(filtroCiudad))
    }

    return resultado
  }, [ciudadesActivas, busqueda, filtroDepartamento, filtroCiudad])

  // Estadísticas
  const totalCiudades = ciudadesActivas.length
  const ciudadesConTarifas = ciudadesActivas.filter(c =>
    c.tarifas && Object.values(c.tarifas).some(t => t)
  ).length

  const hayFiltrosActivos = busqueda || filtroDepartamento || filtroCiudad || filtroTipoCamion

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroDepartamento('')
    setFiltroCiudad('')
    setFiltroTipoCamion('')
  }

  // Columnas de camión a mostrar (filtradas si hay filtro de tipo)
  const tiposCamionVisibles = filtroTipoCamion
    ? TIPOS_CAMION.filter(t => t.id === filtroTipoCamion)
    : TIPOS_CAMION

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Cargando tarifas de transporte..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar tarifas: {error.message || 'Ocurrió un error inesperado'}
          <Button variant="ghost" onClick={() => refetch()} className="ml-4">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              Transporte
            </h1>
            <p className="text-slate-500 mt-1">
              Consulta las tarifas de transporte por ciudad y tipo de camión
            </p>
          </div>

          <Button
            variant="secondary"
            icon={<ExternalLink className="w-4 h-4" />}
            onClick={() => navigate('/configuracion/ciudades')}
          >
            Administrar Ciudades
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalCiudades}</p>
              <p className="text-sm text-slate-500">Ciudades</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{ciudadesConTarifas}</p>
              <p className="text-sm text-slate-500">Con tarifas</p>
            </div>
          </div>
        </div>
        {TIPOS_CAMION.slice(0, 2).map(tipo => {
          const ciudadesConEste = ciudadesActivas.filter(c =>
            c.tarifas?.[tipo.id]
          ).length
          return (
            <div key={tipo.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Truck className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{ciudadesConEste}</p>
                  <p className="text-sm text-slate-500">{tipo.nombre}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 space-y-4">
        {/* Barra de búsqueda */}
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ciudad o departamento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400 outline-none"
          />
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-blue-600 hover:underline whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filtros avanzados */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            Filtrar por:
          </div>

          {/* Filtro por departamento */}
          <div className="relative">
            <select
              value={filtroDepartamento}
              onChange={(e) => {
                setFiltroDepartamento(e.target.value)
                setFiltroCiudad('')
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
            >
              <option value="">Todos los departamentos</option>
              {departamentosUnicos.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro por ciudad */}
          <div className="relative">
            <select
              value={filtroCiudad}
              onChange={(e) => setFiltroCiudad(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
            >
              <option value="">Todas las ciudades</option>
              {(filtroDepartamento
                ? ciudadesActivas.filter(c => c.departamento === filtroDepartamento)
                : ciudadesActivas
              ).map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro por tipo de camión */}
          <div className="relative">
            <select
              value={filtroTipoCamion}
              onChange={(e) => setFiltroTipoCamion(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
            >
              <option value="">Todos los camiones</option>
              {TIPOS_CAMION.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre} ({tipo.descripcion})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Info de resultados */}
      <div className="mb-4 text-sm text-slate-500">
        Mostrando {ciudadesFiltradas.length} ciudad{ciudadesFiltradas.length !== 1 ? 'es' : ''}
        {hayFiltrosActivos && ' (filtrado)'}
      </div>

      {/* Tabla de tarifas */}
      {ciudadesFiltradas.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">
                    Ciudad
                  </th>
                  {tiposCamionVisibles.map(tipo => (
                    <th key={tipo.id} className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-end gap-1">
                        <Truck className="w-4 h-4" />
                        {tipo.nombre}
                      </div>
                      <span className="text-xs font-normal text-slate-500">{tipo.descripcion}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ciudadesFiltradas.map((ciudad) => (
                  <tr key={ciudad.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{ciudad.nombre}</div>
                          {ciudad.departamento && (
                            <div className="text-sm text-slate-500">{ciudad.departamento}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {tiposCamionVisibles.map(tipo => (
                      <td key={tipo.id} className="px-4 py-4 text-right text-sm">
                        {ciudad.tarifas?.[tipo.id] ? (
                          <span className="font-medium text-slate-900">
                            {formatearMoneda(ciudad.tarifas[tipo.id])}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {hayFiltrosActivos ? 'No se encontraron resultados' : 'No hay ciudades con tarifas'}
          </h3>
          <p className="text-slate-500 mb-6">
            {hayFiltrosActivos
              ? 'Intenta con otros filtros o términos de búsqueda'
              : 'Configura ciudades y tarifas desde el módulo de configuración'}
          </p>
          {hayFiltrosActivos ? (
            <Button variant="secondary" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={() => navigate('/configuracion/ciudades')}
            >
              Ir a Configuración de Ciudades
            </Button>
          )}
        </div>
      )}

      {/* Nota informativa */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Gestión de tarifas</p>
          <p>
            Para agregar o modificar ciudades y tarifas de transporte, ve a{' '}
            <button
              onClick={() => navigate('/configuracion/ciudades')}
              className="text-blue-600 underline hover:text-blue-800 font-medium"
            >
              Configuración &gt; Ciudades
            </button>.
            Las tarifas configuradas allí se utilizan automáticamente al crear cotizaciones.
            Esta vista solo muestra tarifas de transporte, sin incluir direcciones o ubicaciones asociadas.
          </p>
        </div>
      </div>
    </div>
  )
}
