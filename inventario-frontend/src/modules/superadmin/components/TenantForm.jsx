// ============================================
// COMPONENTE: TenantForm
// Modal para crear/editar tenant
// ============================================

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCrearTenant, useActualizarTenant, useGetPlanes } from '../hooks/useSuperadmin'
import { SLUGS_RESERVADOS } from '../constants'
import { toast } from 'sonner'

const TenantForm = ({ isOpen, onClose, tenant = null }) => {
    const isEdit = !!tenant
    const { planes } = useGetPlanes()
    const crear = useCrearTenant()
    const actualizar = useActualizarTenant()

    const [form, setForm] = useState({
        nombre: '', slug: '', email_contacto: '', telefono: '', nit: '', direccion: '', plan_id: 1
    })

    useEffect(() => {
        if (tenant) {
            setForm({
                nombre: tenant.nombre || '',
                slug: tenant.slug || '',
                email_contacto: tenant.email_contacto || '',
                telefono: tenant.telefono || '',
                nit: tenant.nit || '',
                direccion: tenant.direccion || '',
                plan_id: tenant.plan_id || 1
            })
        }
    }, [tenant])

    const generateSlug = (nombre) => {
        return nombre.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
    }

    const handleNombreChange = (e) => {
        const nombre = e.target.value
        setForm(f => ({
            ...f,
            nombre,
            ...(!isEdit ? { slug: generateSlug(nombre) } : {})
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.nombre.trim() || !form.slug.trim()) {
            toast.error('Nombre y slug son requeridos')
            return
        }

        if (!/^[a-z0-9-]+$/.test(form.slug)) {
            toast.error('Slug solo puede contener letras minusculas, numeros y guiones')
            return
        }

        if (SLUGS_RESERVADOS.includes(form.slug)) {
            toast.error('Slug reservado')
            return
        }

        try {
            if (isEdit) {
                await actualizar.mutateAsync({ id: tenant.id, data: form })
                toast.success('Tenant actualizado')
            } else {
                await crear.mutateAsync(form)
                toast.success('Tenant creado')
            }
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al guardar')
        }
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
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {isEdit ? 'Editar Tenant' : 'Nuevo Tenant'}
                    </h2>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={handleNombreChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                            disabled={isEdit}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                                       disabled:bg-slate-50 disabled:text-slate-500"
                            required
                        />
                        {!isEdit && (
                            <p className="text-xs text-slate-400 mt-1">URL: {form.slug || '...'}.logiq360.com</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={form.email_contacto}
                                onChange={(e) => setForm(f => ({ ...f, email_contacto: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
                            <input
                                type="text"
                                value={form.telefono}
                                onChange={(e) => setForm(f => ({ ...f, telefono: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">NIT</label>
                        <input
                            type="text"
                            value={form.nit}
                            onChange={(e) => setForm(f => ({ ...f, nit: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Direccion</label>
                        <input
                            type="text"
                            value={form.direccion}
                            onChange={(e) => setForm(f => ({ ...f, direccion: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                        <select
                            value={form.plan_id}
                            onChange={(e) => setForm(f => ({ ...f, plan_id: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {planes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre} - ${Number(p.precio_mensual || 0).toLocaleString()}/mes
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Footer */}
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
                            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Tenant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default TenantForm
