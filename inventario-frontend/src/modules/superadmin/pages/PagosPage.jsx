// ============================================
// PÁGINA: PagosPage
// Gestión de pagos de tenants
// ============================================

import { useState } from 'react'
import { CreditCard, ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react'
import { useGetPagos, useGetResumenPagos, useGenerarPeriodo } from '../hooks/useSuperadmin'
import MarcarPagoModal from '../components/MarcarPagoModal'
import { toast } from 'sonner'

const PagosPage = () => {
    const now = new Date()
    const [mes, setMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    const [page, setPage] = useState(1)
    const [filtro, setFiltro] = useState('')
    const [selectedPago, setSelectedPago] = useState(null)

    const { pagos, pagination, isLoading, refetch } = useGetPagos({
        page, limit: 20, mes, pagado: filtro
    })
    const { resumen } = useGetResumenPagos(mes)
    const generarPeriodo = useGenerarPeriodo()

    const handleGenerar = async () => {
        if (!confirm(`Generar registros de pago para ${mes}?`)) return
        try {
            const result = await generarPeriodo.mutateAsync(mes)
            toast.success(result.message)
            refetch()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al generar periodo')
        }
    }

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Pagos</h1>
                        <p className="text-sm text-slate-500">Control de pagos mensuales</p>
                    </div>
                </div>
                <button
                    onClick={handleGenerar}
                    disabled={generarPeriodo.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl
                               hover:bg-indigo-700 active:scale-[0.97] transition-all text-sm font-medium min-h-[44px]
                               disabled:opacity-60"
                >
                    <Plus className="w-4 h-4" />
                    {generarPeriodo.isPending ? 'Generando...' : 'Generar Periodo'}
                </button>
            </div>

            {/* Resumen */}
            {resumen && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">{resumen.total_registros || 0}</p>
                        <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-700">{resumen.pendientes || 0}</p>
                        <p className="text-xs text-yellow-600">Pendientes</p>
                    </div>
                    <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
                        <p className="text-2xl font-bold text-red-700">{resumen.vencidos || 0}</p>
                        <p className="text-xs text-red-600">Vencidos</p>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">${Number(resumen.monto_cobrado || 0).toLocaleString()}</p>
                        <p className="text-xs text-green-600">Cobrado</p>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="month"
                    value={mes}
                    onChange={(e) => { setMes(e.target.value); setPage(1) }}
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm min-h-[44px]
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                    {[
                        { value: '', label: 'Todos' },
                        { value: '0', label: 'Pendientes' },
                        { value: '1', label: 'Pagados' }
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => { setFiltro(f.value); setPage(1) }}
                            className={`px-4 py-2.5 text-sm min-h-[44px] transition-colors ${
                                filtro === f.value
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : pagos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No hay registros de pago para este periodo</p>
                    <p className="text-sm mt-1">Use "Generar Periodo" para crear registros</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-3 font-medium">Tenant</th>
                                    <th className="px-5 py-3 font-medium">Plan</th>
                                    <th className="px-5 py-3 font-medium">Periodo</th>
                                    <th className="px-5 py-3 font-medium">Monto</th>
                                    <th className="px-5 py-3 font-medium">Estado</th>
                                    <th className="px-5 py-3 font-medium">Fecha Pago</th>
                                    <th className="px-5 py-3 font-medium">Accion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pagos.map((pago) => {
                                    const vencido = !pago.pagado && new Date(pago.periodo_fin) < new Date()
                                    return (
                                        <tr key={pago.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-900">{pago.tenant_nombre}</p>
                                                <p className="text-xs text-slate-400">{pago.tenant_slug}</p>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{pago.plan_nombre}</td>
                                            <td className="px-5 py-3 text-slate-600">
                                                {new Date(pago.periodo_inicio).toLocaleDateString('es', { month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3 font-medium">${Number(pago.monto).toLocaleString()}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    pago.pagado ? 'bg-green-100 text-green-700' :
                                                    vencido ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {pago.pagado ? 'Pagado' : vencido ? 'Vencido' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-400">
                                                {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <button
                                                    onClick={() => setSelectedPago(pago)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                                                        pago.pagado
                                                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                                    title={pago.pagado ? 'Ver/Desmarcar' : 'Marcar pagado'}
                                                >
                                                    {pago.pagado ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!pagination.hasPreviousPage}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200
                                   disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-600 px-3">
                        {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!pagination.hasNextPage}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200
                                   disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Modal */}
            {selectedPago && (
                <MarcarPagoModal
                    isOpen={!!selectedPago}
                    onClose={() => { setSelectedPago(null); refetch() }}
                    pago={selectedPago}
                />
            )}
        </div>
    )
}

export default PagosPage
