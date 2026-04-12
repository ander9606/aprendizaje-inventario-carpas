// ============================================
// COMPONENTE: MarcarPagoModal
// Modal para marcar/desmarcar pago
// ============================================

import { useState } from 'react'
import { X } from 'lucide-react'
import { useMarcarPago } from '../hooks/useSuperadmin'
import { METODOS_PAGO } from '../constants'
import { toast } from 'sonner'

const MarcarPagoModal = ({ isOpen, onClose, pago }) => {
    const marcar = useMarcarPago()
    const [form, setForm] = useState({
        pagado: !pago.pagado,
        fecha_pago: pago.fecha_pago ? pago.fecha_pago.split('T')[0] : new Date().toISOString().split('T')[0],
        metodo_pago: pago.metodo_pago || 'transferencia',
        notas: pago.notas || ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await marcar.mutateAsync({
                id: pago.id,
                data: form
            })
            toast.success(form.pagado ? 'Pago registrado' : 'Pago desmarcado')
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/40" />
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {pago.pagado ? 'Desmarcar Pago' : 'Registrar Pago'}
                    </h2>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Info */}
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
                        <p><span className="text-slate-500">Tenant:</span> <span className="font-medium">{pago.tenant_nombre}</span></p>
                        <p><span className="text-slate-500">Plan:</span> {pago.plan_nombre}</p>
                        <p><span className="text-slate-500">Monto:</span> <span className="font-bold">${Number(pago.monto).toLocaleString()}</span></p>
                        <p><span className="text-slate-500">Periodo:</span> {new Date(pago.periodo_inicio).toLocaleDateString('es', { month: 'long', year: 'numeric' })}</p>
                    </div>

                    {/* Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.pagado}
                            onChange={(e) => setForm(f => ({ ...f, pagado: e.target.checked }))}
                            className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                            {form.pagado ? 'Marcar como pagado' : 'Marcar como NO pagado'}
                        </span>
                    </label>

                    {form.pagado && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de pago</label>
                                <input
                                    type="date"
                                    value={form.fecha_pago}
                                    onChange={(e) => setForm(f => ({ ...f, fecha_pago: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Metodo de pago</label>
                                <select
                                    value={form.metodo_pago}
                                    onChange={(e) => setForm(f => ({ ...f, metodo_pago: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    {METODOS_PAGO.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                        <textarea
                            value={form.notas}
                            onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium
                                       hover:bg-slate-200 transition-colors min-h-[44px]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={marcar.isPending}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px]
                                        disabled:opacity-60 ${
                                form.pagado
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            }`}
                        >
                            {marcar.isPending ? 'Guardando...' : form.pagado ? 'Registrar Pago' : 'Desmarcar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default MarcarPagoModal
