// ============================================
// COMPONENTE: ClienteHistorialModal
// Modal para ver historial de eventos de un cliente
// Permite ver eventos pasados y repetir alquileres
// ============================================

import {
    X,
    Calendar,
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Package,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    History
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetHistorialEventos } from '../../hooks/useClientes'
import Spinner from '@shared/components/Spinner'
import Button from '@shared/components/Button'
import { useTranslation } from 'react-i18next'

const ClienteHistorialModal = ({ isOpen, onClose, clienteId, onRepetirEvento }) => {
  const { t } = useTranslation()
    const navigate = useNavigate()
    const { historial, isLoading, error } = useGetHistorialEventos(isOpen ? clienteId : null)
    const [expandedEvento, setExpandedEvento] = useState(null)

    if (!isOpen) return null

    const formatFecha = (fecha) => {
        if (!fecha) return '-'
        const fechaStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha
        const fechaObj = new Date(fechaStr + 'T12:00:00')
        if (isNaN(fechaObj.getTime())) return '-'
        return fechaObj.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatMoneda = (valor) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor || 0)
    }

    const getEstadoConfig = (estado) => {
        const config = {
            activo: { color: 'bg-green-100 text-green-700', icon: Clock, label: 'Activo' },
            completado: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completado' },
            cancelado: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelado' }
        }
        return config[estado] || config.activo
    }

    const toggleEvento = (eventoId) => {
        setExpandedEvento(expandedEvento === eventoId ? null : eventoId)
    }

    const cliente = historial?.cliente
    const eventos = historial?.eventos || []
    const resumen = historial?.resumen

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <History className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Historial de Eventos
                            </h2>
                            <p className="text-sm text-slate-500">
                                {cliente?.nombre || 'Cliente'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-slate-600">Error al cargar el historial</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Info del cliente */}
                            {cliente && (
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{cliente.nombre}</p>
                                            <p className="text-xs text-slate-500">
                                                {cliente.tipo_documento} {cliente.numero_documento}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        {cliente.telefono && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                {cliente.telefono}
                                            </span>
                                        )}
                                        {cliente.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {cliente.email}
                                            </span>
                                        )}
                                        {cliente.ciudad && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {cliente.ciudad}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Resumen */}
                            {resumen && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-slate-900">
                                            {resumen.total_eventos || 0}
                                        </p>
                                        <p className="text-xs text-slate-500">Eventos totales</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {resumen.eventos_completados || 0}
                                        </p>
                                        <p className="text-xs text-slate-500">Completados</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {resumen.eventos_activos || 0}
                                        </p>
                                        <p className="text-xs text-slate-500">Activos</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                                        <p className="text-lg font-bold text-emerald-600">
                                            {formatMoneda(resumen.total_facturado)}
                                        </p>
                                        <p className="text-xs text-slate-500">Total facturado</p>
                                    </div>
                                </div>
                            )}

                            {/* Lista de eventos */}
                            <div>
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-slate-500" />
                                    Eventos ({eventos.length})
                                </h4>

                                {eventos.length > 0 ? (
                                    <div className="space-y-3">
                                        {eventos.map((evento) => {
                                            const estadoConfig = getEstadoConfig(evento.estado)
                                            const EstadoIcon = estadoConfig.icon
                                            const isExpanded = expandedEvento === evento.id

                                            return (
                                                <div
                                                    key={evento.id}
                                                    className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                                                >
                                                    {/* Evento header */}
                                                    <button
                                                        onClick={() => toggleEvento(evento.id)}
                                                        className="w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                                                    >
                                                        <div className="mt-0.5">
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h5 className="font-semibold text-slate-900 truncate">
                                                                    {evento.nombre}
                                                                </h5>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${estadoConfig.color}`}>
                                                                    <EstadoIcon className="w-3 h-3" />
                                                                    {estadoConfig.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {formatFecha(evento.fecha_inicio)}
                                                                    {evento.fecha_fin !== evento.fecha_inicio && (
                                                                        <> - {formatFecha(evento.fecha_fin)}</>
                                                                    )}
                                                                </span>
                                                                {evento.ciudad_nombre && (
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="w-3.5 h-3.5" />
                                                                        {evento.ciudad_nombre}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <FileText className="w-3.5 h-3.5" />
                                                                    {evento.total_cotizaciones} cotizaci{evento.total_cotizaciones !== 1 ? 'ones' : 'on'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 ml-2">
                                                            <p className="font-bold text-slate-900">
                                                                {formatMoneda(evento.valor_aprobado)}
                                                            </p>
                                                            {evento.total_alquileres > 0 && (
                                                                <p className="text-xs text-slate-500">
                                                                    {evento.alquileres_finalizados}/{evento.total_alquileres} alq.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Detalle expandido */}
                                                    {isExpanded && (
                                                        <div className="border-t border-slate-100 p-4 bg-slate-50">
                                                            {/* Productos alquilados */}
                                                            {evento.productos && evento.productos.length > 0 ? (
                                                                <div>
                                                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                        <Package className="w-3.5 h-3.5" />
                                                                        Productos alquilados
                                                                    </p>
                                                                    <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                                                                        {evento.productos.map((prod, idx) => (
                                                                            <div key={idx} className="px-3 py-2 flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-sm text-slate-900">
                                                                                        {prod.nombre_producto}
                                                                                    </span>
                                                                                    <span className="text-xs text-slate-500">
                                                                                        x{prod.cantidad}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-sm font-medium text-slate-700">
                                                                                    {formatMoneda(prod.subtotal)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-slate-500 italic">
                                                                    Sin productos aprobados registrados
                                                                </p>
                                                            )}

                                                            {/* Direccion del evento */}
                                                            {evento.direccion && (
                                                                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                                    {evento.direccion}
                                                                </div>
                                                            )}

                                                            {/* Boton repetir evento */}
                                                            {onRepetirEvento && evento.estado === 'completado' && (
                                                                <div className="mt-4 pt-3 border-t border-slate-200">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        icon={<RefreshCw className="w-4 h-4" />}
                                                                        onClick={() => onRepetirEvento(evento, cliente)}
                                                                    >
                                                                        Repetir este evento
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">
                                            Este cliente no tiene eventos registrados
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between">
                    <Button
                        variant="ghost"
                        icon={<History className="w-4 h-4" />}
                        onClick={() => {
                            onClose()
                            navigate('/alquileres/historial-eventos')
                        }}
                        className="text-purple-600 hover:bg-purple-50"
                    >
                        Ver historial completo
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ClienteHistorialModal
