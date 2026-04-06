import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
    X, Share2, Printer, Package, Calendar, MapPin, User, CheckCircle,
    ClipboardList, Camera, Image, Pen, MessageCircle, Loader2
} from 'lucide-react'
import { useGetInventarioCliente, useGetFotosOrden, useGetFirmaCliente, useGuardarFirmaCliente } from '../hooks/useOrdenesTrabajo'
import FirmaDigital from '@shared/components/FirmaDigital'
import Spinner from '@shared/components/Spinner'
import Modal from '@shared/components/Modal'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const ESTADO_LABELS_KEYS = {
    nuevo: 'stateNew',
    bueno: 'stateGood',
    mantenimiento: 'stateMaintenance'
}

const ESTADO_COLORS = {
    nuevo: 'bg-green-100 text-green-700',
    bueno: 'bg-blue-100 text-blue-700',
    mantenimiento: 'bg-yellow-100 text-yellow-700'
}

function formatFecha(fecha) {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

export default function ModalInventarioCliente({ ordenId, onClose }) {
  const { t } = useTranslation()
    const { inventario, isLoading, error } = useGetInventarioCliente(ordenId, { enabled: !!ordenId })
    const { porEtapa } = useGetFotosOrden(ordenId)
    const { firma } = useGetFirmaCliente(ordenId)
    const guardarFirma = useGuardarFirmaCliente()

    const printRef = useRef(null)
    const [nombreFirmante, setNombreFirmante] = useState('')
    const [mostrarFirma, setMostrarFirma] = useState(false)
    const [visorFoto, setVisorFoto] = useState(null)

    const fotosMontaje = porEtapa?.montaje_terminado || []
    const tieneFirma = firma?.firma_cliente_url

    const handleConfirmarFirma = async (firmaBase64) => {
        if (!nombreFirmante.trim()) {
            toast.error(t('operations.clientInventoryModal.enterReceiverName'))
            return
        }

        try {
            await guardarFirma.mutateAsync({
                ordenId,
                datos: { firma: firmaBase64, nombre: nombreFirmante.trim() }
            })
            toast.success(t('operations.clientInventoryModal.signatureSaved'))
            setMostrarFirma(false)
        } catch {
            toast.error(t('operations.clientInventoryModal.signatureSaveError'))
        }
    }

    const handleImprimir = () => {
        const contenido = printRef.current
        if (!contenido) return

        const ventana = window.open('', '_blank')
        ventana.document.write(`
            <html>
            <head>
                <title>Inventario de Montaje - ${inventario?.cliente?.nombre || 'Cliente'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 24px; font-size: 13px; }
                    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f97316; padding-bottom: 16px; }
                    .header h1 { font-size: 20px; color: #1e293b; margin-bottom: 4px; }
                    .header p { color: #64748b; font-size: 12px; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 16px; }
                    .info-item { display: flex; gap: 6px; }
                    .info-label { color: #64748b; min-width: 110px; }
                    .info-value { font-weight: 500; }
                    .product { margin-bottom: 16px; page-break-inside: avoid; }
                    .product-header { background: #f8fafc; padding: 8px 12px; border-radius: 6px; font-weight: 600; margin-bottom: 6px; display: flex; justify-content: space-between; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th { text-align: left; padding: 6px 8px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; }
                    td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
                    .badge { display: inline-block; padding: 1px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
                    .badge-green { background: #dcfce7; color: #15803d; }
                    .badge-blue { background: #dbeafe; color: #1d4ed8; }
                    .badge-yellow { background: #fef9c3; color: #a16207; }
                    .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                    .desmontaje-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; margin-top: 16px; text-align: center; }
                    .desmontaje-box strong { color: #c2410c; }
                    .fotos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
                    .fotos-grid img { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; }
                    .firma-section { margin-top: 24px; text-align: center; }
                    .firma-section img { max-width: 250px; border: 1px solid #e2e8f0; border-radius: 8px; }
                    @media print { body { padding: 12px; } .fotos-grid img { height: 100px; } }
                </style>
            </head>
            <body>
                ${contenido.innerHTML}
            </body>
            </html>
        `)
        ventana.document.close()
        ventana.focus()
        ventana.print()
    }

    const generarTextoCompartir = () => {
        if (!inventario) return ''

        let texto = `*INVENTARIO DE MONTAJE*\n`
        texto += `${'─'.repeat(25)}\n\n`
        texto += `*Cliente:* ${inventario.cliente?.nombre || '-'}\n`
        texto += `*Evento:* ${inventario.evento?.nombre || '-'}\n`
        texto += `*Lugar:* ${inventario.evento?.direccion || '-'}, ${inventario.evento?.ciudad || '-'}\n`
        texto += `*Fecha montaje:* ${formatFecha(inventario.fecha_montaje_completado)}\n`

        if (inventario.evento?.fecha_desmontaje) {
            texto += `*Fecha desmontaje:* ${formatFecha(inventario.evento.fecha_desmontaje)}\n`
        }

        texto += `\n*PRODUCTOS INSTALADOS:*\n`

        inventario.productos?.forEach(p => {
            texto += `\n${p.categoria_emoji || ''} *${p.nombre}* (x${p.cantidad})\n`
            p.componentes?.forEach(c => {
                const cantTotal = c.cantidad * p.cantidad
                texto += `  • ${c.elemento_nombre}: ${cantTotal} und`
                if (c.elementos_asignados?.length > 0) {
                    const estado = c.elementos_asignados[0].estado_salida
                    texto += ` [${ESTADO_LABELS[estado] || estado}]`
                }
                texto += `\n`
            })
        })

        texto += `\n*Total:* ${inventario.total_elementos} elementos entregados`

        if (tieneFirma) {
            texto += `\n\n✅ *Firmado por:* ${firma.firma_cliente_nombre}`
            texto += `\n*Fecha firma:* ${formatFecha(firma.firma_cliente_fecha)}`
        }

        return texto
    }

    const handleCompartir = async () => {
        const texto = generarTextoCompartir()
        if (!texto) return

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Inventario - ${inventario.cliente?.nombre}`,
                    text: texto
                })
            } catch {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(texto)
            toast.success(t('operations.clientInventoryModal.copiedToClipboard'))
        }
    }

    const handleWhatsApp = () => {
        const texto = generarTextoCompartir()
        if (!texto) return

        const telefono = inventario.cliente?.telefono?.replace(/\D/g, '') || ''
        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
        window.open(url, '_blank')
    }

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={t('operations.clientInventoryModal.clientInventoryTitle')} size="xl">
                {/* Action buttons toolbar */}
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={handleWhatsApp}
                        disabled={isLoading || !inventario}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        title={t("operations.sendWhatsApp")}
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                    <button
                        onClick={handleCompartir}
                        disabled={isLoading || !inventario}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('operations.clientInventoryModal.share')}</span>
                    </button>
                    <button
                        onClick={handleImprimir}
                        disabled={isLoading || !inventario}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('common.print')}</span>
                    </button>
                </div>

                {/* Contenido */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Spinner />
                    </div>
                )}

                {error && (
                    <div className="text-center py-12 text-red-600">
                        <p>{t('operations.clientInventoryModal.loadError')}</p>
                        <p className="text-sm mt-1">{error.message}</p>
                    </div>
                )}

                {inventario && (
                    <div ref={printRef}>
                        {/* Encabezado documento */}
                        <div className="header text-center mb-6 pb-4 border-b-2 border-orange-400">
                            <h1 className="text-xl font-bold text-slate-900">{t('operations.clientInventoryModal.assemblyInventory')}</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                {t('operations.clientInventoryModal.orderDate', { id: inventario.orden_id, date: formatFecha(inventario.fecha_montaje_completado) })}
                            </p>
                        </div>

                        {/* Info del evento y cliente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="section bg-slate-50 rounded-lg p-4">
                                <h4 className="section-title text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> {t('operations.orderDetailModal.client')}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium text-slate-900">{inventario.cliente?.nombre || '-'}</p>
                                    {inventario.cliente?.numero_documento && (
                                        <p className="text-slate-500">
                                            {inventario.cliente.tipo_documento}: {inventario.cliente.numero_documento}
                                        </p>
                                    )}
                                    {inventario.cliente?.telefono && (
                                        <p className="text-slate-500">{inventario.cliente.telefono}</p>
                                    )}
                                </div>
                            </div>

                            <div className="section bg-slate-50 rounded-lg p-4">
                                <h4 className="section-title text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {t('operations.orderDetailModal.event')}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium text-slate-900">{inventario.evento?.nombre || '-'}</p>
                                    {inventario.evento?.direccion && (
                                        <p className="text-slate-500">{inventario.evento.direccion}</p>
                                    )}
                                    {inventario.evento?.ciudad && (
                                        <p className="text-slate-500">{inventario.evento.ciudad}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fecha desmontaje destacada */}
                        {inventario.evento?.fecha_desmontaje && (
                            <div className="desmontaje-box bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-center">
                                <div className="flex items-center justify-center gap-2 text-orange-700">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-semibold">{t('operations.clientInventoryModal.scheduledDisassembly')}</span>
                                </div>
                                <p className="text-lg font-bold text-orange-800 mt-1">
                                    {formatFecha(inventario.evento.fecha_desmontaje)}
                                </p>
                            </div>
                        )}

                        {/* Fotos del montaje terminado */}
                        {fotosMontaje.length > 0 && (
                            <div className="section mb-6">
                                <h4 className="section-title text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
                                    <Camera className="w-4 h-4" />
                                    {t('operations.clientInventoryModal.assemblyPhotos', { count: fotosMontaje.length })}
                                </h4>
                                <div className="fotos-grid grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {fotosMontaje.map((foto) => (
                                        <div
                                            key={foto.id}
                                            className="cursor-pointer rounded-lg overflow-hidden aspect-video group"
                                            onClick={() => setVisorFoto(foto)}
                                        >
                                            <img
                                                src={`${API_URL}${foto.imagen_url}`}
                                                alt={t("operations.assemblyFinished")}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Productos con desglose */}
                        <div className="section mb-4">
                            <h4 className="section-title text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                {t('operations.clientInventoryModal.installedProducts', { count: inventario.resumen?.total_productos || 0 })}
                            </h4>

                            <div className="space-y-4">
                                {inventario.productos?.map((producto) => (
                                    <div key={producto.id} className="product border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="product-header bg-slate-50 px-4 py-3 flex items-center justify-between">
                                            <span className="font-semibold text-slate-900">
                                                {producto.categoria_emoji || ''} {producto.nombre}
                                            </span>
                                            <span className="text-sm text-slate-500">
                                                x{producto.cantidad}
                                            </span>
                                        </div>

                                        {producto.componentes?.length > 0 && (
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50/50">
                                                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Elemento</th>
                                                        <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500">Cantidad</th>
                                                        <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {producto.componentes.map((comp) => {
                                                        const cantTotal = comp.cantidad * producto.cantidad
                                                        const estadoPrincipal = comp.elementos_asignados?.[0]?.estado_salida || 'bueno'

                                                        return (
                                                            <tr key={comp.id} className="border-t border-slate-100">
                                                                <td className="px-4 py-2.5 text-slate-800">
                                                                    {comp.elemento_nombre}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-center text-slate-600">
                                                                    {cantTotal}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-center">
                                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[estadoPrincipal] || 'bg-slate-100 text-slate-600'}`}>
                                                                        {ESTADO_LABELS_KEYS[estadoPrincipal] ? t(`operations.clientInventoryModal.${ESTADO_LABELS_KEYS[estadoPrincipal]}`) : estadoPrincipal}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="mt-6 flex items-center justify-between bg-slate-50 rounded-lg p-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>
                                    {t('operations.clientInventoryModal.productsElementsDelivered', { products: inventario.resumen?.total_productos || 0, elements: inventario.total_elementos || 0 })}
                                </span>
                            </div>
                        </div>

                        {/* Firma del cliente */}
                        <div className="firma-section mt-6 pt-4 border-t border-slate-200">
                            {tieneFirma ? (
                                <div className="text-center">
                                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center justify-center gap-2">
                                        <Pen className="w-4 h-4" />
                                        {t('operations.clientInventoryModal.receiverSignature')}
                                    </h4>
                                    <img
                                        src={`${API_URL}${firma.firma_cliente_url}`}
                                        alt={t('operations.clientInventoryModal.clientSignature')}
                                        className="max-w-[250px] mx-auto border border-slate-200 rounded-lg"
                                    />
                                    <p className="text-sm font-medium text-slate-700 mt-2">
                                        {firma.firma_cliente_nombre}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {formatFecha(firma.firma_cliente_fecha)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {!mostrarFirma ? (
                                        <button
                                            onClick={() => setMostrarFirma(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
                                        >
                                            <Pen className="w-4 h-4" />
                                            {t('operations.clientInventoryModal.requestSignature')}
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Pen className="w-4 h-4" />
                                                {t('operations.clientInventoryModal.receiverSignature')}
                                            </h4>
                                            <input
                                                type="text"
                                                value={nombreFirmante}
                                                onChange={(e) => setNombreFirmante(e.target.value)}
                                                placeholder={t('operations.clientInventoryModal.receiverFullName')}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <FirmaDigital
                                                onConfirm={handleConfirmarFirma}
                                                width={400}
                                                height={180}
                                                disabled={guardarFirma.isPending}
                                            />
                                            {guardarFirma.isPending && (
                                                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t('operations.clientInventoryModal.savingSignature')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="footer text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200">
                            <p>Documento generado el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="mt-1">{t('operations.clientInventoryModal.documentCertification')}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Visor de foto ampliada */}
            {visorFoto && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
                    onClick={() => setVisorFoto(null)}
                >
                    <div onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full">
                        <img
                            src={`${API_URL}${visorFoto.imagen_url}`}
                            alt={t("operations.enlargedPhoto")}
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setVisorFoto(null)}
                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
