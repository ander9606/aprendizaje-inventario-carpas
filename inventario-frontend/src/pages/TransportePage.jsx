// ============================================
// PÁGINA: Transporte
// Vista de tarifas de transporte por ciudad
// Relacionada con la configuración de ciudades
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Search, MapPin, ExternalLink, Info } from 'lucide-react'
import { useGetCiudades } from '../hooks/UseCiudades'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'

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
  const [busqueda, setBusqueda] = useState('')

  // Filtrar solo ciudades activas y por búsqueda
  const ciudadesFiltradas = ciudades
    .filter(c => c.activo !== false)
    .filter(c =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.departamento && c.departamento.toLowerCase().includes(busqueda.toLowerCase()))
    )

  // Estadísticas
  const totalCiudades = ciudades.filter(c => c.activo !== false).length
  const ciudadesConTarifas = ciudades.filter(c =>
    c.activo !== false && c.tarifas && Object.values(c.tarifas).some(t => t)
  ).length

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
          const ciudadesConEste = ciudades.filter(c =>
            c.activo !== false && c.tarifas?.[tipo.id]
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

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ciudad o departamento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400 outline-none"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="text-sm text-blue-600 hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mb-4 text-sm text-slate-500">
        Mostrando {ciudadesFiltradas.length} ciudad{ciudadesFiltradas.length !== 1 ? 'es' : ''}
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
                  {TIPOS_CAMION.map(tipo => (
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
                    {TIPOS_CAMION.map(tipo => (
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
            {busqueda ? 'No se encontraron ciudades' : 'No hay ciudades con tarifas'}
          </h3>
          <p className="text-slate-500 mb-6">
            {busqueda
              ? 'Intenta con otro término de búsqueda'
              : 'Configura ciudades y tarifas desde el módulo de configuración'}
          </p>
          {!busqueda && (
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
          </p>
        </div>
      </div>
    </div>
  )
}
