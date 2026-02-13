// ============================================
// PAGINA: Dashboard de Inventario
// KPIs, graficas y alertas de stock
// ============================================

import { useGetEstadisticasInventario } from '../hooks/Useelementos'
import { formatearMoneda, formatearNumero } from '../utils/helpers'
import Spinner from '../components/common/Spinner'
import { Package, Boxes, DollarSign, AlertTriangle, BarChart3, ArrowLeft, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { exportarInventarioExcel } from '../api/apiExport'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

// Paleta de colores
const COLORES_ESTADO = {
  nuevo: '#2563EB',
  bueno: '#10B981',
  mantenimiento: '#F59E0B',
  alquilado: '#8B5CF6',
  'dañado': '#EF4444',
  disponible: '#10B981',
  regular: '#F59E0B',
  malo: '#EF4444'
}

const COLORES_CHART = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

const capitalizar = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const InventarioDashboard = () => {
  const { estadisticas, isLoading, error } = useGetEstadisticasInventario()
  const navigate = useNavigate()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      await exportarInventarioExcel()
      toast.success('Inventario exportado a Excel exitosamente')
    } catch (err) {
      toast.error('Error al exportar: ' + (err.message || 'Intenta de nuevo'))
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error al cargar estadisticas</p>
          <p className="text-slate-500 mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  const { generales, distribucionEstado, topCategorias, distribucionUbicacion, alertasStock } = estadisticas || {}

  // Preparar datos para graficas
  const datosEstado = (distribucionEstado || []).map(item => ({
    name: capitalizar(item.estado),
    value: Number(item.cantidad),
    fill: COLORES_ESTADO[item.estado] || '#94A3B8'
  }))

  const datosCategorias = (topCategorias || []).map(item => ({
    name: item.categoria,
    cantidad: Number(item.cantidad_total),
    elementos: Number(item.total_elementos)
  }))

  const datosUbicacion = (distribucionUbicacion || []).map(item => ({
    name: item.ubicacion,
    series: Number(item.series),
    lotes: Number(item.lotes)
  }))

  // Calcular tipo de gestion (series vs lotes)
  const totalSeriesElementos = Number(generales?.elementos_con_series || 0)
  const totalLotesElementos = Number(generales?.elementos_con_lotes || 0)
  const datosGestion = [
    { name: 'Series', value: totalSeriesElementos, fill: '#2563EB' },
    { name: 'Lotes', value: totalLotesElementos, fill: '#8B5CF6' }
  ].filter(d => d.value > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inventario')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-blue-600" />
                Dashboard de Inventario
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Vista general del inventario y alertas
              </p>
            </div>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ============================================
            KPI CARDS
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Elementos */}
          <KPICard
            titulo="Total Elementos"
            valor={formatearNumero(generales?.total_elementos || 0)}
            subtitulo="tipos de articulos"
            icono={Package}
            color="blue"
          />

          {/* Total Unidades */}
          <KPICard
            titulo="Total Unidades"
            valor={formatearNumero(generales?.total_unidades || 0)}
            subtitulo={`${formatearNumero(generales?.total_series || 0)} series + ${formatearNumero(generales?.total_unidades_lotes || 0)} lotes`}
            icono={Boxes}
            color="green"
          />

          {/* Valor del Inventario */}
          <KPICard
            titulo="Valor del Inventario"
            valor={formatearMoneda(generales?.valor_precio_unitario || generales?.valor_total || 0)}
            subtitulo={Number(generales?.valor_precio_unitario) > 0 ? "valor a precio unitario" : "costo de adquisicion total"}
            icono={DollarSign}
            color="purple"
          />

          {/* Alertas Stock Bajo */}
          <KPICard
            titulo="Alertas de Stock"
            valor={alertasStock?.length || 0}
            subtitulo={alertasStock?.length > 0 ? 'elementos bajo minimo' : 'todo en orden'}
            icono={AlertTriangle}
            color={alertasStock?.length > 0 ? 'red' : 'green'}
          />
        </div>

        {/* ============================================
            FILA DE GRAFICAS PRINCIPALES
            ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PieChart - Distribucion por Estado */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Distribucion por Estado
            </h3>
            {datosEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datosEstado}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {datosEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatearNumero(value), 'Unidades']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                Sin datos de estado
              </div>
            )}
          </div>

          {/* BarChart - Top Categorias */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Top Categorias por Cantidad
            </h3>
            {datosCategorias.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datosCategorias} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" fontSize={11} stroke="#64748B" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    fontSize={11}
                    stroke="#64748B"
                    tick={{ fill: '#334155' }}
                  />
                  <Tooltip
                    formatter={(value) => [formatearNumero(value), 'Unidades']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="cantidad" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                Sin datos de categorias
              </div>
            )}
          </div>
        </div>

        {/* ============================================
            FILA DE GRAFICAS SECUNDARIAS
            ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BarChart - Inventario por Ubicacion */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Inventario por Ubicacion
            </h3>
            {datosUbicacion.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datosUbicacion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" fontSize={11} stroke="#64748B" angle={-25} textAnchor="end" height={60} />
                  <YAxis fontSize={11} stroke="#64748B" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Legend />
                  <Bar dataKey="series" name="Series" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lotes" name="Lotes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                Sin datos de ubicacion
              </div>
            )}
          </div>

          {/* Donut - Tipo de Gestion */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Tipo de Gestion
            </h3>
            {datosGestion.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datosGestion}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {datosGestion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatearNumero(value), 'Elementos']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                Sin datos de gestion
              </div>
            )}
          </div>
        </div>

        {/* ============================================
            TABLA DE ALERTAS DE STOCK BAJO
            ============================================ */}
        {alertasStock && alertasStock.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">
                Alertas de Stock Bajo ({alertasStock.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Elemento</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Categoria</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-600">Stock Disponible</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-600">Stock Minimo</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-600">Deficit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alertasStock.map((alerta) => {
                    const deficit = Number(alerta.stock_minimo) - Number(alerta.stock_disponible)
                    const severidad = deficit / Number(alerta.stock_minimo)
                    return (
                      <tr
                        key={alerta.id}
                        className={`hover:bg-slate-50 ${severidad > 0.5 ? 'bg-red-50/50' : 'bg-orange-50/30'}`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {alerta.categoria_emoji && <span>{alerta.categoria_emoji}</span>}
                            <span className="font-medium text-slate-900">{alerta.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {alerta.categoria_nombre || '-'}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`font-bold ${severidad > 0.5 ? 'text-red-600' : 'text-orange-600'}`}>
                            {alerta.stock_disponible}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center text-slate-700">
                          {alerta.stock_minimo}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold
                            ${severidad > 0.5
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                            }
                          `}>
                            -{deficit}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTE: KPI CARD
// ============================================
const KPICard = ({ titulo, valor, subtitulo, icono: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  }

  const iconBg = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100'
  }

  return (
    <div className={`bg-white rounded-xl border ${colorClasses[color] || colorClasses.blue} p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{valor}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg[color] || iconBg.blue}`}>
          <Icon className={`w-6 h-6 ${colorClasses[color]?.split(' ')[1] || 'text-blue-600'}`} />
        </div>
      </div>
    </div>
  )
}

export default InventarioDashboard
