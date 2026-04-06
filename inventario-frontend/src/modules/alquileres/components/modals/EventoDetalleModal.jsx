// ============================================
// COMPONENTE: EventoDetalleModal
// Modal para ver detalle de evento con cotizaciones
// ============================================

import { useState } from 'react'
import {
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
    AlertTriangle,
    Eye,
    Plus,
    ChevronRight,
    Edit,
    Trash2,
    Lock,
    Info,
    FileEdit,
    CalendarCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useGetEvento, useGetNovedadesEvento } from '../../hooks/useEventos'
import { useDeleteCotizacion, useAprobarCotizacion, useCambiarEstadoCotizacion } from '../../hooks/cotizaciones'
import Spinner from '@shared/components/Spinner'
import Button from '@shared/components/Button'
import Modal from '@shared/components/Modal'
import CotizacionDetalleModal from './CotizacionDetalleModal'
import AprobarCotizacionModal from './AprobarCotizacionModal'
import ListaNovedades from '../../../operaciones/components/ListaNovedades'
import { useTranslation } from 'react-i18next'

const EventoDetalleModal = ({ isOpen, onClose, eventoId, onCrearCotizacion, onEditarCotizacion }) => {
  const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { evento, isLoading, error } = useGetEvento(eventoId)
    const { novedades: novedadesEvento } = useGetNovedadesEvento(eventoId)

    // Estado para modales
    const [cotizacionDetalleId, setCotizacionDetalleId] = useState(null)
    const [cotizacionAprobarId, setCotizacionAprobarId] = useState(null)

    // Mutations
    const deleteMutation = useDeleteCotizacion()
    const aprobarMutation = useAprobarCotizacion()
    const cambiarEstadoMutation = useCambiarEstadoCotizacion()

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
            borrador: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: FileEdit, label: t('rentals.eventDetail.draft') },
            pendiente: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: t('rentals.pending') },
            aprobada: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: t('rentals.approved') },
            rechazada: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: t('rentals.rejected') },
            vencida: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle, label: t('rentals.expired') }
        }
        return config[estado] || config.pendiente
    }

    const getEstadoEventoConfig = (estado) => {
        const config = {
            activo: { color: 'bg-green-100 text-green-700', icon: Clock, label: t('rentals.active') },
            completado: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: t('rentals.completed') },
            cancelado: { color: 'bg-red-100 text-red-700', icon: XCircle, label: t('rentals.cancelled') }
        }
        return config[estado] || config.activo
    }

    const handleVerCotizacion = (cotizacionId) => {
        setCotizacionDetalleId(cotizacionId)
    }

    const handleEditarCotizacion = (cotizacion) => {
        if (onEditarCotizacion) {
            onEditarCotizacion(cotizacion)
            onClose()
        }
    }

    const handleEliminarCotizacion = async (cotizacionId) => {
        if (!confirm(t('rentals.eventDetail.confirmDeleteQuote'))) {
            return
        }
        try {
            await deleteMutation.mutateAsync(cotizacionId)
            // Invalidar cache del evento para refrescar la lista
            queryClient.invalidateQueries({ queryKey: ['evento', eventoId] })
        } catch (error) {
            alert(t('rentals.eventDetail.errorDeletingQuote') + ': ' + error.message)
        }
    }

    const handleAprobarCotizacion = async ({ id, opciones }) => {
        try {
            await aprobarMutation.mutateAsync({ id, opciones })
            setCotizacionAprobarId(null)
            setCotizacionDetalleId(null)
            // Invalidar cache del evento
            queryClient.invalidateQueries({ queryKey: ['evento', eventoId] })
        } catch (error) {
            alert(t('rentals.eventDetail.errorApprovingQuote') + ': ' + error.message)
        }
    }

    const handleRechazarCotizacion = async (cotizacion) => {
        try {
            await cambiarEstadoMutation.mutateAsync({ id: cotizacion.id, estado: 'rechazada' })
            setCotizacionDetalleId(null)
            queryClient.invalidateQueries({ queryKey: ['evento', eventoId] })
        } catch (error) {
            alert(t('rentals.eventDetail.errorRejectingQuote') + ': ' + error.message)
        }
    }

    const handleCrearCotizacion = (fechasPorConfirmar = false) => {
        if (onCrearCotizacion) {
            onCrearCotizacion(evento, { fechasPorConfirmar })
        }
        onClose()
    }

    // Verificar si el evento permite agregar cotizaciones
    const puedeAgregarCotizacion = evento?.puede_agregar_cotizaciones?.permitido !== false
    const motivoNoPuede = evento?.puede_agregar_cotizaciones?.motivo || ''

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={t('rentals.eventDetail')} size="xl">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-slate-600">{t('rentals.eventDetail.errorLoading')}</p>
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
                                        {t('rentals.client')}
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
                                        {t('rentals.eventDetail.eventDates')}
                                    </div>
                                    <p className="font-medium text-slate-900">
                                        {formatFecha(evento.fecha_inicio)}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {t('rentals.eventDetail.until')} {formatFecha(evento.fecha_fin)}
                                    </p>
                                </div>

                                {/* Ubicación */}
                                {(evento.direccion || evento.ciudad_nombre) && (
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                                            <MapPin className="w-4 h-4" />
                                            {t('common.location')}
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
                                        {t('rentals.eventDetail.summary')}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {evento.resumen?.total_cotizaciones || 0}
                                            </p>
                                            <p className="text-xs text-slate-500">{t('rentals.quotes')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-emerald-600">
                                                {formatMoneda(evento.resumen?.total_valor)}
                                            </p>
                                            <p className="text-xs text-slate-500">{t('rentals.totalValue')}</p>
                                        </div>
                                    </div>
                                    {evento.resumen?.cotizaciones_pendientes > 0 && (
                                        <p className="text-xs text-yellow-600 mt-2">
                                            {t('rentals.eventDetail.pendingApproval', { count: evento.resumen.cotizaciones_pendientes })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Notas */}
                            {evento.notas && (
                                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                                    <p className="text-xs text-slate-500 mb-1">{t('common.notes')}</p>
                                    <p className="text-sm text-slate-700">{evento.notas}</p>
                                </div>
                            )}
                        </div>

                        {/* Lista de Cotizaciones */}
                        <div>
                            {/* Banner de evento cerrado */}
                            {!puedeAgregarCotizacion && (
                                <div className="flex items-start gap-3 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">
                                            {t('rentals.eventDetail.cannotAddQuotes')}
                                        </p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            {motivoNoPuede}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-slate-500" />
                                    {t('rentals.eventDetail.eventQuotes')}
                                </h4>
                                {puedeAgregarCotizacion ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            icon={Plus}
                                            onClick={() => handleCrearCotizacion(false)}
                                        >
                                            {t('rentals.newQuote')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            icon={CalendarCheck}
                                            onClick={() => handleCrearCotizacion(true)}
                                            className="!text-amber-700 !bg-amber-50 !border-amber-200 hover:!bg-amber-100"
                                        >
                                            {t('rentals.eventDetail.noDates')}
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        {t('rentals.eventDetail.eventClosed')}
                                    </span>
                                )}
                            </div>

                            {evento.cotizaciones && evento.cotizaciones.length > 0 ? (
                                <div className="space-y-3">
                                    {evento.cotizaciones.map((cot) => {
                                        const estadoConfig = getEstadoConfig(cot.estado)
                                        const EstadoIcon = estadoConfig.icon
                                        const puedeEditar = ['pendiente', 'borrador'].includes(cot.estado)
                                        const puedeEliminar = ['pendiente', 'borrador', 'rechazada'].includes(cot.estado) && cot.tiene_alquiler === 0

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
                                                                    {t('rentals.eventDetail.withRental')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="font-medium text-slate-900 mb-1">
                                                            {cot.evento_nombre || t('rentals.quote')}
                                                        </p>

                                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                {cot.fecha_evento
                                                                    ? formatFecha(cot.fecha_evento)
                                                                    : <span className="text-amber-600 italic">{t('rentals.quoteCard.dateToConfirm')}</span>
                                                                }
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                                {t('rentals.quoteCard.productCount', { count: cot.total_productos })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-right ml-4">
                                                        <p className="text-lg font-bold text-slate-900">
                                                            {formatMoneda(cot.total)}
                                                        </p>
                                                        {cot.estado === 'borrador' && (
                                                            <p className="text-xs text-amber-600 font-medium">
                                                                {t('rentals.quoteCard.estimated')}
                                                            </p>
                                                        )}
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

                                                {/* Botones de acción */}
                                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleVerCotizacion(cot.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Ver
                                                    </button>

                                                    {puedeEditar && (
                                                        <button
                                                            onClick={() => handleEditarCotizacion(cot)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Editar
                                                        </button>
                                                    )}

                                                    {puedeEliminar && (
                                                        <button
                                                            onClick={() => handleEliminarCotizacion(cot.id)}
                                                            disabled={deleteMutation.isPending}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
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
                                    {puedeAgregarCotizacion && (
                                        <div className="flex items-center gap-2 justify-center">
                                            <Button
                                                size="sm"
                                                icon={Plus}
                                                onClick={() => handleCrearCotizacion(false)}
                                            >
                                                Crear Primera Cotización
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={CalendarCheck}
                                                onClick={() => handleCrearCotizacion(true)}
                                                className="!text-amber-700 !bg-amber-50 !border-amber-200 hover:!bg-amber-100"
                                            >
                                                Sin fechas
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Historial de Novedades */}
                        {novedadesEvento.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-semibold text-slate-900">
                                        Historial de Novedades
                                    </h3>
                                    <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                        {novedadesEvento.length}
                                    </span>
                                </div>
                                <ListaNovedades
                                    novedades={novedadesEvento}
                                    showOrdenInfo
                                    canResolve
                                    compact
                                />
                            </div>
                        )}
                    </div>
                ) : null}

                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de detalle de cotización */}
            <CotizacionDetalleModal
                isOpen={!!cotizacionDetalleId}
                onClose={() => setCotizacionDetalleId(null)}
                cotizacionId={cotizacionDetalleId}
                onEditar={handleEditarCotizacion}
                onAprobar={(cot) => setCotizacionAprobarId(cot.id)}
                onRechazar={handleRechazarCotizacion}
                isAprobando={cambiarEstadoMutation.isPending}
            />

            {/* Modal de aprobación de cotización */}
            <AprobarCotizacionModal
                isOpen={!!cotizacionAprobarId}
                onClose={() => setCotizacionAprobarId(null)}
                cotizacionId={cotizacionAprobarId}
                onAprobar={handleAprobarCotizacion}
                isAprobando={aprobarMutation.isPending}
            />
        </>
    )
}

export default EventoDetalleModal
