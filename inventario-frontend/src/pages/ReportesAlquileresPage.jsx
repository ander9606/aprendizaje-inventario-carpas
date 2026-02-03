// ============================================
// PÁGINA: Reportes de Alquileres
// Estadísticas y gráficos del negocio
// ============================================

import { useState, useMemo } from 'react'
import { BarChart3, TrendingUp, Users, Package, MapPin, FileText, DollarSign, Activity, Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Spinner from '../components/common/Spinner'
import { useGetReportesAlquileres } from '../hooks/useAlquileres'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const formatMoney = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

const formatMoneyFull = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(value || 0)
}

// Calcular fechas según el período seleccionado
const calcularFechas = (periodo, anio, mes, semestre) => {
  if (periodo === 'todo') return { fechaInicio: undefined, fechaFin: undefined }

  if (periodo === 'mensual') {
    const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`
    const ultimoDia = new Date(anio, mes, 0).getDate()
    const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`
    return { fechaInicio, fechaFin }
  }

  if (periodo === 'semestral') {
    if (semestre === 1) {
      return { fechaInicio: `${anio}-01-01`, fechaFin: `${anio}-06-30` }
    }
    return { fechaInicio: `${anio}-07-01`, fechaFin: `${anio}-12-31` }
  }

  if (periodo === 'anual') {
    return { fechaInicio: `${anio}-01-01`, fechaFin: `${anio}-12-31` }
  }

  return { fechaInicio: undefined, fechaFin: undefined }
}

const ReportesAlquileresPage = () => {
  const hoy = new Date()
  const [periodo, setPeriodo] = useState('todo')
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [semestre, setSemestre] = useState(hoy.getMonth() < 6 ? 1 : 2)

  const { fechaInicio, fechaFin } = useMemo(
    () => calcularFechas(periodo, anio, mes, semestre),
    [periodo, anio, mes, semestre]
  )

  const { reportes, isLoading, error } = useGetReportesAlquileres({ fechaInicio, fechaFin })

  // Label descriptivo del período actual
  const periodoLabel = useMemo(() => {
    if (periodo === 'todo') return 'Todo el historial'
    if (periodo === 'mensual') return `${MESES_FULL[mes - 1]} ${anio}`
    if (periodo === 'semestral') return `${semestre === 1 ? '1er' : '2do'} Semestre ${anio}`
    if (periodo === 'anual') return `Año ${anio}`
    return ''
  }, [periodo, anio, mes, semestre])

  // Navegación rápida (anterior / siguiente)
  const navegar = (dir) => {
    if (periodo === 'mensual') {
      let nuevoMes = mes + dir
      let nuevoAnio = anio
      if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio-- }
      if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++ }
      setMes(nuevoMes)
      setAnio(nuevoAnio)
    } else if (periodo === 'semestral') {
      let nuevoSem = semestre + dir
      let nuevoAnio = anio
      if (nuevoSem < 1) { nuevoSem = 2; nuevoAnio-- }
      if (nuevoSem > 2) { nuevoSem = 1; nuevoAnio++ }
      setSemestre(nuevoSem)
      setAnio(nuevoAnio)
    } else if (periodo === 'anual') {
      setAnio(anio + dir)
    }
  }

  const { estadisticas, ingresosPorMes, topClientes, productosMasAlquilados, alquileresPorCiudad, cotizaciones } = reportes || {}

  // Preparar datos para gráfico de ingresos por mes
  const datosIngresos = (ingresosPorMes || []).map(item => {
    const [, m] = item.mes.split('-')
    return {
      mes: MESES[parseInt(m) - 1],
      ingresos: Number(item.ingresos),
      cantidad: Number(item.cantidad)
    }
  })

  // Datos para pie chart de estados de alquileres
  const datosEstados = estadisticas ? [
    { name: 'Programados', value: Number(estadisticas.programados) || 0, color: '#3B82F6' },
    { name: 'Activos', value: Number(estadisticas.activos) || 0, color: '#10B981' },
    { name: 'Finalizados', value: Number(estadisticas.finalizados) || 0, color: '#6B7280' },
    { name: 'Cancelados', value: Number(estadisticas.cancelados) || 0, color: '#EF4444' },
  ].filter(d => d.value > 0) : []

  // Datos para pie chart de cotizaciones
  const datosCotizaciones = cotizaciones ? [
    { name: 'Aprobadas', value: cotizaciones.aprobadas || 0, color: '#10B981' },
    { name: 'Pendientes', value: cotizaciones.pendientes || 0, color: '#F59E0B' },
    { name: 'Rechazadas', value: cotizaciones.rechazadas || 0, color: '#EF4444' },
    { name: 'Vencidas', value: cotizaciones.vencidas || 0, color: '#6B7280' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Reportes
          </h1>
          <p className="text-slate-500 mt-1">Estadísticas y métricas del negocio</p>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Período:</span>
          </div>

          {/* Botones de tipo de período */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {[
              { key: 'todo', label: 'Todo' },
              { key: 'mensual', label: 'Mensual' },
              { key: 'semestral', label: 'Semestral' },
              { key: 'anual', label: 'Anual' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriodo(key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  periodo === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Navegación del período (solo si no es "todo") */}
          {periodo !== 'todo' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navegar(-1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800 min-w-[140px] text-center">
                {periodoLabel}
              </span>
              <button
                onClick={() => navegar(1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selectores adicionales para mensual */}
          {periodo === 'mensual' && (
            <div className="flex items-center gap-2">
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
              >
                {MESES_FULL.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
              >
                {Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selectores para semestral */}
          {periodo === 'semestral' && (
            <div className="flex items-center gap-2">
              <select
                value={semestre}
                onChange={(e) => setSemestre(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
              >
                <option value={1}>1er Semestre (Ene-Jun)</option>
                <option value={2}>2do Semestre (Jul-Dic)</option>
              </select>
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
              >
                {Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de año para anual */}
          {periodo === 'anual' && (
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
            >
              {Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" text="Cargando reportes..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar reportes: {error.message}
        </div>
      ) : (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard
              icon={<Package className="w-5 h-5" />}
              label="Total Alquileres"
              value={estadisticas?.total || 0}
              color="blue"
            />
            <KPICard
              icon={<DollarSign className="w-5 h-5" />}
              label="Ingresos Realizados"
              value={formatMoneyFull(estadisticas?.ingresos_realizados)}
              color="green"
              subtitle="Finalizados"
            />
            <KPICard
              icon={<Clock className="w-5 h-5" />}
              label="Ingresos Esperados"
              value={formatMoneyFull(estadisticas?.ingresos_esperados)}
              color="amber"
              subtitle="Programados + Activos"
            />
            <KPICard
              icon={<FileText className="w-5 h-5" />}
              label="Cotizaciones"
              value={cotizaciones?.total || 0}
              color="purple"
            />
            <KPICard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Tasa Conversión"
              value={`${cotizaciones?.tasaConversion || 0}%`}
              color="blue"
            />
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ingresos por mes */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Ingresos por Mes {periodo !== 'todo' && `- ${periodoLabel}`}
              </h3>
              {datosIngresos.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={datosIngresos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="mes" fontSize={12} stroke="#64748B" />
                    <YAxis fontSize={11} stroke="#64748B" tickFormatter={formatMoney} />
                    <Tooltip
                      formatter={(value) => [formatMoneyFull(value), 'Ingresos']}
                      labelStyle={{ fontWeight: 'bold' }}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    />
                    <Bar dataKey="ingresos" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-16">Sin datos de ingresos para este período</p>
              )}
            </div>

            {/* Estado de alquileres - pie chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Estado de Alquileres
              </h3>
              {datosEstados.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={datosEstados}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                      fontSize={11}
                    >
                      {datosEstados.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend fontSize={12} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-16">Sin alquileres en este período</p>
              )}
            </div>
          </div>

          {/* Segunda fila: Cotizaciones + Ciudades */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasa de conversión de cotizaciones */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Cotizaciones por Estado
              </h3>
              {datosCotizaciones.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={datosCotizaciones}
                        cx="50%" cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {datosCotizaciones.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {datosCotizaciones.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}:</span>
                        <span className="font-semibold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-sm text-slate-500">Conversión: </span>
                      <span className="font-bold text-lg text-blue-600">{cotizaciones?.tasaConversion || 0}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-12">Sin cotizaciones en este período</p>
              )}
            </div>

            {/* Alquileres por ciudad */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Alquileres por Ciudad
              </h3>
              {alquileresPorCiudad && alquileresPorCiudad.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={alquileresPorCiudad} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" fontSize={11} stroke="#64748B" />
                    <YAxis type="category" dataKey="ciudad" fontSize={11} stroke="#64748B" width={100} />
                    <Tooltip
                      formatter={(value) => [value, 'Alquileres']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    />
                    <Bar dataKey="cantidad" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-12">Sin datos de ciudades en este período</p>
              )}
            </div>
          </div>

          {/* Tablas: Top Clientes + Productos más alquilados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Clientes */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Top Clientes
              </h3>
              {topClientes && topClientes.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-slate-500 font-medium">#</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Cliente</th>
                        <th className="text-center py-2 text-slate-500 font-medium">Alq.</th>
                        <th className="text-right py-2 text-slate-500 font-medium">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClientes.map((c, i) => (
                        <tr key={c.cliente_id} className="border-b border-slate-50">
                          <td className="py-2 text-slate-400">{i + 1}</td>
                          <td className="py-2 font-medium text-slate-800">{c.cliente_nombre}</td>
                          <td className="py-2 text-center text-slate-600">{c.total_alquileres}</td>
                          <td className="py-2 text-right text-slate-800">{formatMoneyFull(c.ingresos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Sin datos de clientes en este período</p>
              )}
            </div>

            {/* Productos más alquilados */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                Productos Más Alquilados
              </h3>
              {productosMasAlquilados && productosMasAlquilados.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-slate-500 font-medium">#</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Producto</th>
                        <th className="text-center py-2 text-slate-500 font-medium">Veces</th>
                        <th className="text-right py-2 text-slate-500 font-medium">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosMasAlquilados.map((p, i) => (
                        <tr key={p.producto_id} className="border-b border-slate-50">
                          <td className="py-2 text-slate-400">{i + 1}</td>
                          <td className="py-2 font-medium text-slate-800">{p.producto_nombre}</td>
                          <td className="py-2 text-center text-slate-600">{p.veces_alquilado}</td>
                          <td className="py-2 text-right text-slate-800">{formatMoneyFull(p.ingresos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Sin datos de productos en este período</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Componente KPI Card
// ============================================
const KPICard = ({ icon, label, value, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  }

  const iconBg = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium opacity-75">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-[10px] opacity-60">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export default ReportesAlquileresPage
