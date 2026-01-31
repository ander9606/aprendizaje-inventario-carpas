// ============================================
// PÁGINA: AlquileresPage
// Dashboard de alquileres activos y programados
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import {
  useGetAlquileres,
  useGetEstadisticasAlquileres
} from '../hooks/useAlquileres'
import AlquilerCard from '../components/cards/AlquilerCard'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import AsignacionElementosModal from '../components/modals/AsignacionElementosModal'
import RetornoElementosModal from '../components/modals/RetornoElementosModal'
import { toast } from 'sonner'

// ============================================
// COMPONENTE: StatCard
// ============================================
const StatCard = ({ titulo, valor, icono: Icon, color, activo, onClick }) => {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  }

  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 transition-all w-full text-left
        ${activo
          ? `${colorClasses[color]} ring-2 ring-offset-2 ring-${color}-400`
          : 'bg-white border-slate-200 hover:border-slate-300'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg
          ${activo ? colorClasses[color] : 'bg-slate-100'}
        `}>
          <Icon className={`w-5 h-5 ${activo ? '' : 'text-slate-500'}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${activo ? '' : 'text-slate-900'}`}>
            {valor}
          </p>
          <p className={`text-sm ${activo ? '' : 'text-slate-500'}`}>
            {titulo}
          </p>
        </div>
      </div>
    </button>
  )
}

// ============================================
// COMPONENTE PRINCIPAL: AlquileresPage
// ============================================
export default function AlquileresPage() {
  const navigate = useNavigate()

  // ============================================
  // ESTADO
  // ============================================
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)

  // Modales
  const [alquilerParaSalida, setAlquilerParaSalida] = useState(null)
  const [alquilerParaRetorno, setAlquilerParaRetorno] = useState(null)

  // ============================================
  // QUERIES
  // ============================================
  const { alquileres, isLoading, refetch } = useGetAlquileres()
  const { estadisticas, isLoading: loadingStats } = useGetEstadisticasAlquileres()

  // ============================================
  // FILTRADO
  // ============================================
  const alquileresFiltrados = alquileres.filter(a => {
    // Filtro por estado
    if (filtroEstado && a.estado !== filtroEstado) return false

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return (
        a.evento_nombre?.toLowerCase().includes(termino) ||
        a.cliente_nombre?.toLowerCase().includes(termino) ||
        String(a.id).includes(termino)
      )
    }

    return true
  })

  // Ordenar: primero los activos vencidos, luego activos, luego programados
  const alquileresOrdenados = [...alquileresFiltrados].sort((a, b) => {
    const prioridad = { activo: 1, programado: 2, finalizado: 3, cancelado: 4 }
    const prioA = prioridad[a.estado] || 5
    const prioB = prioridad[b.estado] || 5

    if (prioA !== prioB) return prioA - prioB

    // Si ambos son activos, los vencidos primero
    if (a.estado === 'activo' && b.estado === 'activo') {
      const hoy = new Date()
      const vencidoA = new Date(a.fecha_retorno_esperado) < hoy
      const vencidoB = new Date(b.fecha_retorno_esperado) < hoy
      if (vencidoA && !vencidoB) return -1
      if (!vencidoA && vencidoB) return 1
    }

    // Por fecha de salida más próxima
    return new Date(a.fecha_salida) - new Date(b.fecha_salida)
  })

  // Contar vencidos
  const cantidadVencidos = alquileres.filter(a => {
    if (a.estado !== 'activo') return false
    return new Date(a.fecha_retorno_esperado) < new Date()
  }).length

  // ============================================
  // HANDLERS
  // ============================================

  const handleVerDetalle = (id) => {
    navigate(`/alquileres/gestion/${id}`)
  }

  const handleMarcarSalida = (alquiler) => {
    setAlquilerParaSalida(alquiler)
  }

  const handleMarcarRetorno = (alquiler) => {
    setAlquilerParaRetorno(alquiler)
  }

  const handleSalidaExitosa = () => {
    setAlquilerParaSalida(null)
    refetch()
    toast.success('Salida registrada exitosamente')
  }

  const handleRetornoExitoso = () => {
    setAlquilerParaRetorno(null)
    refetch()
    toast.success('Retorno registrado exitosamente')
  }

  const handleFiltroEstado = (estado) => {
    setFiltroEstado(filtroEstado === estado ? '' : estado)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              Gestión de Alquileres
            </h1>
            <p className="text-slate-500 mt-1">
              Administra los alquileres activos y programados
            </p>
          </div>

          {cantidadVencidos > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                {cantidadVencidos} alquiler{cantidadVencidos !== 1 ? 'es' : ''} con retorno vencido
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          titulo="Programados"
          valor={loadingStats ? '-' : (estadisticas?.programados || 0)}
          icono={Clock}
          color="yellow"
          activo={filtroEstado === 'programado'}
          onClick={() => handleFiltroEstado('programado')}
        />
        <StatCard
          titulo="Activos"
          valor={loadingStats ? '-' : (estadisticas?.activos || 0)}
          icono={Truck}
          color="green"
          activo={filtroEstado === 'activo'}
          onClick={() => handleFiltroEstado('activo')}
        />
        <StatCard
          titulo="Finalizados"
          valor={loadingStats ? '-' : (estadisticas?.finalizados || 0)}
          icono={CheckCircle}
          color="blue"
          activo={filtroEstado === 'finalizado'}
          onClick={() => handleFiltroEstado('finalizado')}
        />
        <StatCard
          titulo="Cancelados"
          valor={loadingStats ? '-' : (estadisticas?.cancelados || 0)}
          icono={XCircle}
          color="red"
          activo={filtroEstado === 'cancelado'}
          onClick={() => handleFiltroEstado('cancelado')}
        />
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por evento, cliente o ID..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Botón limpiar filtros */}
          {(filtroEstado || busqueda) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFiltroEstado('')
                setBusqueda('')
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Indicador de filtro activo */}
        {filtroEstado && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">Filtrando por:</span>
            <span className={`
              inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
              ${filtroEstado === 'programado' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${filtroEstado === 'activo' ? 'bg-green-100 text-green-700' : ''}
              ${filtroEstado === 'finalizado' ? 'bg-blue-100 text-blue-700' : ''}
              ${filtroEstado === 'cancelado' ? 'bg-red-100 text-red-700' : ''}
            `}>
              {filtroEstado.charAt(0).toUpperCase() + filtroEstado.slice(1)}
              <button
                onClick={() => setFiltroEstado('')}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Lista de alquileres */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : alquileresOrdenados.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No hay alquileres
          </h3>
          <p className="text-slate-500 mb-6">
            {busqueda || filtroEstado
              ? 'No se encontraron alquileres con los filtros seleccionados'
              : 'Los alquileres aparecerán aquí cuando se aprueben cotizaciones'}
          </p>
          {(busqueda || filtroEstado) && (
            <Button
              variant="secondary"
              onClick={() => {
                setFiltroEstado('')
                setBusqueda('')
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Contador de resultados */}
          <div className="mb-4 text-sm text-slate-500">
            Mostrando {alquileresOrdenados.length} alquiler{alquileresOrdenados.length !== 1 ? 'es' : ''}
          </div>

          {/* Grid de alquileres */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alquileresOrdenados.map(alquiler => (
              <AlquilerCard
                key={alquiler.id}
                alquiler={alquiler}
                onVerDetalle={handleVerDetalle}
                onMarcarSalida={handleMarcarSalida}
                onMarcarRetorno={handleMarcarRetorno}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal Asignación de Elementos (Marcar Salida) */}
      {alquilerParaSalida && (
        <AsignacionElementosModal
          isOpen={!!alquilerParaSalida}
          onClose={() => setAlquilerParaSalida(null)}
          alquiler={alquilerParaSalida}
          onSuccess={handleSalidaExitosa}
        />
      )}

      {/* Modal Retorno de Elementos */}
      {alquilerParaRetorno && (
        <RetornoElementosModal
          isOpen={!!alquilerParaRetorno}
          onClose={() => setAlquilerParaRetorno(null)}
          alquiler={alquilerParaRetorno}
          onSuccess={handleRetornoExitoso}
        />
      )}
    </div>
  )
}
