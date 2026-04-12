export const ESTADOS_TENANT = {
    activo: { label: 'Activo', color: 'success' },
    inactivo: { label: 'Inactivo', color: 'neutral' },
    suspendido: { label: 'Suspendido', color: 'danger' }
}

export const PLANES_DEFAULTS = {
    basico: { color: 'bg-slate-100 text-slate-700', label: 'Basico' },
    profesional: { color: 'bg-blue-100 text-blue-700', label: 'Profesional' },
    empresarial: { color: 'bg-purple-100 text-purple-700', label: 'Empresarial' }
}

export const METODOS_PAGO = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'otro', label: 'Otro' }
]

export const SLUGS_RESERVADOS = ['admin', 'api', 'www', 'app', 'superadmin']
