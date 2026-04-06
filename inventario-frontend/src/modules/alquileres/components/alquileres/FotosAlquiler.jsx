// ============================================
// COMPONENTE: FotosAlquiler
// Muestra fotos operativas de montaje y desmontaje
// Vista de solo lectura para el módulo de alquileres
// ============================================

import { useState } from 'react'
import { Camera, X, Image, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useGetFotosAlquiler } from '../../hooks/useAlquileres'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const ETAPA_KEYS = ['cargue', 'llegada_sitio', 'montaje_terminado', 'antes_desmontaje', 'desmontaje_terminado', 'retorno']

const ORDEN_COLORS = {
    montaje: 'blue',
    desmontaje: 'orange'
}

export default function FotosAlquiler({ alquilerId }) {
  const { t } = useTranslation()
    const { fotos, porOrden, isLoading } = useGetFotosAlquiler(alquilerId)
    const [expandedSection, setExpandedSection] = useState(null)
    const [visorAbierto, setVisorAbierto] = useState(null)

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Camera className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('rentals.photoEvidence')}</h3>
                </div>
                <div className="flex items-center justify-center py-8 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {t('rentals.loadingPhotos')}
                </div>
            </div>
        )
    }

    if (fotos.length === 0) {
        return null // No mostrar sección si no hay fotos
    }

    const toggleSection = (key) => {
        setExpandedSection(expandedSection === key ? null : key)
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
                <Camera className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900">{t('rentals.photoEvidence')}</h3>
                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {fotos.length}
                </span>
            </div>

            <div className="space-y-4">
                {Object.entries(porOrden).map(([tipo, etapas]) => {
                    const color = ORDEN_COLORS[tipo] || 'slate'
                    const label = t(`rentals.photoOrderTypes.${tipo}`, tipo)
                    const totalFotos = Object.values(etapas).flat().length
                    const sectionKey = tipo

                    return (
                        <div key={tipo}>
                            {/* Encabezado por tipo de orden */}
                            <button
                                onClick={() => toggleSection(sectionKey)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                                    <span className="text-xs text-slate-500">({t('rentals.photosCount', { count: totalFotos })})</span>
                                </div>
                                {expandedSection === sectionKey
                                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                                }
                            </button>

                            {expandedSection === sectionKey && (
                                <div className="mt-2 space-y-3 pl-4">
                                    {Object.entries(etapas).map(([etapa, fotosEtapa]) => (
                                        <div key={etapa}>
                                            <p className="text-xs font-medium text-slate-500 mb-1.5">
                                                {t(`rentals.photoStages.${etapa}`, etapa)}
                                            </p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {fotosEtapa.map((foto) => (
                                                    <div
                                                        key={foto.id}
                                                        className="relative cursor-pointer rounded-lg overflow-hidden aspect-square group"
                                                        onClick={() => setVisorAbierto(foto)}
                                                    >
                                                        <img
                                                            src={`${API_URL}${foto.imagen_url}`}
                                                            alt={t(`rentals.photoStages.${etapa}`, etapa)}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

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
                            alt={t('rentals.enlargedPhoto')}
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-white text-sm">
                                {visorAbierto.notas && <p>{visorAbierto.notas}</p>}
                                {visorAbierto.subido_por_nombre && (
                                    <p className="text-slate-400 text-xs mt-1">
                                        {t('rentals.uploadedBy', { name: visorAbierto.subido_por_nombre })}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setVisorAbierto(null)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30"
                            >
                                <X className="w-4 h-4" />
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
