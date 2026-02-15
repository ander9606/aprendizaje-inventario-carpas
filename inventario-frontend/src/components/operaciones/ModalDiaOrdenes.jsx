// ============================================
// MODAL: Ordenes del Día
// Se abre al hacer clic en una fecha del calendario
// ============================================

import {
    Package,
    Truck,
    Clock,
    MapPin,
    Users,
    AlertCircle,
    CheckCircle,
    Calendar,
    ChevronRight
} from 'lucide-react'
import { Modal } from '../common/Modal'

const ESTADOS_CONFIG = {
    pendiente: { label: 'Pendiente', bg: 'bg-slate-100', text: 'text-slate-700' },
    confirmado: { label: 'Confirmado', bg: 'bg-blue-100', text: 'text-blue-700' },
    en_preparacion: { label: 'Preparación', bg: 'bg-amber-100', text: 'text-amber-700' },
    en_ruta: { label: 'En ruta', bg: 'bg-purple-100', text: 'text-purple-700' },
    en_sitio: { label: 'En sitio', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    en_proceso: { label: 'En proceso', bg: 'bg-cyan-100', text: 'text-cyan-700' },
    completado: { label: 'Completado', bg: 'bg-green-100', text: 'text-green-700' },
    cancelado: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-700' }
}

const formatHora = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatFechaCompleta = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T12:00:00')
    return fecha.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

/**
 * Fila de una orden dentro del modal de día
 */
const OrdenRow = ({ orden, onClickOrden }) => {
    const esMontaje = orden.tipo === 'montaje'
    const estadoConfig = ESTADOS_CONFIG[orden.estado] || ESTADOS_CONFIG.pendiente
    const esCompletado = orden.estado === 'completado'

    return (
        <button
            onClick={() => onClickOrden(orden)}
            className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                esCompletado
                    ? 'border-green-200 bg-green-50/50 hover:bg-green-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Icono tipo */}
                <div className={`p-2 rounded-lg shrink-0 ${
                    esCompletado ? 'bg-green-100' : esMontaje ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                    {esCompletado
                        ? <CheckCircle className="w-5 h-5 text-green-600" />
                        : esMontaje
                            ? <Package className="w-5 h-5 text-emerald-600" />
                            : <Truck className="w-5 h-5 text-amber-600" />
                    }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            esMontaje
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                            {esMontaje ? 'Montaje' : 'Desmontaje'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                            {estadoConfig.label}
                        </span>
                        <span className="text-xs text-slate-400">#{orden.id}</span>
                    </div>

                    <p className="font-semibold text-slate-900 truncate">
                        {orden.cliente_nombre || 'Sin cliente'}
                    </p>
                    {orden.evento_nombre && (
                        <p className="text-sm text-slate-500 truncate">{orden.evento_nombre}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatHora(orden.fecha_programada)}
                        </span>
                        {(orden.ciudad_evento || orden.direccion_evento) && (
                            <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5" />
                                {orden.ciudad_evento || ''}
                                {orden.direccion_evento ? ` - ${orden.direccion_evento}` : ''}
                            </span>
                        )}
                        {orden.total_equipo > 0 ? (
                            <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {orden.total_equipo}
                            </span>
                        ) : (
                            !esCompletado && (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Sin equipo
                                </span>
                            )
                        )}
                    </div>
                </div>

                {/* Flecha */}
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 mt-2" />
            </div>
        </button>
    )
}

/**
 * Modal que muestra todas las ordenes de un día específico
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} fecha - Fecha seleccionada (YYYY-MM-DD)
 * @param {Array} ordenes - Lista de ordenes para esa fecha
 * @param {function} onClickOrden - Handler al seleccionar una orden
 */
export default function ModalDiaOrdenes({ isOpen, onClose, fecha, ordenes = [], onClickOrden }) {
    const montajes = ordenes.filter(o => o.tipo === 'montaje')
    const desmontajes = ordenes.filter(o => o.tipo === 'desmontaje')

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <span className="block text-lg">Ordenes del día</span>
                        {fecha && (
                            <span className="block text-sm font-normal text-slate-500 capitalize">
                                {formatFechaCompleta(fecha)}
                            </span>
                        )}
                    </div>
                </div>
            }
            size="lg"
        >
            {/* Resumen rápido */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                    <span className="text-sm text-slate-600">Total:</span>
                    <span className="text-sm font-bold text-slate-900">{ordenes.length}</span>
                </div>
                {montajes.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">{montajes.length} montaje{montajes.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
                {desmontajes.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">{desmontajes.length} desmontaje{desmontajes.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* Lista de órdenes */}
            {ordenes.length === 0 ? (
                <div className="py-8 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay ordenes programadas</p>
                    <p className="text-sm text-slate-400">Este día no tiene operaciones</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {ordenes.map(orden => (
                        <OrdenRow
                            key={orden.id}
                            orden={orden}
                            onClickOrden={onClickOrden}
                        />
                    ))}
                </div>
            )}

            <Modal.Footer>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cerrar
                </button>
            </Modal.Footer>
        </Modal>
    )
}
