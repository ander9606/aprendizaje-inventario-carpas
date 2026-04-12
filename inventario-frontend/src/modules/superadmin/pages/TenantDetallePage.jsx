// ============================================
// PÁGINA: TenantDetallePage
// Detalle de un tenant con stats, empleados y pagos
// ============================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Building2, Users, Package, Calendar, FileText,
    Edit, Power, PowerOff, AlertTriangle
} from 'lucide-react'
import { useGetTenant, useGetTenantEmpleados, useGetTenantPagos, useCambiarEstadoTenant } from '../hooks/useSuperadmin'
import { ESTADOS_TENANT } from '../constants'
import TenantForm from '../components/TenantForm'
import CambiarEstadoModal from '../components/CambiarEstadoModal'
import { toast } from 'sonner'

const TenantDetallePage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { tenant, isLoading, refetch } = useGetTenant(id)
    const { empleados } = useGetTenantEmpleados(id)
    const { pagos } = useGetTenantPagos(id)
    const [showEdit, setShowEdit] = useState(false)
    const [showEstado, setShowEstado] = useState(false)

    const cambiarEstado = useCambiarEstadoTenant()

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!tenant) {
        return (
            <div className="p-6 text-center">
                <p className="text-slate-500">Tenant no encontrado</p>
                <button onClick={() => navigate('/superadmin/tenants')} className="text-indigo-600 mt-2">Volver</button>
            </div>
        )
    }

    const stats = tenant.estadisticas || {}
    const maxEmp = tenant.max_empleados
    const maxElem = tenant.max_elementos

    const handleEstadoChange = async (estado) => {
        try {
            await cambiarEstado.mutateAsync({ id: tenant.id, estado })
            toast.success(`Tenant ${estado === 'activo' ? 'activado' : estado === 'suspendido' ? 'suspendido' : 'desactivado'}`)
            refetch()
            setShowEstado(false)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al cambiar estado')
        }
    }

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
            {/* Back + header */}
            <div>
                <button
                    onClick={() => navigate('/superadmin/tenants')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" /> Tenants
                </button>
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-slate-900">{tenant.nombre}</h1>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                tenant.estado === 'activo' ? 'bg-green-100 text-green-700' :
                                tenant.estado === 'suspendido' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {ESTADOS_TENANT[tenant.estado]?.label}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                                {tenant.plan_nombre}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">slug: {tenant.slug}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEdit(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl
                                       text-sm hover:bg-slate-50 active:scale-[0.97] transition-all min-h-[40px]"
                        >
                            <Edit className="w-4 h-4" /> Editar
                        </button>
                        {tenant.id !== 1 && (
                            <button
                                onClick={() => setShowEstado(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl
                                           text-sm hover:bg-slate-50 active:scale-[0.97] transition-all min-h-[40px]"
                            >
                                {tenant.estado === 'activo'
                                    ? <><PowerOff className="w-4 h-4 text-red-500" /> Suspender</>
                                    : <><Power className="w-4 h-4 text-green-500" /> Activar</>
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Info + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Informacion
                    </h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                            ['NIT', tenant.nit],
                            ['Email', tenant.email_contacto],
                            ['Telefono', tenant.telefono],
                            ['Direccion', tenant.direccion],
                            ['Plan', `${tenant.plan_nombre} ($${Number(tenant.precio_mensual || 0).toLocaleString()}/mes)`],
                            ['Creado', new Date(tenant.created_at).toLocaleDateString()]
                        ].map(([label, val]) => (
                            <div key={label}>
                                <p className="text-slate-400 text-xs">{label}</p>
                                <p className="text-slate-700">{val || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h2 className="font-semibold text-slate-900 mb-4">Estadisticas</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl text-center">
                            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-blue-700">
                                {stats.empleados || 0}{maxEmp ? `/${maxEmp}` : ''}
                            </p>
                            <p className="text-xs text-blue-600">Empleados</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl text-center">
                            <Package className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-purple-700">
                                {stats.elementos || 0}{maxElem ? `/${maxElem}` : ''}
                            </p>
                            <p className="text-xs text-purple-600">Elementos</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-xl text-center">
                            <Calendar className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-yellow-700">{stats.alquileres_activos || 0}</p>
                            <p className="text-xs text-yellow-600">Alquileres</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-center">
                            <FileText className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-green-700">{stats.cotizaciones || 0}</p>
                            <p className="text-xs text-green-600">Cotizaciones</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empleados */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Empleados ({empleados.length})
                </h2>
                {empleados.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Sin empleados</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">Nombre</th>
                                    <th className="pb-2 font-medium">Email</th>
                                    <th className="pb-2 font-medium">Rol</th>
                                    <th className="pb-2 font-medium">Estado</th>
                                    <th className="pb-2 font-medium">Ultimo login</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {empleados.map((e) => (
                                    <tr key={e.id} className="hover:bg-slate-50">
                                        <td className="py-2.5 font-medium text-slate-900">{e.nombre} {e.apellido}</td>
                                        <td className="py-2.5 text-slate-600">{e.email}</td>
                                        <td className="py-2.5">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                                                {e.rol_nombre || '-'}
                                            </span>
                                        </td>
                                        <td className="py-2.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                e.estado === 'activo' ? 'bg-green-100 text-green-700' :
                                                e.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {e.estado}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-slate-400 text-xs">
                                            {e.ultimo_login ? new Date(e.ultimo_login).toLocaleString() : 'Nunca'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Historial de pagos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Historial de Pagos
                </h2>
                {pagos.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Sin registros de pago</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">Periodo</th>
                                    <th className="pb-2 font-medium">Monto</th>
                                    <th className="pb-2 font-medium">Estado</th>
                                    <th className="pb-2 font-medium">Fecha Pago</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pagos.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="py-2.5 text-slate-700">
                                            {new Date(p.periodo_inicio).toLocaleDateString('es', { month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-2.5 font-medium">${Number(p.monto).toLocaleString()}</td>
                                        <td className="py-2.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                p.pagado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {p.pagado ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-slate-400">
                                            {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showEdit && (
                <TenantForm
                    isOpen={showEdit}
                    onClose={() => { setShowEdit(false); refetch() }}
                    tenant={tenant}
                />
            )}
            {showEstado && (
                <CambiarEstadoModal
                    isOpen={showEstado}
                    onClose={() => setShowEstado(false)}
                    tenant={tenant}
                    onConfirm={handleEstadoChange}
                    loading={cambiarEstado.isPending}
                />
            )}
        </div>
    )
}

export default TenantDetallePage
