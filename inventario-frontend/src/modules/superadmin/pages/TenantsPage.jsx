// ============================================
// PÁGINA: TenantsPage
// Lista de tenants con filtros y CRUD
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetTenants, useGetPlanes } from '../hooks/useSuperadmin'
import { ESTADOS_TENANT } from '../constants'
import TenantForm from '../components/TenantForm'

const TenantsPage = () => {
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [estado, setEstado] = useState('')
    const [planId, setPlanId] = useState('')
    const [showForm, setShowForm] = useState(false)

    const { tenants, pagination, isLoading } = useGetTenants({
        page, limit: 15, search, estado, plan_id: planId
    })
    const { planes } = useGetPlanes()

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Tenants</h1>
                        <p className="text-sm text-slate-500">{pagination?.total || 0} registrados</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl
                               hover:bg-indigo-700 active:scale-[0.97] transition-all text-sm font-medium min-h-[44px]"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Tenant
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Buscar por nombre, slug, email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 min-h-[44px]"
                    />
                </div>
                <select
                    value={estado}
                    onChange={(e) => { setEstado(e.target.value); setPage(1) }}
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm min-h-[44px]
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">Todos los estados</option>
                    {Object.entries(ESTADOS_TENANT).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <select
                    value={planId}
                    onChange={(e) => { setPlanId(e.target.value); setPage(1) }}
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm min-h-[44px]
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">Todos los planes</option>
                    {planes.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Lista */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : tenants.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No se encontraron tenants</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tenants.map((tenant) => (
                        <div
                            key={tenant.id}
                            onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
                            className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-5
                                       hover:border-slate-300 cursor-pointer active:scale-[0.99] transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-slate-900">{tenant.nombre}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            tenant.estado === 'activo' ? 'bg-green-100 text-green-700' :
                                            tenant.estado === 'suspendido' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {ESTADOS_TENANT[tenant.estado]?.label || tenant.estado}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                                            {tenant.plan_nombre || 'Sin plan'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">slug: {tenant.slug}</p>
                                    {tenant.email_contacto && (
                                        <p className="text-sm text-slate-400 mt-0.5">{tenant.email_contacto}</p>
                                    )}
                                </div>
                                <div className="text-right text-sm text-slate-500 shrink-0">
                                    <p>${Number(tenant.precio_mensual || 0).toLocaleString()}/mes</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(tenant.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!pagination.hasPreviousPage}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200
                                   disabled:opacity-40 hover:bg-slate-50 active:bg-slate-100 transition-colors"
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
                                   disabled:opacity-40 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Modal crear */}
            {showForm && (
                <TenantForm
                    isOpen={showForm}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    )
}

export default TenantsPage
