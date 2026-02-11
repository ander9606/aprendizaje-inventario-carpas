// ============================================
// PÁGINA: AlquileresPage
// Dashboard de alquileres activos y programados
// ============================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Search,
  Clock,
  Truck,
  AlertTriangle,
  X,
} from 'lucide-react'
import {
  useGetAlquileres,
  useGetEstadisticasAlquileres
} from '../hooks/useAlquileres'
import { useAlertasManager } from '../hooks/useAlertas'
import AlquilerCard from '../components/cards/AlquilerCard'
import { AlertasPanel } from '../components/alertas'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'

// ============================================
// COMPONENTE: StatPill - stat compacta clickable
// ============================================
const StatPill = ({ label, valor, icono: Icon, activo, onClick, color }) => {
  const colors = {
    amber: activo
      ? 'bg-amber-500 text-white shadow-amber-200'
      : 'bg-white text-slate-700 hover:bg-amber-50 border-slate-200',
    emerald: activo
      ? 'bg-emerald-500 text-white shadow-emerald-200'
      : 'bg-white text-slate-700 hover:bg-emerald-50 border-slate-200',
    orange: activo
      ? 'bg-orange-500 text-white shadow-orange-200'
      : 'bg-white text-orange-600 hover:bg-orange-50 border-orange-200'
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
        transition-all duration-200
        ${activo ? 'shadow-lg' : 'shadow-sm'}
        ${colors[color]}
      `}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className={`
        font-bold text-base ml-0.5
        ${activo ? '' : color === 'orange' ? 'text-orange-600' : 'text-slate-900'}
      `}>
        {valor}
      </span>
    </button>
  )
}

// ============================================
// COMPONENTE PRINCIPAL: AlquileresPage
// ============================================
export default function AlquileresPage() {
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const { alquileres, isLoading } = useGetAlquileres()
  const { estadisticas, isLoading: loadingStats } = useGetEstadisticasAlquileres()

  const {
    alertas,
    resumen: resumenAlertas,
    isLoading: loadingAlertas,
    refetch: refetchAlertas,
    ignorar: ignorarAlerta,
    isIgnorando
  } = useAlertasManager()

  // Contar vencidos
  const cantidadVencidos = useMemo(() =>
    (Array.isArray(alquileres) ? alquileres : []).filter(a =>
      a.estado === 'activo' && a.fecha_retorno_esperado && new Date() > new Date(a.fecha_retorno_esperado)
    ).length,
    [alquileres]
  )

  // Filtrado
  const alquileresFiltrados = useMemo(() => {
    return (Array.isArray(alquileres) ? alquileres : []).filter(a => {
      if (filtroEstado === 'vencido') {
        if (a.estado !== 'activo') return false
        if (!a.fecha_retorno_esperado || new Date() <= new Date(a.fecha_retorno_esperado)) return false
      } else if (filtroEstado && a.estado !== filtroEstado) {
        return false
      }

      if (busqueda) {
        const t = busqueda.toLowerCase()
        return (
          a.evento_nombre?.toLowerCase().includes(t) ||
          a.cliente_nombre?.toLowerCase().includes(t) ||
          String(a.id).includes(t)
        )
      }
      return true
    })
  }, [alquileres, filtroEstado, busqueda])

  // Ordenar
  const alquileresOrdenados = useMemo(() => {
    return [...alquileresFiltrados].sort((a, b) => {
      const prio = { activo: 1, programado: 2, finalizado: 3, cancelado: 4 }
      const pA = prio[a.estado] || 5
      const pB = prio[b.estado] || 5
      if (pA !== pB) return pA - pB

      if (a.estado === 'activo' && b.estado === 'activo') {
        const hoy = new Date()
        const vA = new Date(a.fecha_retorno_esperado) < hoy
        const vB = new Date(b.fecha_retorno_esperado) < hoy
        if (vA && !vB) return -1
        if (!vA && vB) return 1
      }
      return new Date(a.fecha_salida) - new Date(b.fecha_salida)
    })
  }, [alquileresFiltrados])

  // Filtrar solo trabajo activo (no finalizados/cancelados - esos van al historial)
  const trabajoActivo = useMemo(() =>
    alquileresOrdenados.filter(a => a.estado !== 'finalizado' && a.estado !== 'cancelado'),
    [alquileresOrdenados]
  )

  const handleFiltro = (estado) => {
    setFiltroEstado(filtroEstado === estado ? '' : estado)
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestión de Alquileres
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {loadingStats ? '' : `${estadisticas?.activos || 0} activos, ${estadisticas?.programados || 0} programados`}
        </p>
      </div>

      {/* Alertas */}
      <AlertasPanel
        alertas={alertas}
        resumen={resumenAlertas}
        isLoading={loadingAlertas}
        onRefresh={refetchAlertas}
        onIgnorar={ignorarAlerta}
        isIgnorando={isIgnorando}
        colapsable={true}
        inicialmenteColapsado={false}
      />

      {/* Filtros + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por evento, cliente o ID..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {cantidadVencidos > 0 && (
            <StatPill
              label="Vencidos"
              valor={cantidadVencidos}
              icono={AlertTriangle}
              color="orange"
              activo={filtroEstado === 'vencido'}
              onClick={() => handleFiltro('vencido')}
            />
          )}
          <StatPill
            label="Programados"
            valor={loadingStats ? '-' : (estadisticas?.programados || 0)}
            icono={Clock}
            color="amber"
            activo={filtroEstado === 'programado'}
            onClick={() => handleFiltro('programado')}
          />
          <StatPill
            label="Activos"
            valor={loadingStats ? '-' : (estadisticas?.activos || 0)}
            icono={Truck}
            color="emerald"
            activo={filtroEstado === 'activo'}
            onClick={() => handleFiltro('activo')}
          />
        </div>
      </div>

      {/* Active filter indicator */}
      {filtroEstado && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-slate-500">Filtro:</span>
          <button
            onClick={() => setFiltroEstado('')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-full hover:bg-orange-100 transition-colors"
          >
            {filtroEstado.charAt(0).toUpperCase() + filtroEstado.slice(1)}
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Lista principal - trabajo activo */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Sección principal: Programados + Activos */}
          {trabajoActivo.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No hay alquileres activos
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                {busqueda || filtroEstado
                  ? 'No se encontraron resultados con los filtros actuales'
                  : 'Aparecerán aquí cuando se aprueben cotizaciones'}
              </p>
              {(busqueda || filtroEstado) && (
                <Button
                  variant="secondary"
                  onClick={() => { setFiltroEstado(''); setBusqueda('') }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : trabajoActivo.length > 0 && (
            <>
              <div className="mb-3 text-xs text-slate-400 font-medium uppercase tracking-wide">
                {trabajoActivo.length} alquiler{trabajoActivo.length !== 1 ? 'es' : ''} en curso
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {trabajoActivo.map(alquiler => (
                  <AlquilerCard
                    key={alquiler.id}
                    alquiler={alquiler}
                    onVerDetalle={(id) => navigate(`/alquileres/gestion/${id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
