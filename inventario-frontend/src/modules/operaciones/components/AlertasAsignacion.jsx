// ============================================
// COMPONENTE: Alertas de Asignación
// Muestra asignaciones pendientes del empleado
// con opción de aceptar o rechazar
// ============================================

import { useState } from 'react'
import { Bell, Check, X, AlertTriangle, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useGetMisAlertas, useResponderAsignacion } from '../hooks/useOrdenesTrabajo'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function AlertasAsignacion() {
  const { t } = useTranslation()
    const { alertas, isLoading } = useGetMisAlertas()
    const responder = useResponderAsignacion()
    const [expandida, setExpandida] = useState(null)
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [rechazandoId, setRechazandoId] = useState(null)

    const asignaciones = alertas.filter(a => a.tipo === 'asignacion')

    if (isLoading || asignaciones.length === 0) return null

    const handleAceptar = async (alerta) => {
        try {
            await responder.mutateAsync({
                ordenId: alerta.orden_id,
                datos: { respuesta: 'aceptada' }
            })
            toast.success(t('operations.alertsAssignment.assignmentAccepted', { name: alerta.evento_nombre || 'Orden #' + alerta.orden_id }))
        } catch (error) {
            toast.error(error.response?.data?.message || t('operations.alertsAssignment.acceptError'))
        }
    }

    const handleRechazar = async (alerta) => {
        if (!motivoRechazo.trim()) {
            toast.error(t('operations.alertsAssignment.rejectReasonRequired'))
            return
        }
        try {
            await responder.mutateAsync({
                ordenId: alerta.orden_id,
                datos: { respuesta: 'rechazada', motivo: motivoRechazo.trim() }
            })
            toast.success(t('operations.alertsAssignment.assignmentRejected'))
            setRechazandoId(null)
            setMotivoRechazo('')
        } catch (error) {
            toast.error(error.response?.data?.message || t('operations.alertsAssignment.rejectError'))
        }
    }

    return (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-amber-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800">
                    {t('operations.alertsAssignment.pendingAssignments', { count: asignaciones.length })}
                </span>
            </div>

            <div className="divide-y divide-amber-200">
                {asignaciones.map(alerta => (
                    <div key={alerta.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">
                                    {alerta.titulo}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-600">
                                    {alerta.evento_nombre && (
                                        <span>{alerta.evento_nombre}</span>
                                    )}
                                    {alerta.fecha_programada && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(alerta.fecha_programada).toLocaleDateString('es-CO')}
                                        </span>
                                    )}
                                    {(alerta.direccion_evento || alerta.ciudad_evento) && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {alerta.direccion_evento || alerta.ciudad_evento}
                                        </span>
                                    )}
                                </div>

                                {/* Detalle expandible */}
                                {expandida === alerta.id && (
                                    <p className="mt-2 text-sm text-slate-500">{alerta.mensaje}</p>
                                )}

                                <button
                                    onClick={() => setExpandida(expandida === alerta.id ? null : alerta.id)}
                                    className="mt-1 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-0.5"
                                >
                                    {expandida === alerta.id ? (
                                        <><ChevronUp className="w-3 h-3" /> {t('operations.alertsAssignment.less')}</>
                                    ) : (
                                        <><ChevronDown className="w-3 h-3" /> {t('operations.alertsAssignment.details')}</>
                                    )}
                                </button>
                            </div>

                            {/* Botones aceptar/rechazar */}
                            {rechazandoId !== alerta.id && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleAceptar(alerta)}
                                        disabled={responder.isPending}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        {t('operations.alertsAssignment.accept')}
                                    </button>
                                    <button
                                        onClick={() => { setRechazandoId(alerta.id); setMotivoRechazo('') }}
                                        disabled={responder.isPending}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        {t('operations.alertsAssignment.reject')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Formulario de rechazo */}
                        {rechazandoId === alerta.id && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-700">{t('operations.alertsAssignment.rejectReason')}</span>
                                </div>
                                <textarea
                                    value={motivoRechazo}
                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                    placeholder={t('operations.alertsAssignment.rejectPlaceholder')}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => { setRechazandoId(null); setMotivoRechazo('') }}
                                        className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={() => handleRechazar(alerta)}
                                        disabled={!motivoRechazo.trim() || responder.isPending}
                                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        {responder.isPending ? t('operations.assignInventoryModal.sending') : t('operations.alertsAssignment.confirmReject')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
