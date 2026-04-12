// ============================================
// COMPONENTE: CambiarEstadoModal
// Confirmación para cambiar estado de tenant
// ============================================

import { AlertTriangle, Power, PowerOff, X } from 'lucide-react'

const CambiarEstadoModal = ({ isOpen, onClose, tenant, onConfirm, loading }) => {
    if (!isOpen || !tenant) return null

    const isActive = tenant.estado === 'activo'
    const newEstado = isActive ? 'suspendido' : 'activo'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/40" />
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
                        isActive ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                        {isActive
                            ? <AlertTriangle className="w-7 h-7 text-red-600" />
                            : <Power className="w-7 h-7 text-green-600" />
                        }
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {isActive ? 'Suspender Tenant' : 'Activar Tenant'}
                    </h3>

                    <p className="text-sm text-slate-600 mb-1">
                        <span className="font-medium">{tenant.nombre}</span>
                    </p>

                    {isActive ? (
                        <p className="text-sm text-slate-500 mb-6">
                            Los usuarios de este tenant no podran acceder al sistema mientras este suspendido.
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500 mb-6">
                            El tenant y sus usuarios podran acceder nuevamente al sistema.
                        </p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium
                                       hover:bg-slate-200 transition-colors min-h-[44px]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onConfirm(newEstado)}
                            disabled={loading}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white
                                        transition-colors min-h-[44px] disabled:opacity-60 ${
                                isActive
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {loading ? 'Procesando...' : isActive ? 'Suspender' : 'Activar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CambiarEstadoModal
