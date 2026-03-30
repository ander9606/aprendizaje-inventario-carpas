// ============================================
// COMPONENTE: ModalNovedad
// Formulario para reportar novedades desde campo
// Full-screen en tableta
// ============================================

import { useState, useRef } from 'react'
import { X, Camera, AlertTriangle, Package, MapPin, Wrench, MessageSquare, Loader2, Upload, Image } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '@shared/components/Modal'
import { useCrearNovedad } from '../hooks/useOrdenesTrabajo'

const TIPOS_NOVEDAD = [
    {
        key: 'cancelacion_producto',
        label: 'Cancelación de producto',
        description: 'El cliente cancela un producto de la orden',
        icon: Package,
        color: 'red'
    },
    {
        key: 'solicitud_adicional',
        label: 'Solicitud adicional',
        description: 'El cliente necesita algo extra',
        icon: Package,
        color: 'blue'
    },
    {
        key: 'cambio_ubicacion',
        label: 'Cambio de ubicación',
        description: 'Cambio en el lugar del montaje/evento',
        icon: MapPin,
        color: 'purple'
    },
    {
        key: 'dano_elemento',
        label: 'Daño en elemento',
        description: 'Un elemento presenta daño o defecto',
        icon: Wrench,
        color: 'orange'
    },
    {
        key: 'otro',
        label: 'Otro',
        description: 'Otra situación a reportar',
        icon: MessageSquare,
        color: 'slate'
    }
]

const COLOR_CLASSES = {
    red: 'border-red-300 bg-red-50 text-red-700',
    blue: 'border-blue-300 bg-blue-50 text-blue-700',
    purple: 'border-purple-300 bg-purple-50 text-purple-700',
    orange: 'border-orange-300 bg-orange-50 text-orange-700',
    slate: 'border-slate-300 bg-slate-50 text-slate-700'
}

const COLOR_SELECTED = {
    red: 'border-red-500 bg-red-100 ring-2 ring-red-500/20',
    blue: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500/20',
    purple: 'border-purple-500 bg-purple-100 ring-2 ring-purple-500/20',
    orange: 'border-orange-500 bg-orange-100 ring-2 ring-orange-500/20',
    slate: 'border-slate-500 bg-slate-100 ring-2 ring-slate-500/20'
}

export default function ModalNovedad({ ordenId, productos = [], onClose }) {
    const crearNovedad = useCrearNovedad()
    const fileInputRef = useRef(null)

    const [tipoNovedad, setTipoNovedad] = useState(null)
    const [descripcion, setDescripcion] = useState('')
    const [productoId, setProductoId] = useState('')
    const [cantidadAfectada, setCantidadAfectada] = useState(1)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [archivoFoto, setArchivoFoto] = useState(null)

    const handleFotoSeleccionada = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes')
            return
        }

        setArchivoFoto(file)
        const reader = new FileReader()
        reader.onload = (ev) => setFotoPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const handleSubmit = async () => {
        if (!tipoNovedad) {
            toast.error('Selecciona el tipo de novedad')
            return
        }
        if (!descripcion.trim()) {
            toast.error('Describe la novedad')
            return
        }
        if (tipoNovedad === 'dano_elemento' && !archivoFoto) {
            toast.error('Se requiere foto de evidencia para daños')
            return
        }

        const formData = new FormData()
        formData.append('tipo_novedad', tipoNovedad)
        formData.append('descripcion', descripcion.trim())

        if (productoId) formData.append('producto_id', productoId)
        if (cantidadAfectada > 1) formData.append('cantidad_afectada', cantidadAfectada)
        if (archivoFoto) formData.append('imagen', archivoFoto)

        try {
            await crearNovedad.mutateAsync({ ordenId, formData })
            toast.success('Novedad reportada correctamente')
            onClose()
        } catch {
            toast.error('Error al reportar la novedad')
        }
    }

    const necesitaProducto = ['cancelacion_producto', 'dano_elemento'].includes(tipoNovedad)

    return (
        <Modal isOpen={true} onClose={onClose} title="Reportar Novedad" size="md">
            <div className="space-y-4">
                {/* Tipo de novedad */}
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Tipo de novedad *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {TIPOS_NOVEDAD.map(({ key, label, description, icon: Icon, color }) => (
                            <button
                                key={key}
                                onClick={() => setTipoNovedad(key)}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                    tipoNovedad === key
                                        ? COLOR_SELECTED[color]
                                        : `${COLOR_CLASSES[color]} hover:opacity-80`
                                }`}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">{label}</p>
                                    <p className="text-xs opacity-70">{description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selector de producto (condicional) */}
                {necesitaProducto && productos.length > 0 && (
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                            Producto afectado
                        </label>
                        <select
                            value={productoId}
                            onChange={(e) => setProductoId(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">Seleccionar producto...</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.categoria_emoji || ''} {p.nombre} (x{p.cantidad})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Cantidad afectada */}
                {tipoNovedad === 'cancelacion_producto' && (
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                            Cantidad afectada
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={cantidadAfectada}
                            onChange={(e) => setCantidadAfectada(parseInt(e.target.value) || 1)}
                            className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                )}

                {/* Descripción */}
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Descripción *
                    </label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder={
                            tipoNovedad === 'solicitud_adicional'
                                ? 'Describe qué necesita el cliente...'
                                : tipoNovedad === 'dano_elemento'
                                ? 'Describe el daño encontrado...'
                                : 'Describe la novedad...'
                        }
                        rows={3}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                {/* Foto de evidencia */}
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Foto de evidencia {tipoNovedad === 'dano_elemento' ? '*' : '(opcional)'}
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFotoSeleccionada}
                        className="hidden"
                    />

                    {fotoPreview ? (
                        <div className="relative">
                            <img
                                src={fotoPreview}
                                alt="Preview"
                                className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                                onClick={() => { setFotoPreview(null); setArchivoFoto(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
                        >
                            <Camera className="w-5 h-5" />
                            Tomar foto
                        </button>
                    )}
                </div>
            </div>

            <Modal.Footer>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!tipoNovedad || !descripcion.trim() || crearNovedad.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {crearNovedad.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <AlertTriangle className="w-4 h-4" />
                        )}
                        Reportar Novedad
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
}
