// ============================================
// COMPONENTE: EventoDetalleModal
// Modal para ver detalle de evento con cotizaciones
// ============================================

import { useState } from 'react'
import {
    X,
    Calendar,
    User,
    MapPin,
    Phone,
    Mail,
    FileText,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    Plus,
    ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGetEvento } from '../../hooks/useEventos'
import Spinner from '../common/Spinner'
import Button from '../common/Button'

const EventoDetalleModal = ({ isOpen, onClose, eventoId, onCrearCotizacion }) => {
    const navigate = useNavigate()
    const { evento, isLoading, error } = useGetEvento(eventoId)

    if (!isOpen) return null

    const formatFecha = (fecha) => {
        if (!fecha) return '-'
        // Manejar tanto formato ISO completo como solo fecha
        const fechaStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha
        const fechaObj = new Date(fechaStr + 'T12:00:00')
        if (isNaN(fechaObj.getTime())) return '-'
        return fechaObj.toLocaleDateString('es-CO', {
            weekday: 'short',
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
            pendiente: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pendiente' },
            aprobada: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Aprobada' },
            rechazada: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rechazada' },
            vencida: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle, label: 'Vencida' }
        }
        return config[estado] || config.pendiente
    }

    const getEstadoEventoConfig = (estado) => {
        const config = {
            activo: { color: 'bg-green-100 text-green-700', icon: Clock, label: 'Activo' },
            completado: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completado' },
            cancelado: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelado' }
        }
        return config[estado] || config.activo
    }

    const handleVerCotizacion = (cotizacionId) => {
        // Navegar a la página de cotizaciones (o abrir modal de detalle)
        navigate('/alquileres/cotizaciones')
        onClose()
    }

    const handleCrearCotizacion = () => {
        if (onCrearCotizacion) {
            onCrearCotizacion(evento)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Detalle del Evento
                            </h2>
                            <p className="text-sm text-slate-500">
                                Información y cotizaciones asociadas
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
                            <p className="text-slate-600">Error al cargar el evento</p>
                        </div>
                    ) : evento ? (
                        <div className="space-y-6">
                            {/* Información del Evento */}
                            <div className="bg-slate-50 rounded-xl p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {evento.nombre}
                                        </h3>
                                        {evento.descripcion && (
                                            <p className="text-sm text-slate-600 mt-1">
                                                {evento.descripcion}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getEstadoEventoConfig(evento.estado).color}`}>
                                        {(() => {
                                            const Icon = getEstadoEventoConfig(evento.estado).icon
                                            return <Icon className="w-3.5 h-3.5" />
                                        })()}
                                        {getEstadoEventoConfig(evento.estado).label}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Cliente */}
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                                            <User className="w-4 h-4" />
                                            Cliente
                                        </div>
                                        <p className="font-semibold text-slate-900">
                                            {evento.cliente_nombre}
                                        </p>
                                        {evento.cliente_telefono && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                {evento.cliente_telefono}
                                            </div>
                                        )}
                                        {evento.cliente_email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                {evento.cliente_email}
                                            </div>
                                        )}
                                    </div>

                                    {/* Fechas */}
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                                            <Calendar className="w-4 h-4" />
                                            Fechas del Evento
                                        </div>
                                        <p className="font-medium text-slate-900">
                                            {formatFecha(evento.fecha_inicio)}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            hasta {formatFecha(evento.fecha_fin)}
                                        </p>
                                    </div>

                                    {/* Ubicación */}
                                    {(evento.direccion || evento.ciudad_nombre) && (
                                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                                                <MapPin className="w-4 h-4" />
                                                Ubicación
                                            </div>
                                            {evento.ciudad_nombre && (
                                                <p className="font-medium text-slate-900">
                                                    {evento.ciudad_nombre}
                                                </p>
                                            )}
                                            {evento.direccion && (
                                                <p className="text-sm text-slate-600">
                                                    {evento.direccion}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Resumen */}
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                                            <DollarSign className="w-4 h-4" />
                                            Resumen
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {evento.resumen?.total_cotizaciones || 0}
                                                </p>
                                                <p className="text-xs text-slate-500">Cotizaciones</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-emerald-600">
                                                    {formatMoneda(evento.resumen?.total_valor)}
                                                </p>
                                                <p className="text-xs text-slate-500">Valor total</p>
                                            </div>
                                        </div>
                                        {evento.resumen?.cotizaciones_pendientes > 0 && (
                                            <p className="text-xs text-yellow-600 mt-2">
                                                {evento.resumen.cotizaciones_pendientes} pendiente(s) de aprobación
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Notas */}
                                {evento.notas && (
                                    <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-500 mb-1">Notas</p>
                                        <p className="text-sm text-slate-700">{evento.notas}</p>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Cotizaciones */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-slate-500" />
                                        Cotizaciones del Evento
                                    </h4>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={Plus}
                                        onClick={handleCrearCotizacion}
                                    >
                                        Nueva Cotización
                                    </Button>
                                </div>

                                {evento.cotizaciones && evento.cotizaciones.length > 0 ? (
                                    <div className="space-y-3">
                                        {evento.cotizaciones.map((cot) => {
                                            const estadoConfig = getEstadoConfig(cot.estado)
                                            const EstadoIcon = estadoConfig.icon

                                            return (
                                                <div
                                                    key={cot.id}
                                                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-sm font-medium text-slate-500">
                                                                    #{cot.id}
                                                                </span>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${estadoConfig.color}`}>
                                                                    <EstadoIcon className="w-3 h-3" />
                                                                    {estadoConfig.label}
                                                                </span>
                                                                {cot.tiene_alquiler > 0 && (
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                        Con alquiler
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="font-medium text-slate-900 mb-1">
                                                                {cot.evento_nombre || 'Cotización'}
                                                            </p>

                                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                    {formatFecha(cot.fecha_evento)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                                    {cot.total_productos} producto{cot.total_productos !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right ml-4">
                                                            <p className="text-lg font-bold text-slate-900">
                                                                {formatMoneda(cot.total)}
                                                            </p>
                                                            {cot.descuento > 0 && (
                                                                <p className="text-xs text-emerald-600">
                                                                    -{formatMoneda(cot.descuento)} desc.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Fechas de montaje/desmontaje */}
                                                    {(cot.fecha_montaje !== cot.fecha_evento || cot.fecha_desmontaje !== cot.fecha_evento) && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
                                                            {cot.fecha_montaje !== cot.fecha_evento && (
                                                                <span>
                                                                    Montaje: {formatFecha(cot.fecha_montaje)}
                                                                </span>
                                                            )}
                                                            {cot.fecha_desmontaje !== cot.fecha_evento && (
                                                                <span>
                                                                    Desmontaje: {formatFecha(cot.fecha_desmontaje)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 mb-3">
                                            Este evento no tiene cotizaciones
                                        </p>
                                        <Button
                                            size="sm"
                                            icon={Plus}
                                            onClick={handleCrearCotizacion}
                                        >
                                            Crear Primera Cotización
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EventoDetalleModal
