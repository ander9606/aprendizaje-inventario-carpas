// ============================================
// COMPONENTE: FotosOrden
// Galería de fotos operativas por etapa
// Con captura desde cámara del dispositivo
// ============================================

import { useState, useRef } from 'react'
import { Camera, Trash2, X, Image, ChevronDown, ChevronUp, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGetFotosOrden, useSubirFotoOrden, useEliminarFotoOrden } from '../hooks/useOrdenesTrabajo'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const ETAPAS_MONTAJE = [
    { key: 'cargue', label: 'Cargue', color: 'blue' },
    { key: 'llegada_sitio', label: 'Llegada al sitio', color: 'purple' },
    { key: 'montaje_terminado', label: 'Montaje terminado', color: 'green' }
]

const ETAPAS_DESMONTAJE = [
    { key: 'antes_desmontaje', label: 'Antes del desmontaje', color: 'amber' },
    { key: 'desmontaje_terminado', label: 'Desmontaje terminado', color: 'green' },
    { key: 'retorno', label: 'Retorno', color: 'slate' }
]

const COLORES = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100' }
}

export default function FotosOrden({ ordenId, tipoOrden = 'montaje', readOnly = false }) {
    const { fotos, porEtapa, isLoading } = useGetFotosOrden(ordenId)
    const subirFoto = useSubirFotoOrden()
    const eliminarFoto = useEliminarFotoOrden()

    const [expandedEtapa, setExpandedEtapa] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [etapaSeleccionada, setEtapaSeleccionada] = useState(null)
    const [notasFoto, setNotasFoto] = useState('')
    const [archivoFoto, setArchivoFoto] = useState(null)
    const [visorAbierto, setVisorAbierto] = useState(null)
    const fileInputRef = useRef(null)

    const etapas = tipoOrden === 'montaje' ? ETAPAS_MONTAJE : ETAPAS_DESMONTAJE

    const handleSeleccionarFoto = (etapaKey) => {
        setEtapaSeleccionada(etapaKey)
        fileInputRef.current?.click()
    }

    const handleArchivoSeleccionado = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar 5MB')
            return
        }

        setArchivoFoto(file)
        const reader = new FileReader()
        reader.onload = (ev) => setFotoPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const handleSubirFoto = async () => {
        if (!archivoFoto || !etapaSeleccionada) return

        const formData = new FormData()
        formData.append('imagen', archivoFoto)
        formData.append('etapa', etapaSeleccionada)
        if (notasFoto.trim()) {
            formData.append('notas', notasFoto.trim())
        }

        try {
            await subirFoto.mutateAsync({ ordenId, formData })
            toast.success('Foto subida correctamente')
            cancelarPreview()
        } catch {
            toast.error('Error al subir la foto')
        }
    }

    const handleEliminarFoto = async (fotoId) => {
        if (!confirm('¿Eliminar esta foto?')) return

        try {
            await eliminarFoto.mutateAsync({ ordenId, fotoId })
            toast.success('Foto eliminada')
            setVisorAbierto(null)
        } catch {
            toast.error('Error al eliminar la foto')
        }
    }

    const cancelarPreview = () => {
        setFotoPreview(null)
        setArchivoFoto(null)
        setEtapaSeleccionada(null)
        setNotasFoto('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const toggleEtapa = (key) => {
        setExpandedEtapa(expandedEtapa === key ? null : key)
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Camera className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900">Fotos de Operación</h3>
                </div>
                <div className="flex items-center justify-center py-8 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Cargando fotos...
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900">Fotos de Operación</h3>
                    {fotos.length > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {fotos.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Input oculto para captura */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleArchivoSeleccionado}
                className="hidden"
            />

            {/* Preview de foto antes de subir */}
            {fotoPreview && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-4">
                        <img
                            src={fotoPreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-3">
                            <div>
                                <span className="text-sm font-medium text-slate-700">Etapa: </span>
                                <span className="text-sm text-slate-600">
                                    {etapas.find(e => e.key === etapaSeleccionada)?.label}
                                </span>
                            </div>
                            <textarea
                                value={notasFoto}
                                onChange={(e) => setNotasFoto(e.target.value)}
                                placeholder="Notas (opcional)"
                                className="w-full text-sm border border-slate-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubirFoto}
                                    disabled={subirFoto.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {subirFoto.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    Subir
                                </button>
                                <button
                                    onClick={cancelarPreview}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300"
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Etapas con fotos */}
            <div className="space-y-3">
                {etapas.map(({ key, label, color }) => {
                    const fotosEtapa = porEtapa[key] || []
                    const isExpanded = expandedEtapa === key
                    const colores = COLORES[color]

                    return (
                        <div key={key} className={`rounded-lg border ${colores.border} overflow-hidden`}>
                            {/* Encabezado de etapa */}
                            <div
                                className={`flex items-center justify-between px-4 py-3 cursor-pointer ${colores.bg}`}
                                onClick={() => fotosEtapa.length > 0 && toggleEtapa(key)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${colores.text}`}>{label}</span>
                                    {fotosEtapa.length > 0 && (
                                        <span className={`text-xs font-medium px-1.5 py-0.5 ${colores.badge} ${colores.text} rounded-full`}>
                                            {fotosEtapa.length} foto{fotosEtapa.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!readOnly && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSeleccionarFoto(key) }}
                                            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${colores.text} hover:${colores.badge} transition-colors`}
                                        >
                                            <Camera className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Agregar</span>
                                        </button>
                                    )}
                                    {fotosEtapa.length > 0 && (
                                        isExpanded
                                            ? <ChevronUp className={`w-4 h-4 ${colores.text}`} />
                                            : <ChevronDown className={`w-4 h-4 ${colores.text}`} />
                                    )}
                                </div>
                            </div>

                            {/* Grid de fotos */}
                            {isExpanded && fotosEtapa.length > 0 && (
                                <div className="p-3 bg-white">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {fotosEtapa.map((foto) => (
                                            <div
                                                key={foto.id}
                                                className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                                                onClick={() => setVisorAbierto(foto)}
                                            >
                                                <img
                                                    src={`${API_URL}${foto.imagen_url}`}
                                                    alt={`Foto ${label}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                {foto.notas && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                                                        {foto.notas}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {isExpanded && fotosEtapa.length === 0 && (
                                <div className="p-4 bg-white text-center">
                                    <Image className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                                    <p className="text-sm text-slate-400">Sin fotos en esta etapa</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Empty state general */}
            {fotos.length === 0 && !fotoPreview && (
                <div className="text-center py-6 mt-2">
                    <Image className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No hay fotos registradas</p>
                    {!readOnly && (
                        <p className="text-xs text-slate-400 mt-1">Toca en una etapa para agregar fotos</p>
                    )}
                </div>
            )}

            {/* Visor de foto ampliada */}
            {visorAbierto && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setVisorAbierto(null)}
                >
                    <div
                        className="relative max-w-3xl w-full max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={`${API_URL}${visorAbierto.imagen_url}`}
                            alt="Foto ampliada"
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-white text-sm">
                                {visorAbierto.notas && <p>{visorAbierto.notas}</p>}
                                {visorAbierto.subido_por_nombre && (
                                    <p className="text-slate-400 text-xs mt-1">
                                        Subida por {visorAbierto.subido_por_nombre}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {!readOnly && (
                                    <button
                                        onClick={() => handleEliminarFoto(visorAbierto.id)}
                                        disabled={eliminarFoto.isPending}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                )}
                                <button
                                    onClick={() => setVisorAbierto(null)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30"
                                >
                                    <X className="w-4 h-4" />
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
