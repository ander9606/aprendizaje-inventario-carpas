// ============================================
// COMPONENTE: ListaNovedades
// Lista de novedades con estado de resolución
// Reutilizable en múltiples vistas
// ============================================

import { useState } from 'react'
import {
    AlertTriangle, Package, MapPin, Wrench, MessageSquare,
    CheckCircle, Clock, X, Image, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { useResolverNovedad } from '../hooks/useOrdenesTrabajo'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const TIPO_CONFIG = {
    cancelacion_producto: { label: 'Cancelación', icon: Package, color: 'red' },
    solicitud_adicional: { label: 'Solicitud adicional', icon: Package, color: 'blue' },
    cambio_ubicacion: { label: 'Cambio ubicación', icon: MapPin, color: 'purple' },
    dano_elemento: { label: 'Daño', icon: Wrench, color: 'orange' },
    otro: { label: 'Otro', icon: MessageSquare, color: 'slate' }
}

const ESTADO_CONFIG = {
    pendiente: { label: 'Pendiente', icon: Clock, classes: 'bg-amber-100 text-amber-700' },
    en_revision: { label: 'En revisión', icon: Clock, classes: 'bg-blue-100 text-blue-700' },
    resuelta: { label: 'Resuelta', icon: CheckCircle, classes: 'bg-green-100 text-green-700' },
    rechazada: { label: 'Rechazada', icon: X, classes: 'bg-red-100 text-red-700' }
}

function formatFechaCorta(fecha) {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
}

export default function ListaNovedades({ novedades = [], canResolve = false, showOrdenInfo = false, compact = false }) {
  const { t } = useTranslation()
    const resolverNovedad = useResolverNovedad()
    const [expandedId, setExpandedId] = useState(null)
    const [resolucionTexto, setResolucionTexto] = useState('')
    const [resolviendoId, setResolviendoId] = useState(null)

    if (novedades.length === 0) return null

    const handleResolver = async (novedadId) => {
        if (!resolucionTexto.trim()) {
            toast.error('Ingresa la resolución')
            return
        }

        try {
            await resolverNovedad.mutateAsync({
                novedadId,
                datos: { resolucion: resolucionTexto.trim() }
            })
            toast.success('Novedad resuelta')
            setResolviendoId(null)
            setResolucionTexto('')
        } catch {
            toast.error('Error al resolver la novedad')
        }
    }

    const pendientes = novedades.filter(n => n.estado === 'pendiente' || n.estado === 'en_revision').length

    return (
        <div className="space-y-2">
            {/* Badge resumen */}
            {pendientes > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {pendientes} novedad{pendientes !== 1 ? 'es' : ''} pendiente{pendientes !== 1 ? 's' : ''}
                </div>
            )}

            {novedades.map((novedad) => {
                const tipo = TIPO_CONFIG[novedad.tipo_novedad] || TIPO_CONFIG.otro
                const estado = ESTADO_CONFIG[novedad.estado] || ESTADO_CONFIG.pendiente
                const EstadoIcon = estado.icon
                const TipoIcon = tipo.icon
                const isExpanded = expandedId === novedad.id

                return (
                    <div
                        key={novedad.id}
                        className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                        {/* Row principal */}
                        <div
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedId(isExpanded ? null : novedad.id)}
                        >
                            <TipoIcon className={`w-4 h-4 shrink-0 text-${tipo.color}-500`} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-800 truncate">
                                        {tipo.label}
                                    </span>
                                    {showOrdenInfo && novedad.orden_tipo && (
                                        <span className="text-xs text-slate-400">
                                            ({novedad.orden_tipo})
                                        </span>
                                    )}
                                </div>
                                {!compact && (
                                    <p className="text-xs text-slate-500 truncate">{novedad.descripcion}</p>
                                )}
                            </div>

                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${estado.classes}`}>
                                {estado.label}
                            </span>

                            {isExpanded
                                ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            }
                        </div>

                        {/* Detalle expandido */}
                        {isExpanded && (
                            <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2">
                                <p className="text-sm text-slate-700">{novedad.descripcion}</p>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <span>Reportada: {formatFechaCorta(novedad.created_at)}</span>
                                    {novedad.reportada_por_nombre && (
                                        <span>Por: {novedad.reportada_por_nombre}</span>
                                    )}
                                    {novedad.cantidad_afectada > 1 && (
                                        <span>Cantidad: {novedad.cantidad_afectada}</span>
                                    )}
                                </div>

                                {novedad.imagen_url && (
                                    <img
                                        src={`${API_URL}${novedad.imagen_url}`}
                                        alt="Evidencia"
                                        className="w-full max-h-48 object-cover rounded-lg"
                                    />
                                )}

                                {/* Resolución existente */}
                                {novedad.resolucion && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                                        <p className="text-xs font-medium text-green-700 mb-1">Resolución:</p>
                                        <p className="text-sm text-green-800">{novedad.resolucion}</p>
                                        {novedad.resuelta_por_nombre && (
                                            <p className="text-xs text-green-600 mt-1">
                                                Por {novedad.resuelta_por_nombre} - {formatFechaCorta(novedad.fecha_resolucion)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Botón resolver (admin) */}
                                {canResolve && (novedad.estado === 'pendiente' || novedad.estado === 'en_revision') && (
                                    <div>
                                        {resolviendoId === novedad.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={resolucionTexto}
                                                    onChange={(e) => setResolucionTexto(e.target.value)}
                                                    placeholder="Describe la resolución..."
                                                    rows={2}
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleResolver(novedad.id)}
                                                        disabled={resolverNovedad.isPending}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {resolverNovedad.isPending
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <CheckCircle className="w-3.5 h-3.5" />
                                                        }
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        onClick={() => { setResolviendoId(null); setResolucionTexto('') }}
                                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setResolviendoId(novedad.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Resolver
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
