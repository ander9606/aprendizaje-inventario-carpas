// ============================================
// PÁGINA: PlanesPage
// Gestión de planes de suscripción
// ============================================

import { useState } from 'react'
import { Layers, Plus, Users, Package, Infinity, Edit, Trash2 } from 'lucide-react'
import { useGetPlanes, useEliminarPlan } from '../hooks/useSuperadmin'
import PlanForm from '../components/PlanForm'
import { toast } from 'sonner'

const PlanesPage = () => {
    const { planes, isLoading, refetch } = useGetPlanes()
    const [showForm, setShowForm] = useState(false)
    const [editPlan, setEditPlan] = useState(null)
    const eliminar = useEliminarPlan()

    const handleDelete = async (plan) => {
        if (plan.tenant_count > 0) {
            toast.error(`No se puede eliminar: ${plan.tenant_count} tenants usan este plan`)
            return
        }
        if (!confirm(`Eliminar plan "${plan.nombre}"?`)) return
        try {
            await eliminar.mutateAsync(plan.id)
            toast.success('Plan eliminado')
            refetch()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al eliminar')
        }
    }

    const handleEdit = (plan) => {
        setEditPlan(plan)
        setShowForm(true)
    }

    const handleClose = () => {
        setShowForm(false)
        setEditPlan(null)
        refetch()
    }

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Planes</h1>
                        <p className="text-sm text-slate-500">{planes.length} planes configurados</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditPlan(null); setShowForm(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl
                               hover:bg-indigo-700 active:scale-[0.97] transition-all text-sm font-medium min-h-[44px]"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Plan
                </button>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planes.map((plan) => {
                    const features = typeof plan.features === 'string' ? JSON.parse(plan.features || '{}') : (plan.features || {})
                    return (
                        <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{plan.nombre}</h3>
                                    <p className="text-sm text-slate-500">slug: {plan.slug}</p>
                                </div>
                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
                                    {plan.tenant_count} tenants
                                </span>
                            </div>

                            {/* Precio */}
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-slate-900">
                                    ${Number(plan.precio_mensual || 0).toLocaleString()}
                                </span>
                                <span className="text-slate-500 text-sm">/mes</span>
                            </div>

                            {/* Limites */}
                            <div className="space-y-2 mb-4 flex-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">
                                        {plan.max_empleados ? `${plan.max_empleados} empleados` : 'Empleados ilimitados'}
                                    </span>
                                    {!plan.max_empleados && <Infinity className="w-3.5 h-3.5 text-green-500" />}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">
                                        {plan.max_elementos ? `${plan.max_elementos} elementos` : 'Elementos ilimitados'}
                                    </span>
                                    {!plan.max_elementos && <Infinity className="w-3.5 h-3.5 text-green-500" />}
                                </div>
                            </div>

                            {/* Features */}
                            {Object.keys(features).length > 0 && (
                                <div className="border-t border-slate-100 pt-3 mb-4 space-y-1.5">
                                    {Object.entries(features).map(([key, val]) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] ${val ? 'bg-green-500' : 'bg-slate-300'}`}>
                                                {val ? '\u2713' : '\u2717'}
                                            </span>
                                            <span className="text-slate-600">{key.replace(/_/g, ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-700
                                               rounded-xl text-sm hover:bg-slate-100 active:scale-[0.97] transition-all min-h-[40px]"
                                >
                                    <Edit className="w-3.5 h-3.5" /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(plan)}
                                    disabled={plan.tenant_count > 0}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600
                                               rounded-xl text-sm hover:bg-red-100 active:scale-[0.97] transition-all min-h-[40px]
                                               disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            {showForm && (
                <PlanForm
                    isOpen={showForm}
                    onClose={handleClose}
                    plan={editPlan}
                />
            )}
        </div>
    )
}

export default PlanesPage
