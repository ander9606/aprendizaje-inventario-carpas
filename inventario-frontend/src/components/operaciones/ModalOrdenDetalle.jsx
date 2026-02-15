// ============================================
// MODAL: Detalle de Orden de Trabajo
// Se abre al hacer clic en un evento del calendario
// ============================================

import {
    Package,
    Truck,
    Clock,
    MapPin,
    User,
    Phone,
    AlertCircle,
    CheckCircle,
    Calendar,
    FileText,
    ExternalLink,
    Car,
    Users,
    Star
} from 'lucide-react'
import { Modal } from '../common/Modal'

const ESTADOS_CONFIG = {
    pendiente: { label: 'Pendiente', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
    confirmado: { label: 'Confirmado', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
    en_preparacion: { label: 'Preparación', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
    en_ruta: { label: 'En ruta', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
    en_sitio: { label: 'En sitio', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400' },
    en_proceso: { label: 'En proceso', bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-400' },
    completado: { label: 'Completado', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
    cancelado: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' }
}

const PRIORIDAD_CONFIG = {
    baja: { label: 'Baja', color: 'text-slate-500' },
    normal: { label: 'Normal', color: 'text-blue-600' },
    alta: { label: 'Alta', color: 'text-orange-600' },
    urgente: { label: 'Urgente', color: 'text-red-600' }
}

const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const formatHora = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatMoneda = (valor) => {
    if (!valor) return '-'
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor)
}

/**
 * Modal de detalle de una orden de trabajo
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {Object} orden - Datos de la orden del calendario
 * @param {function} onVerDetalle - Navegar a la página completa
 * @param {function} onOrdenCargue - Abrir modal de orden de cargue
 */
export default function ModalOrdenDetalle({ isOpen, onClose, orden, onVerDetalle, onOrdenCargue }) {
    if (!orden) return null

    const esMontaje = orden.tipo === 'montaje'
    const estadoConfig = ESTADOS_CONFIG[orden.estado] || ESTADOS_CONFIG.pendiente
    const prioridadConfig = PRIORIDAD_CONFIG[orden.prioridad] || PRIORIDAD_CONFIG.normal
    const esCompletado = orden.estado === 'completado'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${esMontaje ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        {esMontaje
                            ? <Package className="w-5 h-5 text-emerald-600" />
                            : <Truck className="w-5 h-5 text-amber-600" />
                        }
                    </div>
                    <span>
                        {esMontaje ? 'Montaje' : 'Desmontaje'} #{orden.id}
                    </span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-5">
                {/* Estado y prioridad */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                        <span className={`w-2 h-2 rounded-full ${estadoConfig.dot}`} />
                        {estadoConfig.label}
                    </span>
                    {orden.prioridad && orden.prioridad !== 'normal' && (
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${prioridadConfig.color}`}>
                            <Star className="w-4 h-4" />
                            {prioridadConfig.label}
                        </span>
                    )}
                    {esCompletado && (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Completada
                        </span>
                    )}
                </div>

                {/* Cliente */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</h4>
                    <p className="text-lg font-semibold text-slate-900">
                        {orden.cliente_nombre || 'Sin cliente'}
                    </p>
                    {orden.cliente_telefono && (
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {orden.cliente_telefono}
                        </p>
                    )}
                </div>

                {/* Evento */}
                {orden.evento_nombre && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                        <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Evento</h4>
                        <p className="text-base font-medium text-slate-900">{orden.evento_nombre}</p>
                        {orden.fecha_evento && (
                            <p className="flex items-center gap-2 text-sm text-slate-600">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                Evento: {formatFecha(orden.fecha_evento)}
                            </p>
                        )}
                    </div>
                )}

                {/* Fecha y hora programada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Fecha programada</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {formatFecha(orden.fecha_programada)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Hora</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {formatHora(orden.fecha_programada)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ubicación */}
                {(orden.direccion_evento || orden.ciudad_evento) && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Ubicación</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {orden.ciudad_evento || ''}
                            </p>
                            {orden.direccion_evento && (
                                <p className="text-sm text-slate-600">{orden.direccion_evento}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Equipo asignado */}
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium">Equipo de trabajo</p>
                        {orden.total_equipo > 0 ? (
                            <>
                                <p className="text-sm font-semibold text-slate-900">
                                    {orden.total_equipo} {orden.total_equipo === 1 ? 'persona' : 'personas'}
                                </p>
                                {orden.equipo_nombres && (
                                    <p className="text-sm text-slate-600 mt-0.5">{orden.equipo_nombres}</p>
                                )}
                            </>
                        ) : (
                            <p className="flex items-center gap-1 text-sm text-amber-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Sin equipo asignado
                            </p>
                        )}
                    </div>
                </div>

                {/* Vehículo */}
                {(orden.vehiculo_placa || orden.vehiculo_marca) && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg">
                            <Car className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Vehículo</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {orden.vehiculo_marca || ''} {orden.vehiculo_placa ? `(${orden.vehiculo_placa})` : ''}
                            </p>
                        </div>
                    </div>
                )}

                {/* Valor cotización */}
                {orden.cotizacion_total && (
                    <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-sm text-slate-600">Valor cotización:</span>
                        <span className="text-lg font-bold text-green-700">{formatMoneda(orden.cotizacion_total)}</span>
                    </div>
                )}
            </div>

            {/* Footer con acciones */}
            <Modal.Footer>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cerrar
                </button>
                {onOrdenCargue && (
                    <button
                        onClick={() => {
                            onOrdenCargue(orden)
                            onClose()
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Orden de Cargue
                    </button>
                )}
                {onVerDetalle && (
                    <button
                        onClick={() => {
                            onVerDetalle(orden.id)
                            onClose()
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Ver Detalle Completo
                    </button>
                )}
            </Modal.Footer>
        </Modal>
    )
}
