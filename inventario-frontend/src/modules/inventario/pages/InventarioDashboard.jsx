// ============================================
// PAGINA: Dashboard de Inventario
// KPIs, graficas y alertas de stock
// ============================================

import { useGetEstadisticasInventario } from '../hooks/useElementos'
import { formatearMoneda, formatearNumero } from '@shared/utils/helpers'
import Spinner from '@shared/components/Spinner'
import { Warehouse, Wrench, DollarSign, AlertTriangle, BarChart3, FileSpreadsheet, ShieldAlert } from 'lucide-react'
import Button from '@shared/components/Button'
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
          <p className="text-red-600 text-lg">Error al cargar estadísticas</p>
          <p className="text-slate-500 mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  const { generales, distribucionEstado, distribucionUbicacion, alertasStock } = estadisticas || {}

  // Extraer cantidades por estado
  const cantidadPorEstado = (distribucionEstado || []).reduce((acc, item) => {
    acc[item.estado] = Number(item.cantidad)
    return acc
  }, {})

  const totalMantenimiento = cantidadPorEstado['mantenimiento'] || 0
  const totalDanados = cantidadPorEstado['dañado'] || 0
  const totalBodegas = (distribucionUbicacion || []).length

  // Datos para gráfica de estado
  const datosEstado = (distribucionEstado || []).map(item => ({
    name: capitalizar(item.estado),
    value: Number(item.cantidad),
    fill: COLORES_ESTADO[item.estado] || '#94A3B8'
  }))

  // Datos para gráfica de ubicación (bodegas)
  // series = cantidad de series individuales en esa bodega
  // lotes = SUM(cantidad) de lotes en esa bodega (ya viene sumado del backend)
  const datosUbicacion = (distribucionUbicacion || []).map(item => ({
    name: item.ubicacion,
    unidades: Number(item.total || 0),
    series: Number(item.series || 0),
    lotes: Number(item.lotes || 0)
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/inventario')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-3 transition-colors"
          >
            &larr; Volver
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-[18px] font-bold text-slate-900">
                  Analítica de Inventario
                </h1>
                <p className="text-sm text-slate-500">
                  Distribución por bodegas, estados y alertas
                </p>
              </div>
            </div>
            <Button
              variant="success"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ============================================
            KPI CARDS
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total en Bodegas */}
          <KPICard
            titulo="Bodegas Activas"
            valor={totalBodegas}
            subtitulo={`${formatearNumero(generales?.total_unidades || 0)} unidades distribuidas`}
            icono={Warehouse}
            color="blue"
          />

          {/* En Mantenimiento */}
          <KPICard
            titulo="En Mantenimiento"
            valor={formatearNumero(totalMantenimiento)}
            subtitulo="unidades en reparación"
            icono={Wrench}
            color="yellow"
          />

          {/* Dañados */}
          <KPICard
            titulo="Dañados"
            valor={formatearNumero(totalDanados)}
            subtitulo="unidades fuera de servicio"
            icono={ShieldAlert}
            color="red"
          />

          {/* Valor del Inventario */}
          <KPICard
            titulo="Valor del Inventario"
            valor={formatearMoneda(generales?.valor_precio_unitario || generales?.valor_total || 0)}
            subtitulo={Number(generales?.valor_precio_unitario) > 0 ? 'valor a precio unitario' : 'costo de adquisición total'}
            icono={DollarSign}
            color="purple"
          />
        </div>

        {/* ============================================
            GRÁFICA PRINCIPAL: INVENTARIO POR BODEGA
            ============================================ */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Inventario por Bodega
          </h3>
          {datosUbicacion.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={datosUbicacion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={12} stroke="#64748B" angle={-25} textAnchor="end" height={60} />
                <YAxis fontSize={11} stroke="#64748B" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  formatter={(value) => [formatearNumero(value), 'Unidades']}
                />
                <Bar dataKey="unidades" name="Unidades" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400">
              No hay elementos asignados a bodegas
            </div>
          )}
        </div>

        {/* ============================================
            FILA SECUNDARIA
            ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PieChart - Distribución por Estado */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Distribución por Estado
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

          {/* Resumen por bodega - tabla */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Detalle por Bodega
            </h3>
            {datosUbicacion.length > 0 ? (
              <div className="overflow-auto max-h-[280px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-4 text-slate-500 font-medium">Bodega</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Series</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Lotes</th>
                      <th className="text-center py-2 pl-2 text-slate-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datosUbicacion
                      .sort((a, b) => b.unidades - a.unidades)
                      .map((ub) => (
                      <tr key={ub.name} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-4 text-slate-900 font-medium">{ub.name}</td>
                        <td className="py-2.5 px-2 text-center text-blue-600 font-semibold">{ub.series}</td>
                        <td className="py-2.5 px-2 text-center text-purple-600 font-semibold">{ub.lotes}</td>
                        <td className="py-2.5 pl-2 text-center text-slate-900 font-bold">{ub.unidades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                Sin datos de ubicación
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
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Categoría</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-600">Stock Disponible</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-600">Stock Mínimo</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-600">Déficit</th>
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
  const iconBg = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100'
  }

  const iconColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  }

  const valueColor = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    red: 'text-red-700',
    yellow: 'text-yellow-700'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor[color]}`} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-slate-500">{titulo}</p>
          <p className={`text-[32px] font-bold leading-tight ${valueColor[color]}`}>{valor}</p>
          <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>
        </div>
      </div>
    </div>
  )
}

export default InventarioDashboard
