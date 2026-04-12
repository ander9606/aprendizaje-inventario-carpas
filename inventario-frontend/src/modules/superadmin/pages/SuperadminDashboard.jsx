// ============================================
// PÁGINA: SuperadminDashboard
// Estadísticas globales de la plataforma
// ============================================

import { useNavigate } from 'react-router-dom'
import {
    Building2,
    Users,
    Package,
    Calendar,
    CreditCard,
    AlertTriangle,
    TrendingUp
} from 'lucide-react'
import { useGetDashboard } from '../hooks/useSuperadmin'

const StatCard = ({ icon: Icon, label, value, color = 'blue', sub, onClick }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        slate: 'bg-slate-50 text-slate-600'
    }
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-slate-200 p-5 ${onClick ? 'cursor-pointer hover:border-slate-300 active:scale-[0.98] transition-all' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    )
}

const SuperadminDashboard = () => {
    const { dashboard, isLoading } = useGetDashboard()
    const navigate = useNavigate()

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const d = dashboard || {}
    const tenants = d.tenants || {}
    const pagos = d.pagos || {}

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
                <p className="text-sm text-slate-500 mt-1">Panel de control de la plataforma</p>
            </div>

            {/* Stats principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Building2}
                    label="Tenants Activos"
                    value={tenants.activos || 0}
                    sub={`${tenants.total || 0} total`}
                    color="blue"
                    onClick={() => navigate('/superadmin/tenants')}
                />
                <StatCard
                    icon={Users}
                    label="Empleados"
                    value={d.totalEmpleados || 0}
                    color="green"
                />
                <StatCard
                    icon={Package}
                    label="Elementos"
                    value={d.totalElementos || 0}
                    color="purple"
                />
                <StatCard
                    icon={Calendar}
                    label="Alquileres Activos"
                    value={d.totalAlquileresActivos || 0}
                    color="yellow"
                />
            </div>

            {/* Pagos + Plan distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Resumen de pagos */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-slate-600" />
                        <h2 className="font-semibold text-slate-900">Pagos</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-yellow-50 rounded-xl">
                            <p className="text-2xl font-bold text-yellow-700">{pagos.pendientes || 0}</p>
                            <p className="text-xs text-yellow-600">Pendientes</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                            <p className="text-2xl font-bold text-red-700">{pagos.vencidos || 0}</p>
                            <p className="text-xs text-red-600">Vencidos</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                            <p className="text-2xl font-bold text-green-700">
                                ${Number(pagos.monto_cobrado || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-green-600">Cobrado</p>
                        </div>
                    </div>
                    {pagos.monto_por_cobrar > 0 && (
                        <p className="text-sm text-slate-500 mt-3">
                            Por cobrar: <span className="font-medium text-slate-700">${Number(pagos.monto_por_cobrar).toLocaleString()}</span>
                        </p>
                    )}
                </div>

                {/* Tenants por plan */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-slate-600" />
                        <h2 className="font-semibold text-slate-900">Tenants por Plan</h2>
                    </div>
                    <div className="space-y-3">
                        {(d.tenantsPorPlan || []).map((plan) => (
                            <div key={plan.plan_nombre || 'sin-plan'} className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">{plan.plan_nombre || 'Sin plan'}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min((plan.total / Math.max(tenants.total, 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 w-8 text-right">{plan.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {d.tenantsNuevosEsteMes > 0 && (
                        <p className="text-sm text-green-600 mt-3">
                            +{d.tenantsNuevosEsteMes} nuevos este mes
                        </p>
                    )}
                </div>
            </div>

            {/* Tenants cerca de limites */}
            {d.tenantsCercaLimites?.length > 0 && (
                <div className="bg-white rounded-2xl border border-yellow-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <h2 className="font-semibold text-slate-900">Tenants cerca de limites</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">Tenant</th>
                                    <th className="pb-2 font-medium">Empleados</th>
                                    <th className="pb-2 font-medium">Elementos</th>
                                    <th className="pb-2 font-medium">Plan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {d.tenantsCercaLimites.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="hover:bg-slate-50 cursor-pointer"
                                        onClick={() => navigate(`/superadmin/tenants/${t.id}`)}
                                    >
                                        <td className="py-2.5 font-medium text-slate-900">{t.nombre}</td>
                                        <td className="py-2.5">
                                            <span className={t.empleados_count >= t.max_empleados ? 'text-red-600 font-medium' : ''}>
                                                {t.empleados_count}/{t.max_empleados || '\u221e'}
                                            </span>
                                        </td>
                                        <td className="py-2.5">
                                            <span className={t.elementos_count >= t.max_elementos ? 'text-red-600 font-medium' : ''}>
                                                {t.elementos_count}/{t.max_elementos || '\u221e'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-slate-500">{t.plan_nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SuperadminDashboard
