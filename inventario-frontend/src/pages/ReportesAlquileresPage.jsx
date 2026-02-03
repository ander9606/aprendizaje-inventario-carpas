// ============================================
// PÁGINA: Reportes de Alquileres
// Estadísticas y gráficos del negocio
// ============================================

import { BarChart3, TrendingUp, Users, Package, MapPin, FileText, DollarSign, Activity } from 'lucide-react'
import Spinner from '../components/common/Spinner'
import { useGetReportesAlquileres } from '../hooks/useAlquileres'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

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

const ReportesAlquileresPage = () => {
  const { reportes, isLoading, error } = useGetReportesAlquileres()

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center py-20">
        <Spinner size="lg" text="Cargando reportes..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar reportes: {error.message}
        </div>
      </div>
    )
  }

  const { estadisticas, ingresosPorMes, topClientes, productosMasAlquilados, alquileresPorCiudad, cotizaciones } = reportes || {}

  // Preparar datos para gráfico de ingresos por mes
  const datosIngresos = (ingresosPorMes || []).map(item => {
    const [, mes] = item.mes.split('-')
    return {
      mes: MESES[parseInt(mes) - 1],
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          Reportes
        </h1>
        <p className="text-slate-500 mt-1">Estadísticas y métricas del negocio</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Package className="w-5 h-5" />}
          label="Total Alquileres"
          value={estadisticas?.total || 0}
          color="blue"
        />
        <KPICard
          icon={<DollarSign className="w-5 h-5" />}
          label="Ingresos Totales"
          value={formatMoneyFull(estadisticas?.ingresos_totales)}
          color="green"
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
          color="amber"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingresos por mes - ocupa 2 columnas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Ingresos por Mes (últimos 12 meses)
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
            <p className="text-slate-400 text-center py-16">Sin datos de ingresos aún</p>
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
            <p className="text-slate-400 text-center py-16">Sin alquileres aún</p>
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
            <p className="text-slate-400 text-center py-12">Sin cotizaciones aún</p>
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
            <p className="text-slate-400 text-center py-12">Sin datos de ciudades aún</p>
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
            <p className="text-slate-400 text-center py-8">Sin datos de clientes aún</p>
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
            <p className="text-slate-400 text-center py-8">Sin datos de productos aún</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Componente KPI Card
// ============================================
const KPICard = ({ icon, label, value, color }) => {
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
        </div>
      </div>
    </div>
  )
}

export default ReportesAlquileresPage
