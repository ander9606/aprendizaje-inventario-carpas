// ============================================
// COMPONENTE: PlanForm
// Modal para crear/editar plan
// ============================================

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCrearPlan, useActualizarPlan } from '../hooks/useSuperadmin'
import { toast } from 'sonner'

const FEATURE_OPTIONS = [
    { key: 'reportes', label: 'Reportes' },
    { key: 'exportar_pdf', label: 'Exportar PDF' },
    { key: 'api_access', label: 'API Access' },
    { key: 'soporte_prioritario', label: 'Soporte Prioritario' }
]

const PlanForm = ({ isOpen, onClose, plan = null }) => {
    const isEdit = !!plan
    const crear = useCrearPlan()
    const actualizar = useActualizarPlan()

    const [form, setForm] = useState({
        nombre: '', slug: '', max_empleados: '', max_elementos: '',
        max_alquileres: '', max_cotizaciones: '', precio_mensual: '0',
        features: {}
    })

    useEffect(() => {
        if (plan) {
            const features = typeof plan.features === 'string' ? JSON.parse(plan.features || '{}') : (plan.features || {})
            setForm({
                nombre: plan.nombre || '',
                slug: plan.slug || '',
                max_empleados: plan.max_empleados ?? '',
                max_elementos: plan.max_elementos ?? '',
                max_alquileres: plan.max_alquileres ?? '',
                max_cotizaciones: plan.max_cotizaciones ?? '',
                precio_mensual: plan.precio_mensual ?? '0',
                features
            })
        }
    }, [plan])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.nombre.trim() || !form.slug.trim()) {
            toast.error('Nombre y slug son requeridos')
            return
        }

        const data = {
            ...form,
            max_empleados: form.max_empleados ? parseInt(form.max_empleados) : null,
            max_elementos: form.max_elementos ? parseInt(form.max_elementos) : null,
            max_alquileres: form.max_alquileres ? parseInt(form.max_alquileres) : null,
            max_cotizaciones: form.max_cotizaciones ? parseInt(form.max_cotizaciones) : null,
            precio_mensual: parseFloat(form.precio_mensual) || 0
        }

        try {
            if (isEdit) {
                await actualizar.mutateAsync({ id: plan.id, data })
                toast.success('Plan actualizado')
            } else {
                await crear.mutateAsync(data)
                toast.success('Plan creado')
            }
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al guardar')
        }
    }

    const toggleFeature = (key) => {
        setForm(f => ({
            ...f,
            features: { ...f.features, [key]: !f.features[key] }
        }))
    }

    const loading = crear.isPending || actualizar.isPending

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/40" />
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {isEdit ? 'Editar Plan' : 'Nuevo Plan'}
                    </h2>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                            <input
                                type="text"
                                value={form.slug}
                                onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio Mensual ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.precio_mensual}
                            onChange={(e) => setForm(f => ({ ...f, precio_mensual: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">Limites (vacio = ilimitado)</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'max_empleados', label: 'Max Empleados' },
                                { key: 'max_elementos', label: 'Max Elementos' },
                                { key: 'max_alquileres', label: 'Max Alquileres' },
                                { key: 'max_cotizaciones', label: 'Max Cotizaciones' }
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-xs text-slate-500 mb-1">{label}</label>
                                    <input
                                        type="number"
                                        value={form[key]}
                                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        placeholder="\u221e"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm
                                                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">Features</p>
                        <div className="space-y-2">
                            {FEATURE_OPTIONS.map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-3 cursor-pointer py-1">
                                    <input
                                        type="checkbox"
                                        checked={!!form.features[key]}
                                        onChange={() => toggleFeature(key)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-600">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {isEdit && plan?.tenant_count > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                            {plan.tenant_count} tenants usan este plan. Los cambios aplican a todos.
                        </div>
                    )}

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
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium
                                       hover:bg-indigo-700 disabled:opacity-60 transition-colors min-h-[44px]"
                        >
                            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PlanForm
