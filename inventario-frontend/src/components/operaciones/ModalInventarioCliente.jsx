import { useRef } from 'react'
import { X, Share2, Printer, Package, Calendar, MapPin, User, CheckCircle, ClipboardList } from 'lucide-react'
import { useGetInventarioCliente } from '../../hooks/useOrdenesTrabajo'
import Spinner from '../common/Spinner'

const ESTADO_LABELS = {
    nuevo: 'Nuevo',
    bueno: 'Buen estado',
    mantenimiento: 'Aceptable'
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
    const { inventario, isLoading, error } = useGetInventarioCliente(ordenId, { enabled: !!ordenId })
    const printRef = useRef(null)

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
                    @media print { body { padding: 12px; } }
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

    const handleCompartir = async () => {
        if (!inventario) return

        // Generar texto resumen para compartir
        let texto = `INVENTARIO DE MONTAJE\n`
        texto += `${'='.repeat(30)}\n\n`
        texto += `Cliente: ${inventario.cliente?.nombre || '-'}\n`
        texto += `Evento: ${inventario.evento?.nombre || '-'}\n`
        texto += `Lugar: ${inventario.evento?.direccion || '-'}, ${inventario.evento?.ciudad || '-'}\n`
        texto += `Fecha montaje: ${formatFecha(inventario.fecha_montaje_completado)}\n`

        if (inventario.evento?.fecha_desmontaje) {
            texto += `Fecha desmontaje: ${formatFecha(inventario.evento.fecha_desmontaje)}\n`
        }

        texto += `\nPRODUCTOS INSTALADOS:\n`
        texto += `${'-'.repeat(30)}\n`

        inventario.productos?.forEach(p => {
            texto += `\n${p.categoria_emoji || ''} ${p.nombre} (x${p.cantidad})\n`
            p.componentes?.forEach(c => {
                const cantTotal = c.cantidad * p.cantidad
                texto += `  - ${c.elemento_nombre}: ${cantTotal} und`
                if (c.elementos_asignados?.length > 0) {
                    const estado = c.elementos_asignados[0].estado_salida
                    texto += ` [${ESTADO_LABELS[estado] || estado}]`
                }
                texto += `\n`
            })
        })

        texto += `\nTotal elementos: ${inventario.total_elementos}\n`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Inventario - ${inventario.cliente?.nombre}`,
                    text: texto
                })
            } catch {
                // User cancelled share
            }
        } else {
            await navigator.clipboard.writeText(texto)
            alert('Inventario copiado al portapapeles')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Inventario del Cliente</h3>
                            <p className="text-sm text-slate-500">Documento de entrega de montaje</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCompartir}
                            disabled={isLoading || !inventario}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Share2 className="w-4 h-4" />
                            Compartir
                        </button>
                        <button
                            onClick={handleImprimir}
                            disabled={isLoading || !inventario}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="overflow-y-auto flex-1 p-6">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Spinner />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12 text-red-600">
                            <p>Error al cargar el inventario</p>
                            <p className="text-sm mt-1">{error.message}</p>
                        </div>
                    )}

                    {inventario && (
                        <div ref={printRef}>
                            {/* Encabezado documento */}
                            <div className="header text-center mb-6 pb-4 border-b-2 border-orange-400">
                                <h1 className="text-xl font-bold text-slate-900">Inventario de Montaje</h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    Orden #{inventario.orden_id} - {formatFecha(inventario.fecha_montaje_completado)}
                                </p>
                            </div>

                            {/* Info del evento y cliente */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="section bg-slate-50 rounded-lg p-4">
                                    <h4 className="section-title text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Cliente
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
                                        <MapPin className="w-4 h-4" /> Evento
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
                                        <span className="font-semibold">Desmontaje programado</span>
                                    </div>
                                    <p className="text-lg font-bold text-orange-800 mt-1">
                                        {formatFecha(inventario.evento.fecha_desmontaje)}
                                    </p>
                                </div>
                            )}

                            {/* Productos con desglose */}
                            <div className="section mb-4">
                                <h4 className="section-title text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Productos Instalados ({inventario.resumen?.total_productos || 0})
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
                                                            <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500">Identificador</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {producto.componentes.map((comp) => {
                                                            const cantTotal = comp.cantidad * producto.cantidad
                                                            const estadoPrincipal = comp.elementos_asignados?.[0]?.estado_salida || 'bueno'
                                                            const identificadores = comp.elementos_asignados
                                                                ?.map(ea => ea.serie_codigo || ea.lote_codigo)
                                                                .filter(Boolean)

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
                                                                            {ESTADO_LABELS[estadoPrincipal] || estadoPrincipal}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-center text-xs text-slate-400 font-mono">
                                                                        {identificadores?.length > 0
                                                                            ? identificadores.join(', ')
                                                                            : '-'
                                                                        }
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
                                        {inventario.resumen?.total_productos || 0} producto(s),{' '}
                                        {inventario.total_elementos || 0} elemento(s) entregados
                                    </span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="footer text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200">
                                <p>Documento generado el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="mt-1">Este documento certifica la entrega del inventario en el sitio del evento.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
